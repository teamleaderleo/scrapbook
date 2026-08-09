'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { RotateCcw } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const SNOW_COUNT = 210;
const GLOBE_CENTRE_Y = 0.34;
const GLOBE_RADIUS = 2.34;
const SNOW_FLOOR = -0.92;
const CAMERA_DISTANCE = 7.25;
const CAMERA_REFERENCE_ASPECT = 0.72;

const cabinGable = new THREE.Shape();
cabinGable.moveTo(-0.76, 0);
cabinGable.lineTo(0.76, 0);
cabinGable.lineTo(0, 0.72);
cabinGable.closePath();

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
    positions[offset + 1] = SNOW_FLOOR + random() * 3.2;
    positions[offset + 2] = Math.sin(angle) * distance;
    velocities[offset] = (random() - 0.5) * 0.07;
    velocities[offset + 1] = -random() * 0.07;
    velocities[offset + 2] = (random() - 0.5) * 0.07;
  }

  return { positions, velocities };
}

function ResponsiveCamera() {
  const camera = useThree(state => state.camera);
  const width = useThree(state => state.size.width);
  const height = useThree(state => state.size.height);
  const invalidate = useThree(state => state.invalidate);

  useEffect(() => {
    const aspect = width / Math.max(height, 1);
    const distance = Math.min(
      11.2,
      Math.max(
        CAMERA_DISTANCE,
        CAMERA_DISTANCE * (CAMERA_REFERENCE_ASPECT / aspect)
      )
    );
    camera.position.set(0, 0.35, distance);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, height, invalidate, width]);

  return null;
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
      const force = 1.8 + random() * 2.5;
      particleState.velocities[offset] += Math.cos(angle) * force;
      particleState.velocities[offset + 1] = 2.8 + random() * 3.4;
      particleState.velocities[offset + 2] += Math.sin(angle) * force;
      if (particleState.positions[offset + 1] < -0.65) {
        particleState.positions[offset + 1] = -0.65 + random() * 0.42;
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
      velocities[offset + 1] -= 1.62 * delta;
      const drag = Math.pow(0.987, delta * 60);
      velocities[offset] *= drag;
      velocities[offset + 1] *= Math.pow(0.996, delta * 60);
      velocities[offset + 2] *= drag;

      positions[offset] += velocities[offset] * delta;
      positions[offset + 1] += velocities[offset + 1] * delta;
      positions[offset + 2] += velocities[offset + 2] * delta;

      if (positions[offset + 1] < SNOW_FLOOR) {
        positions[offset + 1] = SNOW_FLOOR;
        velocities[offset] *= 0.74;
        velocities[offset + 1] *= -0.14;
        velocities[offset + 2] *= 0.74;
      }

      const dx = positions[offset];
      const dy = positions[offset + 1] - GLOBE_CENTRE_Y;
      const dz = positions[offset + 2];
      const distance = Math.hypot(dx, dy, dz);
      const limit = GLOBE_RADIUS - 0.08;

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
          velocities[offset] -= nx * outward * 1.36;
          velocities[offset + 1] -= ny * outward * 1.36;
          velocities[offset + 2] -= nz * outward * 1.36;
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
        size={0.052}
        sizeAttenuation
        transparent
        opacity={0.92}
        depthWrite={false}
      />
    </points>
  );
}

function SnowPine({
  position,
  scale = 1,
  rotation = 0,
}: {
  position: [number, number, number];
  scale?: number;
  rotation?: number;
}) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.075, 0.11, 0.72, 7]} />
        <meshStandardMaterial color="#554035" roughness={0.96} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <coneGeometry args={[0.55, 0.78, 9]} />
        <meshStandardMaterial color="#284d49" roughness={0.93} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <coneGeometry args={[0.43, 0.75, 9]} />
        <meshStandardMaterial color="#35605a" roughness={0.93} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <coneGeometry args={[0.3, 0.62, 9]} />
        <meshStandardMaterial color="#47726a" roughness={0.93} />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <coneGeometry args={[0.46, 0.16, 9]} />
        <meshStandardMaterial color="#e5e6e2" roughness={1} />
      </mesh>
      <mesh position={[0, 0.68, 0]}>
        <coneGeometry args={[0.34, 0.14, 9]} />
        <meshStandardMaterial color="#f0f0eb" roughness={1} />
      </mesh>
    </group>
  );
}

