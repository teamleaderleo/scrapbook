import * as THREE from 'three'
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, extend, useFrame } from '@react-three/fiber'
import { Image, ScrollControls, useScroll, Billboard, Text } from '@react-three/drei'
import { suspend } from 'suspend-react'
import { inter } from '@/components/ui/assets/fonts';
import { generate } from 'random-words'
import { easing } from 'maath'
import { DragPreventer } from './DragPreventer'
import { WrapFixer } from './WrapFixer'

type CardProps = {
  url: string;
  active: boolean;
  hovered: boolean;
  [key: string]: any;
};

function Card({ url, active, hovered, ...props }: CardProps) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    const f = hovered ? 1.4 : active ? 1.25 : 1;
    if (ref.current) {
      easing.damp3(ref.current.position, [0, hovered ? 0.25 : 0, 0], 0.1, delta);
      easing.damp3(ref.current.scale, [1.618 * f, 1 * f, 1], 0.15, delta);
    }
  });
  
  return (
    <group {...props}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image
        ref={ref}
        transparent
        radius={0.075}
        url={url}
        scale={[1.618, 1]}
        side={THREE.DoubleSide}
      />
    </group>
  );
}

function ActiveCard({ hovered, imagePrefix = '/img', ...props }: { hovered: number | null; imagePrefix?: string; [key: string]: any }) {
  const ref = useRef<THREE.Mesh>(null);
  const name = useMemo(() => (generate({ exactly: 2 }) as string[]).join(' '), [hovered]);
  
  useLayoutEffect(() => {
    if (ref.current && (ref.current.material as any)) {
      (ref.current.material as any).zoom = 0.8;
    }
  }, [hovered]);
  
  useFrame((state, delta) => {
    if (ref.current) {
      easing.damp(ref.current.material, 'zoom', 1, 0.5, delta);
      easing.damp(ref.current.material, 'opacity', hovered !== null ? 1 : 0, 0.3, delta);
    }
  });
  
  return (
    <Billboard {...props}>
      <Text font={inter.style.fontFamily} fontSize={0.5} position={[2.15, 3.85, 0]} anchorX="left" color="black">
        {hovered !== null && `${name}\n${hovered}`}
      </Text>
      {hovered !== null && (
        <group
          scale={[3.5, 1.618 * 3.5, 0.2]}
          position={[0, 1.5, 0]}
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image
            ref={ref}
            transparent
            radius={0.3}
            scale={[1, 1]}
            url={`${imagePrefix}${Math.floor(hovered % 10) + 1}.jpg`}
          />
        </group>
      )}
    </Billboard>
  );
}

type CardsProps = {
  category: string;
  from?: number;
  len?: number;
  radius?: number;
  onPointerOver: (i: number | null) => void;
  onPointerOut: (i: number | null) => void;
  imagePrefix?: string;
  [key: string]: any;
};

function Cards({ 
  category, 
  from = 0, 
  len = Math.PI * 2, 
  radius = 5.25, 
  onPointerOver, 
  onPointerOut, 
  imagePrefix = '/img',
  ...props 
}: CardsProps) {
  const [hovered, hover] = useState<number | null>(null);
  const amount = Math.round(len * 10);
  const textPosition = from + (amount / 2 / amount) * len;
  
  return (
    <group {...props}>
      <Billboard position={[Math.sin(textPosition) * radius * 1.4, 0.5, Math.cos(textPosition) * radius * 1.4]}>
        <Text font={inter.style.fontFamily} fontSize={0.25} anchorX="center" color="black">
          {category}
        </Text>
      </Billboard>
      {Array.from({ length: amount - 3 }, (_, i) => {
        const angle = from + (i / amount) * len;
        return (
          <Card
            key={angle}
            onPointerOver={(e: React.PointerEvent) => (e.stopPropagation(), hover(i), onPointerOver(i))}
            onPointerOut={() => (hover(null), onPointerOut(null))}
            position={[Math.sin(angle) * radius, 0, Math.cos(angle) * radius]}
            rotation={[0, Math.PI / 2 + angle, 0]}
            active={hovered !== null}
            hovered={hovered === i}
            url={`${imagePrefix}${Math.floor(i % 10) + 1}.jpg`}
          />
        );
      })}
    </group>
  );
}

type SceneProps = {
  children?: React.ReactNode;
  imagePrefix?: string;
  [x: string]: any;
};

function Scene({ children, imagePrefix = '/img', ...props }: SceneProps) {
  const ref = useRef<THREE.Group>(null);
  const scroll = useScroll();
  const [hovered, hover] = useState<number | null>(null);
  
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y = -scroll.offset * (Math.PI * 2);
    }
    state.events.update?.();
    easing.damp3(state.camera.position, [-state.pointer.x * 2, state.pointer.y * 2 + 4.5, 9], 0.3, delta);
    state.camera.lookAt(0, 0, 0);
  });
  
  return (
    <group ref={ref} {...props}>
      <Cards 
        category="spring" 
        from={0} 
        len={Math.PI / 4} 
        onPointerOver={hover} 
        onPointerOut={hover} 
        imagePrefix={imagePrefix} 
      />
      <Cards 
        category="summer" 
        from={Math.PI / 4} 
        len={Math.PI / 2} 
        position={[0, 0.4, 0]} 
        onPointerOver={hover} 
        onPointerOut={hover} 
        imagePrefix={imagePrefix} 
      />
      <Cards 
        category="autumn" 
        from={Math.PI / 4 + Math.PI / 2} 
        len={Math.PI / 2} 
        onPointerOver={hover} 
        onPointerOut={hover} 
        imagePrefix={imagePrefix} 
      />
      <Cards 
        category="winter" 
        from={Math.PI * 1.25} 
        len={Math.PI * 2 - Math.PI * 1.25} 
        position={[0, -0.4, 0]} 
        onPointerOver={hover} 
        onPointerOut={hover}
        imagePrefix={imagePrefix} 
      />
      <ActiveCard hovered={hovered} imagePrefix={imagePrefix} />
      {children}
    </group>
  );
}

export type ThreeCarouselProps = {
  height?: string;
  width?: string;
  imagePrefix?: string;
  pages?: number;
  infinite?: boolean;
  backgroundColor?: string;
  className?: string;
};

const ThreeCarousel = ({ 
  height = '100vh', 
  width = '100%', 
  imagePrefix = '/img',
  pages = 3,
  infinite = true,
  backgroundColor = '#fdfdfd',
  className = '',
}: ThreeCarouselProps) => {
  return (
    <div style={{ height, width, background: backgroundColor }} className={className}>
      <Canvas dpr={[1, 1.5]}>
        <ScrollControls pages={pages} infinite={infinite}>
          <DragPreventer />
          <WrapFixer />
          <Scene position={[0, 1.5, 0]} imagePrefix={imagePrefix} />
        </ScrollControls>
      </Canvas>
    </div>
  );
};

export default ThreeCarousel;