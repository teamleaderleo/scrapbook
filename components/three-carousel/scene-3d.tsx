'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const satellites: Array<[number, number, number, number]> = [
  [-2.6, 1.25, -0.5, 0.34],
  [2.45, 1.55, -0.2, 0.28],
  [-2.15, -1.65, 0.45, 0.24],
  [2.2, -1.35, -0.55, 0.38],
  [0.1, 2.55, -1.1, 0.2],
  [0.6, -2.45, 0.65, 0.26],
];

type RotationTarget = { x: number; y: number };

function AgentRoom({ target, dragging }: { target: RotationTarget; dragging: boolean }) {
  const group = useRef<THREE.Group>(null);
  const idleRotation = useRef(0);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (!dragging) idleRotation.current += delta * 0.12;

    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      target.x + state.pointer.y * 0.06,
      0.08,
    );
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      target.y + idleRotation.current + state.pointer.x * 0.05,
      0.08,
    );
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      -state.pointer.x * 0.035,
      0.05,
    );
  });

  return (
    <group ref={group}>
      <mesh>
        <boxGeometry args={[2.45, 2.45, 2.45]} />
        <meshStandardMaterial color="#b8b1c0" transparent opacity={0.12} roughness={0.46} metalness={0.08} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2.45, 2.45, 2.45)]} />
        <lineBasicMaterial color="#eee9f1" transparent opacity={0.78} />
      </lineSegments>

      <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.72, 0]} />
        <meshStandardMaterial color="#e8e2ec" roughness={0.24} metalness={0.12} />
      </mesh>

      {satellites.map(([x, y, z, size], index) => (
        <mesh
          key={`${x}-${y}-${z}`}
          position={[x, y, z]}
          rotation={[index * 0.33, index * 0.52, index * 0.19]}
        >
          <boxGeometry args={[size, size, size]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? '#8f8998' : '#d7d1dd'}
            roughness={0.42}
            metalness={0.08}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Scene3D() {
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [rotationTarget, setRotationTarget] = useState<RotationTarget>({ x: 0, y: 0 });
  const lastPointer = useRef({ x: 0, y: 0 });

  useEffect(() => setMounted(true), []);

  const stopDragging = () => setIsDragging(false);

  if (!mounted) {
    return <div className="h-full min-w-0 w-full bg-[#15161a]" aria-hidden="true" />;
  }

  return (
    <div
      className={`h-full min-w-0 w-full touch-pan-y select-none overflow-hidden outline-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      role="img"
      aria-label="Draggable three-dimensional agent room"
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
        setRotationTarget((current) => ({
          y: current.y + dx * 0.008,
          x: THREE.MathUtils.clamp(current.x + dy * 0.006, -0.72, 0.72),
        }));
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        stopDragging();
      }}
      onPointerCancel={stopDragging}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          setRotationTarget((current) => ({ ...current, y: current.y - 0.18 }));
        }
        if (event.key === 'ArrowRight') {
          setRotationTarget((current) => ({ ...current, y: current.y + 0.18 }));
        }
        if (event.key === 'ArrowUp') {
          setRotationTarget((current) => ({ ...current, x: Math.max(-0.72, current.x - 0.14) }));
        }
        if (event.key === 'ArrowDown') {
          setRotationTarget((current) => ({ ...current, x: Math.min(0.72, current.x + 0.14) }));
        }
      }}
    >
      <Canvas
        className="block h-full min-w-0 w-full"
        camera={{ position: [4.8, 3.4, 5.4], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'pan-y' }}
      >
        <color attach="background" args={['#15161a']} />
        <fog attach="fog" args={['#15161a', 7, 12]} />
        <ambientLight intensity={1.25} />
        <directionalLight position={[4, 6, 5]} intensity={2.4} color="#f1eaf5" />
        <pointLight position={[-4, -2, 3]} intensity={22} distance={9} color="#756b83" />
        <AgentRoom target={rotationTarget} dragging={isDragging} />
      </Canvas>
    </div>
  );
}
