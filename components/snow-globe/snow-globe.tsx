'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { RotateCcw } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const SNOW_COUNT = 180;
const GLOBE_CENTRE_Y = 0.25;
const GLOBE_RADIUS = 2.3;
const SNOW_FLOOR = -0.96;

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function createSnowParticles() {
  const random = seededRandom(0x5a0f10be);
  const positions = new Float32Array(SNOW_COUNT * 3);
  const velocities = new Float32Array(SNOW_COUNT * 3);

  for (let index = 0; index < SNOW_COUNT; index += 1) {
    const offset = index * 3;
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * 1.95;
    positions[offset] = Math.cos(angle) * distance;
    positions[offset + 1] = SNOW_FLOOR + random() * 3.15;
    positions[offset + 2] = Math.sin(angle) * distance;
    velocities[offset] = (random() - 0.5) * 0.08;
    velocities[offset + 1] = -random() * 0.08;
    velocities[offset + 2] = (random() - 0.5) * 0.08;
  }

  return { positions, velocities };
}

function Snowfall({
  shakeSignal,
  reducedMotion,
}: {
  shakeSignal: number;
  reducedMotion: boolean;
}) {
  const geometry = useRef<THREE.BufferGeometry>(null);
  const particles = useRef<ReturnType<typeof createSnowParticles> | null>(null);
  const invalidate = useThree(state => state.invalidate);

  useEffect(() => {
    const current = geometry.current;
    if (!current) return;
    const particleState = createSnowParticles();
    particles.current = particleState;
    current.setAttribute(
      'position',
      new THREE.BufferAttribute(particleState.positions, 3)
    );
    current.computeBoundingSphere();
    invalidate();
  }, [invalidate]);

  useEffect(() => {
    if (shakeSignal === 0 || reducedMotion) return;
    const particleState = particles.current;
    if (!particleState) return;
    const random = seededRandom(0x77e21 + shakeSignal * 9_973);

    for (let index = 0; index < SNOW_COUNT; index += 1) {
      const offset = index * 3;
      const angle = random() * Math.PI * 2;
      const force = 1.6 + random() * 2.3;
      particleState.velocities[offset] += Math.cos(angle) * force;
      particleState.velocities[offset + 1] = 2.4 + random() * 3.2;
      particleState.velocities[offset + 2] += Math.sin(angle) * force;
      if (particleState.positions[offset + 1] < -0.72) {
        particleState.positions[offset + 1] = -0.72 + random() * 0.35;
      }
    }

    const position = geometry.current?.getAttribute('position');
    if (position) position.needsUpdate = true;
    invalidate();
  }, [invalidate, reducedMotion, shakeSignal]);

  useFrame((_, rawDelta) => {
    if (reducedMotion) return;
    const delta = Math.min(rawDelta, 1 / 30);
    const particleState = particles.current;
    if (!particleState) return;
    const { positions, velocities } = particleState;

    for (let index = 0; index < SNOW_COUNT; index += 1) {
      const offset = index * 3;
      velocities[offset + 1] -= 1.55 * delta;
      const drag = Math.pow(0.988, delta * 60);
      velocities[offset] *= drag;
      velocities[offset + 1] *= Math.pow(0.996, delta * 60);
      velocities[offset + 2] *= drag;

      positions[offset] += velocities[offset] * delta;
      positions[offset + 1] += velocities[offset + 1] * delta;
      positions[offset + 2] += velocities[offset + 2] * delta;

      if (positions[offset + 1] < SNOW_FLOOR) {
        positions[offset + 1] = SNOW_FLOOR;
        velocities[offset] *= 0.76;
        velocities[offset + 1] *= -0.16;
        velocities[offset + 2] *= 0.76;
      }

      const dx = positions[offset];
      const dy = positions[offset + 1] - GLOBE_CENTRE_Y;
      const dz = positions[offset + 2];
      const distance = Math.hypot(dx, dy, dz);
      const limit = GLOBE_RADIUS - 0.07;

      if (distance > limit) {
        const scale = limit / Math.max(distance, 0.001);
        positions[offset] = dx * scale;
        positions[offset + 1] = GLOBE_CENTRE_Y + dy * scale;
        positions[offset + 2] = dz * scale;
        const nx = dx / distance;
        const ny = dy / distance;
        const nz = dz / distance;
        const outward =
          velocities[offset] * nx +
          velocities[offset + 1] * ny +
          velocities[offset + 2] * nz;
        if (outward > 0) {
          velocities[offset] -= nx * outward * 1.35;
          velocities[offset + 1] -= ny * outward * 1.35;
          velocities[offset + 2] -= nz * outward * 1.35;
        }
      }
    }

    const position = geometry.current?.getAttribute('position');
    if (position) position.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometry} />
      <pointsMaterial
        color="#fffdf5"
        size={0.055}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}

function Pine({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.09, 0.12, 0.7, 8]} />
        <meshStandardMaterial color="#594233" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <coneGeometry args={[0.54, 1.05, 10]} />
        <meshStandardMaterial color="#31594e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <coneGeometry args={[0.42, 0.86, 10]} />
        <meshStandardMaterial color="#3b685b" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Cabin() {
  return (
    <group position={[-0.42, -0.5, 0.04]} rotation={[0, -0.12, 0]}>
      <mesh>
        <boxGeometry args={[1.18, 0.78, 0.96]} />
        <meshStandardMaterial color="#80574b" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.63, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.86, 0.72, 4]} />
        <meshStandardMaterial color="#d7d1c5" roughness={0.96} />
      </mesh>
      <mesh position={[0.27, 0.86, -0.18]}>
        <boxGeometry args={[0.18, 0.55, 0.2]} />
        <meshStandardMaterial color="#65504a" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.15, 0.5]}>
        <boxGeometry args={[0.27, 0.48, 0.035]} />
        <meshStandardMaterial color="#4d3a34" roughness={0.92} />
      </mesh>
      <mesh position={[-0.36, 0.08, 0.5]}>
        <boxGeometry args={[0.25, 0.23, 0.04]} />
        <meshStandardMaterial
          color="#ffd981"
          emissive="#eaa83d"
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[-0.36, 0.08, 0.72]} color="#ffc96b" intensity={3.2} distance={2.7} />
    </group>
  );
}

