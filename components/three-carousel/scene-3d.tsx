'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ScrollControls, useScroll } from '@react-three/drei';
import { DragPreventer } from './DragPreventer';
import { WrapFixer } from './WrapFixer';
import * as THREE from 'three';

function RotatingCube() {
  const ref = useRef<THREE.Mesh>(null);
  const scroll = useScroll();
  
  useFrame(() => {
    if (ref.current) {
      // Rotate based on scroll position
      ref.current.rotation.y = scroll.offset * Math.PI * 2;
    }
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="royalblue" />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <RotatingCube />
      {/* Keep OrbitControls for now, but they might conflict with scroll controls */}
      <OrbitControls enableZoom={false} enablePan={false} />
    </>
  );
}

export default function Scene3D() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas camera={{ position: [3, 3, 3] }}>
        <ScrollControls pages={3} infinite={true}>
          <DragPreventer />
          <WrapFixer />
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </ScrollControls>
      </Canvas>
    </div>
  );
}