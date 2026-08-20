'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';

type RotationTarget = { x: number; y: number };
type Vector4 = [number, number, number, number];

const vertices4d: Vector4[] = Array.from({ length: 16 }, (_, index) => [
  index & 1 ? 1 : -1,
  index & 2 ? 1 : -1,
  index & 4 ? 1 : -1,
  index & 8 ? 1 : -1,
]);

const tesseractEdges: Array<[number, number]> = [];
for (let vertex = 0; vertex < 16; vertex += 1) {
  for (let axis = 0; axis < 4; axis += 1) {
    const neighbour = vertex ^ (1 << axis);
    if (vertex < neighbour) tesseractEdges.push([vertex, neighbour]);
  }
}

function rotatePlane(a: number, b: number, angle: number): [number, number] {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [a * cosine - b * sine, a * sine + b * cosine];
}

function rotateFourDimensions(vertex: Vector4, time: number): Vector4 {
  let [x, y, z, w] = vertex;
  [x, w] = rotatePlane(x, w, time * 0.31 + 0.35);
  [y, w] = rotatePlane(y, w, time * 0.23 + 0.8);
  [z, w] = rotatePlane(z, w, time * 0.17 + 0.2);
  [x, y] = rotatePlane(x, y, time * 0.11);
  return [x, y, z, w];
}

function projectToThreeDimensions([x, y, z, w]: Vector4): [number, number, number] {
  const perspective = 3.6 / (4.4 - w);
  const scale = 1.18;
  return [x * perspective * scale, y * perspective * scale, z * perspective * scale];
}

function ProjectedTesseract({ visible, reduceMotion }: { visible: boolean; reduceMotion: boolean }) {
  const lines = useRef<THREE.BufferGeometry>(null);
  const points = useRef<THREE.BufferGeometry>(null);
  const elapsed = useRef(0);
  const linePositions = useMemo(() => new Float32Array(tesseractEdges.length * 2 * 3), []);
  const pointPositions = useMemo(() => new Float32Array(vertices4d.length * 3), []);

  useFrame((_state, delta) => {
    if (!visible) return;
    if (!reduceMotion) elapsed.current += Math.min(delta, 1 / 30);

    const projected = vertices4d.map((vertex) =>
      projectToThreeDimensions(rotateFourDimensions(vertex, elapsed.current)),
    );

    projected.forEach(([x, y, z], index) => {
      const offset = index * 3;
      pointPositions[offset] = x;
      pointPositions[offset + 1] = y;
      pointPositions[offset + 2] = z;
    });

    tesseractEdges.forEach(([from, to], index) => {
      const offset = index * 6;
      const start = projected[from];
      const end = projected[to];
      linePositions.set(start, offset);
      linePositions.set(end, offset + 3);
    });

    const lineAttribute = lines.current?.getAttribute('position') as THREE.BufferAttribute | undefined;
    const pointAttribute = points.current?.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (lineAttribute) lineAttribute.needsUpdate = true;
    if (pointAttribute) pointAttribute.needsUpdate = true;
  });

  return (
    <group rotation={[0.24, -0.38, 0.08]}>
      <lineSegments>
        <bufferGeometry ref={lines}>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#eee9f1" transparent opacity={0.82} />
      </lineSegments>
      <points>
        <bufferGeometry ref={points}>
          <bufferAttribute attach="attributes-position" args={[pointPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#b9afc3" size={0.075} sizeAttenuation transparent opacity={0.9} />
      </points>
    </group>
  );
}

function HypercubeRoom({
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
  const idleRotation = useRef(0);

  useFrame((state, delta) => {
    const currentGroup = group.current;
    if (!currentGroup || !visible) return;

    const safeDelta = Math.min(delta, 1 / 30);
    if (!dragging && !reduceMotion) idleRotation.current += safeDelta * 0.045;
    const ease = 1 - Math.exp(-safeDelta * 8);
    const target = rotationTarget.current;

    currentGroup.rotation.x = THREE.MathUtils.lerp(
      currentGroup.rotation.x,
      target.x + state.pointer.y * 0.035,
      ease,
    );
    currentGroup.rotation.y = THREE.MathUtils.lerp(
      currentGroup.rotation.y,
      target.y + idleRotation.current + state.pointer.x * 0.035,
      ease,
    );
    currentGroup.rotation.z = THREE.MathUtils.lerp(
      currentGroup.rotation.z,
      -state.pointer.x * 0.018,
      ease * 0.65,
    );
  });

  return (
    <group ref={group}>
      <ProjectedTesseract visible={visible} reduceMotion={reduceMotion} />
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
      className={`h-full w-full min-w-0 touch-pan-y select-none overflow-hidden outline-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      role="img"
      aria-label="Draggable projected four-dimensional hypercube"
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
        if (event.key === 'ArrowUp') rotationTarget.current.x = Math.max(-0.72, rotationTarget.current.x - 0.14);
        if (event.key === 'ArrowDown') rotationTarget.current.x = Math.min(0.72, rotationTarget.current.x + 0.14);
      }}
    >
      <Canvas
        className="block h-full w-full min-w-0"
        camera={{ position: [4.7, 3.2, 5.5], fov: 40 }}
        dpr={[1, 1.35]}
        frameloop={isVisible ? 'always' : 'never'}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'pan-y' }}
      >
        <color attach="background" args={['#15161a']} />
        <fog attach="fog" args={['#15161a', 7, 12]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 6, 5]} intensity={1.6} color="#f1eaf5" />
        <pointLight position={[-4, -2, 3]} intensity={9} distance={9} color="#756b83" />
        <HypercubeRoom
          rotationTarget={rotationTarget}
          dragging={isDragging}
          visible={isVisible}
          reduceMotion={reduceMotion}
        />
      </Canvas>
    </div>
  );
}
