'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';

const satellites: Array<[number, number, number, number]> = [
  [-2.75, 1.25, -0.5, 0.3],
  [2.55, 1.55, -0.2, 0.25],
  [-2.25, -1.7, 0.45, 0.22],
  [2.3, -1.4, -0.55, 0.34],
  [0.1, 2.7, -1.1, 0.18],
  [0.65, -2.55, 0.65, 0.23],
];

const nestedCubes = [
  { size: 2.45, opacity: 0.7, rotation: [0, 0, 0] as [number, number, number] },
  { size: 1.72, opacity: 0.5, rotation: [0.55, 0.72, 0.18] as [number, number, number] },
  { size: 1.08, opacity: 0.38, rotation: [-0.42, 0.36, 0.7] as [number, number, number] },
];

type RotationTarget = { x: number; y: number };

function NestedCube({
  size,
  opacity,
  rotation,
}: {
  size: number;
  opacity: number;
  rotation: [number, number, number];
}) {
  return (
    <group rotation={rotation}>
      <mesh>
        <boxGeometry args={[size, size, size]} />
        <meshPhysicalMaterial
          color="#b8b1c0"
          transparent
          opacity={0.035}
          roughness={0.26}
          metalness={0.04}
          transmission={0.18}
          thickness={0.45}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(size, size, size)]} />
        <lineBasicMaterial color="#eee9f1" transparent opacity={opacity} />
      </lineSegments>
    </group>
  );
}

function AgentRoom({
  rotationTarget,
  dragging,
  visible,
  reduceMotion,
}: {
  rotationTarget: MutableRefObject<RotationTarget>;
  dragging: boolean;
  visible: boolean;
  reduceMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);
  const idleRotation = useRef(0);

  useFrame((state, delta) => {
    const currentGroup = group.current;
    if (!currentGroup || !visible) return;

    const safeDelta = Math.min(delta, 1 / 30);
    if (!dragging && !reduceMotion) idleRotation.current += safeDelta * 0.075;
    const ease = 1 - Math.exp(-safeDelta * 8);
    const target = rotationTarget.current;

    currentGroup.rotation.x = THREE.MathUtils.lerp(
      currentGroup.rotation.x,
      target.x + state.pointer.y * 0.045,
      ease,
    );
    currentGroup.rotation.y = THREE.MathUtils.lerp(
      currentGroup.rotation.y,
      target.y + idleRotation.current + state.pointer.x * 0.04,
      ease,
    );
    currentGroup.rotation.z = THREE.MathUtils.lerp(
      currentGroup.rotation.z,
      -state.pointer.x * 0.025,
      ease * 0.65,
    );

    if (!reduceMotion && core.current) {
      core.current.rotation.x += safeDelta * 0.055;
      core.current.rotation.y -= safeDelta * 0.08;
      core.current.rotation.z += safeDelta * 0.035;
    }
    if (!reduceMotion && orbit.current) {
      orbit.current.rotation.y += safeDelta * 0.045;
      orbit.current.rotation.z -= safeDelta * 0.025;
    }
  });

  return (
    <group ref={group}>
      <group ref={core}>
        {nestedCubes.map((cube) => (
          <NestedCube key={cube.size} {...cube} />
        ))}

        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <icosahedronGeometry args={[0.48, 1]} />
          <meshStandardMaterial color="#e8e2ec" roughness={0.2} metalness={0.16} />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.42, 0.012, 8, 96]} />
          <meshBasicMaterial color="#958aa3" transparent opacity={0.62} />
        </mesh>
        <mesh rotation={[0.42, 0.7, Math.PI / 2]}>
          <torusGeometry args={[1.9, 0.009, 8, 96]} />
          <meshBasicMaterial color="#d7d0dc" transparent opacity={0.32} />
        </mesh>
      </group>

      <group ref={orbit}>
        {satellites.map(([x, y, z, size], index) => (
          <mesh
            key={`${x}-${y}-${z}`}
            position={[x, y, z]}
            rotation={[index * 0.33, index * 0.52, index * 0.19]}
          >
            <boxGeometry args={[size, size, size]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? '#8f8998' : '#d7d1dd'}
              roughness={0.36}
              metalness={0.12}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default function Scene3D() {
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const rotationTarget = useRef<RotationTarget>({ x: 0, y: 0 });
  const lastPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReduceMotion(motionMedia.matches);
    const updateVisibility = () => setIsVisible(document.visibilityState === 'visible');

    updateMotion();
    updateVisibility();
    motionMedia.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      motionMedia.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  const stopDragging = () => setIsDragging(false);

  return (
    <div
      className={`h-full min-w-0 w-full touch-pan-y select-none overflow-hidden outline-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      role="img"
      aria-label="Draggable nested-cube gallery orbit"
      tabIndex={0}
      onPointerDown={(event) => {
        setIsDragging(true);
        lastPointer.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!isDragging) return;
        const dx = event.clientX - lastPointer.current.x;
        const dy = event.clientY - lastPointer.current.y;
        lastPointer.current = { x: event.clientX, y: event.clientY };
        rotationTarget.current.y += dx * 0.008;
        rotationTarget.current.x = THREE.MathUtils.clamp(
          rotationTarget.current.x + dy * 0.006,
          -0.72,
          0.72,
        );
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        stopDragging();
      }}
      onPointerCancel={stopDragging}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') rotationTarget.current.y -= 0.18;
        if (event.key === 'ArrowRight') rotationTarget.current.y += 0.18;
        if (event.key === 'ArrowUp') {
          rotationTarget.current.x = Math.max(-0.72, rotationTarget.current.x - 0.14);
        }
        if (event.key === 'ArrowDown') {
          rotationTarget.current.x = Math.min(0.72, rotationTarget.current.x + 0.14);
        }
      }}
    >
      <Canvas
        className="block h-full min-w-0 w-full"
        camera={{ position: [4.8, 3.4, 5.4], fov: 42 }}
        dpr={[1, 1.35]}
        frameloop={isVisible ? 'always' : 'never'}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'pan-y' }}
      >
        <color attach="background" args={['#15161a']} />
        <fog attach="fog" args={['#15161a', 7, 12]} />
        <ambientLight intensity={1.18} />
        <directionalLight position={[4, 6, 5]} intensity={2.2} color="#f1eaf5" />
        <pointLight position={[-4, -2, 3]} intensity={18} distance={9} color="#756b83" />
        <AgentRoom
          rotationTarget={rotationTarget}
          dragging={isDragging}
          visible={isVisible}
          reduceMotion={reduceMotion}
        />
      </Canvas>
    </div>
  );
}