function Window({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.34, 0.31, 0.045]} />
        <meshStandardMaterial
          color="#ffd77d"
          emissive="#e99d32"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, 0.026]}>
        <boxGeometry args={[0.025, 0.33, 0.026]} />
        <meshStandardMaterial color="#4d3b38" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.027]}>
        <boxGeometry args={[0.36, 0.025, 0.026]} />
        <meshStandardMaterial color="#4d3b38" roughness={0.9} />
      </mesh>
    </group>
  );
}

function ReadingCabin() {
  return (
    <group position={[-0.32, -0.32, 0.12]} rotation={[0, -0.08, 0]}>
      <mesh position={[0, -0.64, 0]}>
        <boxGeometry args={[1.72, 0.18, 1.34]} />
        <meshStandardMaterial color="#6f5b52" roughness={0.94} />
      </mesh>
      <mesh position={[0, -0.17, 0]}>
        <boxGeometry args={[1.52, 0.82, 1.16]} />
        <meshStandardMaterial color="#976d5b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.24, 0.586]}>
        <shapeGeometry args={[cabinGable]} />
        <meshStandardMaterial
          color="#a67862"
          roughness={0.92}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[-0.4, 0.46, 0]} rotation={[0, 0, 0.59]}>
        <boxGeometry args={[1.08, 0.13, 1.5]} />
        <meshStandardMaterial color="#51445b" roughness={0.82} />
      </mesh>
      <mesh position={[0.4, 0.46, 0]} rotation={[0, 0, -0.59]}>
        <boxGeometry args={[1.08, 0.13, 1.5]} />
        <meshStandardMaterial color="#51445b" roughness={0.82} />
      </mesh>
      <mesh position={[-0.41, 0.535, 0]} rotation={[0, 0, 0.59]}>
        <boxGeometry args={[0.98, 0.055, 1.43]} />
        <meshStandardMaterial color="#e7e4df" roughness={1} />
      </mesh>
      <mesh position={[0.41, 0.535, 0]} rotation={[0, 0, -0.59]}>
        <boxGeometry args={[0.98, 0.055, 1.43]} />
        <meshStandardMaterial color="#f0eee9" roughness={1} />
      </mesh>

      <mesh position={[0.31, 0.8, -0.17]}>
        <boxGeometry args={[0.2, 0.58, 0.24]} />
        <meshStandardMaterial color="#55464a" roughness={0.88} />
      </mesh>
      <mesh position={[0.31, 1.1, -0.17]}>
        <boxGeometry args={[0.26, 0.08, 0.3]} />
        <meshStandardMaterial color="#40363b" roughness={0.85} />
      </mesh>

      <mesh position={[0.32, -0.29, 0.598]}>
        <boxGeometry args={[0.34, 0.58, 0.06]} />
        <meshStandardMaterial color="#493b38" roughness={0.94} />
      </mesh>
      <mesh position={[0.21, -0.27, 0.635]}>
        <sphereGeometry args={[0.025, 10, 8]} />
        <meshStandardMaterial
          color="#d7b46b"
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>
      <Window position={[-0.35, -0.12, 0.61]} />
      <mesh position={[0.31, -0.62, 0.74]}>
        <boxGeometry args={[0.58, 0.1, 0.34]} />
        <meshStandardMaterial color="#776158" roughness={0.95} />
      </mesh>
      <pointLight
        position={[-0.18, 0, 0.92]}
        color="#ffc66b"
        intensity={3.4}
        distance={3.1}
      />
    </group>
  );
}

