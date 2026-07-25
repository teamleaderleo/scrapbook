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

function AgentRoom() {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.16;
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      state.pointer.y * 0.18,
      0.035,
    );
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      -state.pointer.x * 0.08,
      0.035,
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

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-full w-full bg-[#15161a]" aria-hidden="true" />;
  }

  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [4.8, 3.4, 5.4], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#15161a']} />
      <fog attach="fog" args={['#15161a', 7, 12]} />
      <ambientLight intensity={1.25} />
      <directionalLight position={[4, 6, 5]} intensity={2.4} color="#f1eaf5" />
      <pointLight position={[-4, -2, 3]} intensity={22} distance={9} color="#756b83" />
      <AgentRoom />
    </Canvas>
  );
}
