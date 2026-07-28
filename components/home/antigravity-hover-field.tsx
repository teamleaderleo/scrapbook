'use client';

import { useEffect, useRef } from 'react';

type Particle = {
  radius: number;
  radiusScaleX: number;
  radiusScaleY: number;
  angle: number;
  angularVelocity: number;
  phase: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  width: number;
  opacity: number;
  colourIndex: number;
};

type FieldCentre = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
};

const LIGHT_COLOURS = ['#295fd5', '#4368de', '#7553c7', '#c73d75', '#e33e55', '#e7ad00'];
const DARK_COLOURS = ['#79a2ff', '#8d9cff', '#b795ee', '#f07fb5', '#ff8194', '#ffd166'];
const TAU = Math.PI * 2;

function seededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function wrapAngle(angle: number) {
  return ((angle % TAU) + TAU) % TAU;
}

function pickColour(angle: number, random: () => number) {
  const phase = wrapAngle(angle + (random() - 0.5) * 0.34) / TAU;

  if (phase < 0.16) return random() < 0.72 ? 0 : 1;
  if (phase < 0.36) return random() < 0.7 ? 1 : 2;
  if (phase < 0.53) return random() < 0.64 ? 2 : 3;
  if (phase < 0.68) return random() < 0.58 ? 3 : 4;
  if (phase < 0.79) return random() < 0.62 ? 5 : 4;
  return random() < 0.78 ? 0 : 2;
}

function createParticles(width: number, height: number, centre: FieldCentre, finePointer: boolean) {
  const area = width * height;
  const desiredCount = finePointer
    ? Math.min(380, Math.max(150, Math.round(area / 5_100)))
    : Math.min(190, Math.max(90, Math.round(area / 7_400)));
  const maximumRadius = Math.hypot(width, height) * 0.63;
  const minimumRadius = Math.min(54, Math.min(width, height) * 0.07);
  const random = seededRandom(Math.round(width * 17 + height * 29));
  const particles: Particle[] = [];

  for (let index = 0; index < desiredCount; index += 1) {
    const angle = random() * TAU;
    const radius = minimumRadius + Math.sqrt(random()) * (maximumRadius - minimumRadius);
    const radiusScaleX = 0.92 + random() * 0.16;
    const radiusScaleY = 0.92 + random() * 0.16;
    const x = centre.x + Math.cos(angle) * radius * radiusScaleX;
    const y = centre.y + Math.sin(angle) * radius * radiusScaleY;
    const radiusRatio = radius / maximumRadius;

    particles.push({
      radius,
      radiusScaleX,
      radiusScaleY,
      angle,
      angularVelocity: -(0.37 + random() * 0.11),
      phase: random() * TAU,
      x,
      y,
      vx: 0,
      vy: 0,
      length: 2.4 + random() * 4.8 + (1 - radiusRatio) * 1.8,
      width: 0.9 + random() * 1.35,
      opacity: 0.4 + random() * 0.48,
      colourIndex: pickColour(angle, random),
    });
  }

  return { particles, maximumRadius };
}