function WinterGround() {
  const stones = [
    [-0.02, -0.8, 1.12],
    [0.18, -0.79, 1.38],
    [0.05, -0.78, 1.62],
  ] as const;

  return (
    <group>
      <mesh position={[0, -1.03, 0]} scale={[1, 0.24, 1]}>
        <sphereGeometry args={[2.08, 36, 18]} />
        <meshStandardMaterial color="#ebeae5" roughness={1} />
      </mesh>
      <mesh position={[0.82, -0.77, 0.92]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshPhysicalMaterial
          color="#8bb2c3"
          roughness={0.18}
          metalness={0.08}
          clearcoat={0.9}
          clearcoatRoughness={0.12}
        />
      </mesh>
      {stones.map((position, index) => (
        <mesh key={index} position={position} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[0.13, 12, 8]} />
          <meshStandardMaterial color="#b7aaa0" roughness={0.96} />
        </mesh>
      ))}
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
    const time = clock.elapsedTime;
    group.rotation.y = -0.26 + Math.sin(time * 0.22) * 0.3;
    if (wobble.current > 0.002) {
      const phase = time * 28;
      group.rotation.z = Math.sin(phase) * 0.095 * wobble.current;
      group.position.x = Math.cos(phase * 0.81) * 0.14 * wobble.current;
      group.position.y = Math.sin(phase * 1.13) * 0.035 * wobble.current;
      wobble.current *= Math.pow(0.03, delta);
    } else {
      group.rotation.z *= 0.86;
      group.position.x *= 0.86;
      group.position.y *= 0.86;
    }
  });

  return (
    <>
      <ambientLight intensity={1.2} />
      <hemisphereLight args={['#dce8ff', '#392f41', 1.25]} />
      <directionalLight position={[4, 6, 5]} intensity={2.4} color="#fff6dc" />
      <directionalLight
        position={[-4, 2, -3]}
        intensity={1.25}
        color="#8faee8"
      />

      <group ref={world} rotation={[0.025, -0.26, 0]}>
        <WinterGround />
        <ReadingCabin />
        <SnowPine position={[1.2, -0.46, -0.28]} scale={1.05} rotation={0.3} />
        <SnowPine position={[1.62, -0.66, 0.18]} scale={0.62} rotation={-0.4} />
        <SnowPine position={[-1.5, -0.65, -0.44]} scale={0.58} rotation={0.7} />
        <Snowfall shakeSignal={shakeSignal} reducedMotion={reducedMotion} />
      </group>

      <mesh position={[0, GLOBE_CENTRE_Y, 0]} renderOrder={3}>
        <sphereGeometry args={[2.43, 52, 36]} />
        <meshPhysicalMaterial
          color="#c7dcff"
          transparent
          opacity={0.13}
          roughness={0.05}
          metalness={0.02}
          clearcoat={1}
          clearcoatRoughness={0.04}
          depthWrite={false}
        />
      </mesh>
      <mesh
        position={[-0.78, 1.1, 2.1]}
        rotation={[0.18, -0.32, -0.48]}
        renderOrder={4}
      >
        <capsuleGeometry args={[0.045, 1.2, 6, 12]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, -2.02, 0]}>
        <cylinderGeometry args={[1.94, 2.24, 0.68, 56]} />
        <meshStandardMaterial
          color="#302c39"
          roughness={0.7}
          metalness={0.16}
        />
      </mesh>
      <mesh position={[0, -2.37, 0]}>
        <cylinderGeometry args={[2.24, 2.1, 0.12, 56]} />
        <meshStandardMaterial
          color="#171821"
          roughness={0.75}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, -1.71, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.98, 0.065, 12, 64]} />
        <meshStandardMaterial
          color="#9b7d75"
          roughness={0.45}
          metalness={0.32}
        />
      </mesh>
    </>
  );
}

export function SnowGlobe() {
  const reducedMotion = Boolean(useReducedMotion());
  const [shakeSignal, setShakeSignal] = useState(0);

  return (
    <section className="min-h-0 flex-1">
      <div
        className="relative h-[calc(100dvh-4.75rem)] min-h-[32rem] max-h-[48rem] overflow-hidden rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_50%_30%,#dbe7ff_0%,#9baecb_36%,#536078_70%,#242734_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_28px_80px_rgba(20,24,38,0.2)] dark:bg-[radial-gradient(circle_at_50%_28%,#3c5273_0%,#202a3d_40%,#11151f_76%,#08090e_100%)] sm:h-[38rem] lg:h-[min(46rem,calc(100dvh-8.5rem))]"
        data-snow-globe-stage
      >
        <div
          className="absolute inset-0"
          role="img"
          aria-label="A dimensional snow globe with a warm A-frame reading cabin, snowy pines, a frozen pond, and simulated snow"
          data-snow-globe-scene
        >
          <Canvas
            camera={{ position: [0, 0.35, CAMERA_DISTANCE], fov: 42 }}
            dpr={[1, 1.5]}
            frameloop={reducedMotion ? 'demand' : 'always'}
            gl={{
              alpha: true,
              antialias: false,
              powerPreference: 'high-performance',
            }}
            data-snow-globe-canvas
          >
            <ResponsiveCamera />
            <GlobeScene
              shakeSignal={shakeSignal}
              reducedMotion={reducedMotion}
            />
          </Canvas>
        </div>

        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(122deg,rgba(255,255,255,0.2),transparent_28%,transparent_72%,rgba(8,10,18,0.18))]"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={() => setShakeSignal(current => current + 1)}
          className="absolute bottom-4 left-1/2 inline-flex min-h-11 w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#181a22] shadow-[0_12px_32px_rgba(0,0,0,0.24)] transition-transform active:translate-y-px active:scale-[0.98] motion-reduce:transition-none sm:bottom-6 sm:w-auto"
          aria-label="Rattle the globe"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Rattle the globe
        </button>
      </div>
    </section>
  );
}