function GlobeScene({
  shakeSignal,
  reducedMotion,
}: {
  shakeSignal: number;
  reducedMotion: boolean;
}) {
  const world = useRef<THREE.Group>(null);
  const wobble = useRef(0);

  useEffect(() => {
    if (!reducedMotion && shakeSignal > 0) wobble.current = 1;
  }, [reducedMotion, shakeSignal]);

  useFrame(({ clock }, delta) => {
    const group = world.current;
    if (!group || reducedMotion) return;
    group.rotation.y += delta * 0.16;
    if (wobble.current > 0.002) {
      const phase = clock.elapsedTime * 24;
      group.rotation.z = Math.sin(phase) * 0.075 * wobble.current;
      group.position.x = Math.cos(phase * 0.83) * 0.11 * wobble.current;
      wobble.current *= Math.pow(0.035, delta);
    } else {
      group.rotation.z *= 0.88;
      group.position.x *= 0.88;
    }
  });

  return (
    <>
      <ambientLight intensity={1.35} />
      <directionalLight position={[4, 6, 5]} intensity={2.6} color="#fff7df" />
      <directionalLight position={[-4, 2, -3]} intensity={1.15} color="#9fbaff" />

      <group ref={world} rotation={[0.03, -0.35, 0]}>
        <mesh position={[0, -1.12, 0]} receiveShadow>
          <cylinderGeometry args={[2.08, 2.18, 0.34, 48]} />
          <meshStandardMaterial color="#e8e5dc" roughness={0.98} />
        </mesh>
        <Cabin />
        <Pine position={[0.9, -0.47, -0.18]} scale={1.18} />
        <Pine position={[1.42, -0.66, 0.24]} scale={0.72} />
        <Pine position={[-1.38, -0.68, -0.42]} scale={0.64} />
        <Snowfall shakeSignal={shakeSignal} reducedMotion={reducedMotion} />
      </group>

      <mesh position={[0, GLOBE_CENTRE_Y, 0]} renderOrder={3}>
        <sphereGeometry args={[2.42, 48, 32]} />
        <meshPhysicalMaterial
          color="#bfd8ff"
          transparent
          opacity={0.16}
          roughness={0.08}
          metalness={0.04}
          clearcoat={1}
          clearcoatRoughness={0.08}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, -2.07, 0]}>
        <cylinderGeometry args={[1.95, 2.28, 0.72, 56]} />
        <meshStandardMaterial color="#3f333e" roughness={0.68} metalness={0.12} />
      </mesh>
      <mesh position={[0, -1.73, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.98, 0.075, 12, 64]} />
        <meshStandardMaterial color="#8b7184" roughness={0.5} metalness={0.2} />
      </mesh>
    </>
  );
}

export function SnowGlobe() {
  const reducedMotion = Boolean(useReducedMotion());
  const [shakeSignal, setShakeSignal] = useState(0);

  return (
    <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-center">
      <div
        className="relative min-h-[27rem] overflow-hidden rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_50%_32%,#dbe7ff_0%,#afbfd9_30%,#667087_68%,#272a35_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_24px_70px_rgba(20,24,38,0.18)] dark:bg-[radial-gradient(circle_at_50%_30%,#354563_0%,#1f2738_38%,#10131c_76%,#090a0f_100%)] sm:min-h-[36rem]"
        data-snow-globe-stage
        role="img"
        aria-label="A dimensional snow globe with a warm cabin, pine trees, and simulated snow"
      >
        <Canvas
          camera={{ position: [0, 0.62, 7.2], fov: 43 }}
          dpr={[1, 1.5]}
          frameloop={reducedMotion ? 'demand' : 'always'}
          gl={{
            alpha: true,
            antialias: false,
            powerPreference: 'high-performance',
          }}
          data-snow-globe-canvas
        >
          <GlobeScene shakeSignal={shakeSignal} reducedMotion={reducedMotion} />
        </Canvas>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-[linear-gradient(120deg,rgba(255,255,255,0.22),transparent_38%)]" aria-hidden="true" />
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Auto orbit
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The scene turns on its own. Rattle it when the snow settles.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShakeSignal(current => current + 1)}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform active:scale-[0.97] motion-reduce:transition-none"
          aria-label="Rattle the globe"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Rattle the globe
        </button>
      </div>
    </section>
  );
}