export function AntigravityHoverField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(any-pointer: fine)').matches;
    const animated = !reducedMotion;
    const centre: FieldCentre = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      vx: 0,
      vy: 0,
    };

    let width = 0;
    let height = 0;
    let maximumRadius = 1;
    let particles: Particle[] = [];
    let frame = 0;
    let previousTime = performance.now();
    let previousDrawTime = 0;
    let hasPointer = false;
    let touchActive = false;
    let dark = document.documentElement.classList.contains('dark');

    const resize = () => {
      const previousWidth = width;
      const previousHeight = height;
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      if (previousWidth > 0 && previousHeight > 0 && hasPointer) {
        const scaleX = width / previousWidth;
        const scaleY = height / previousHeight;
        centre.x *= scaleX;
        centre.y *= scaleY;
        centre.targetX *= scaleX;
        centre.targetY *= scaleY;
      } else {
        centre.x = width * 0.62;
        centre.y = height * 0.5;
        centre.targetX = centre.x;
        centre.targetY = centre.y;
      }

      centre.vx = 0;
      centre.vy = 0;
      const created = createParticles(width, height, centre, finePointer);
      particles = created.particles;
      maximumRadius = created.maximumRadius;
    };

    const draw = (time: number, advance: boolean) => {
      const elapsed = Math.min(34, Math.max(0, time - previousTime));
      const frameScale = elapsed / (1000 / 60) || 1;
      const seconds = elapsed / 1000;
      previousTime = time;

      context.clearRect(0, 0, width, height);
      context.lineCap = 'round';
      const colours = dark ? DARK_COLOURS : LIGHT_COLOURS;

      if (advance) {
        centre.vx += (centre.targetX - centre.x) * 0.052 * frameScale;
        centre.vy += (centre.targetY - centre.y) * 0.052 * frameScale;
        const centreDamping = Math.pow(0.76, frameScale);
        centre.vx *= centreDamping;
        centre.vy *= centreDamping;
        centre.x += centre.vx * frameScale;
        centre.y += centre.vy * frameScale;
      }

      const centreSpeed = Math.hypot(centre.vx, centre.vy);

      for (const particle of particles) {
        if (advance) particle.angle = wrapAngle(particle.angle + particle.angularVelocity * seconds);

        const radiusBreath = Math.sin(time * 0.00042 + particle.phase) * (1.2 + particle.radius * 0.0035);
        const orbitRadius = particle.radius + radiusBreath;
        const targetX = centre.x + Math.cos(particle.angle) * orbitRadius * particle.radiusScaleX;
        const targetY = centre.y + Math.sin(particle.angle) * orbitRadius * particle.radiusScaleY;

        if (advance) {
          const particleSpring = 0.052 * frameScale;
          particle.vx += (targetX - particle.x) * particleSpring;
          particle.vy += (targetY - particle.y) * particleSpring;
          const particleDamping = Math.pow(0.79, frameScale);
          particle.vx *= particleDamping;
          particle.vy *= particleDamping;
          particle.x += particle.vx * frameScale;
          particle.y += particle.vy * frameScale;
        }

        const dx = particle.x - centre.x;
        const dy = particle.y - centre.y;
        const distance = Math.max(0.001, Math.hypot(dx, dy));
        const directionX = dx / distance;
        const directionY = dy / distance;
        const radiusRatio = Math.min(1, particle.radius / maximumRadius);
        const motion = Math.min(3.4, Math.hypot(particle.vx, particle.vy) * 0.22);
        const cursorStretch = Math.min(2.8, centreSpeed * 0.12) * (0.35 + radiusRatio * 0.65);
        const dashLength = particle.length + motion + cursorStretch;
        const halfLength = dashLength / 2;
        const edgeFade = 0.55 + (1 - radiusRatio) * 0.45;

        context.globalAlpha = particle.opacity * edgeFade;
        context.strokeStyle = colours[particle.colourIndex];
        context.lineWidth = particle.width;
        context.beginPath();
        context.moveTo(
          particle.x - directionX * halfLength,
          particle.y - directionY * halfLength,
        );
        context.lineTo(
          particle.x + directionX * halfLength,
          particle.y + directionY * halfLength,
        );
        context.stroke();
      }
    };

    const animate = (time: number) => {
      if (!finePointer && time - previousDrawTime < 1000 / 30) {
        frame = window.requestAnimationFrame(animate);
        return;
      }
      previousDrawTime = time;
      draw(time, true);
      frame = window.requestAnimationFrame(animate);
    };

    const moveCentre = (event: PointerEvent) => {
      if (event.pointerType === 'touch' && !touchActive) return;
      centre.targetX = event.clientX;
      centre.targetY = event.clientY;
      hasPointer = true;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      touchActive = true;
      moveCentre(event);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'touch') touchActive = false;
    };

    const themeObserver = new MutationObserver(() => {
      dark = document.documentElement.classList.contains('dark');
      if (!animated) draw(performance.now(), false);
    });

    resize();
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', resize);

    if (animated) {
      window.addEventListener('pointermove', moveCentre, { passive: true });
      window.addEventListener('pointerdown', onPointerDown, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { passive: true });
      window.addEventListener('pointercancel', onPointerUp, { passive: true });
      frame = window.requestAnimationFrame(animate);
    } else {
      draw(performance.now(), false);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', moveCentre);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-antigravity-hover-field
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-75 dark:opacity-65"
    />
  );
}
