'use client';

import { RotateCcw, Smartphone, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type Flake = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  phase: number;
};

type PermissionState = 'idle' | 'requesting' | 'enabled' | 'denied' | 'unavailable';

type PermissionCapableConstructor = {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

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

function createFlakes(
  width: number,
  height: number,
  count: number,
  centreX: number,
  centreY: number,
  globeRadius: number,
) {
  const random = seededRandom(Math.round(width * 31 + height * 17));
  return Array.from({ length: count }, () => {
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * globeRadius * 0.9;
    return {
      x: centreX + Math.cos(angle) * distance,
      y: centreY + Math.sin(angle) * distance,
      vx: (random() - 0.5) * 0.45,
      vy: (random() - 0.5) * 0.45,
      radius: 1.1 + random() * 2.6,
      opacity: 0.45 + random() * 0.5,
      phase: random() * Math.PI * 2,
    };
  });
}

export function SnowGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<() => void>(() => undefined);
  const permissionRef = useRef<PermissionState>('idle');
  const sensorEventSeenRef = useRef(false);
  const [permission, setPermission] = useState<PermissionState>('idle');

  const updatePermission = useCallback((next: PermissionState) => {
    permissionRef.current = next;
    setPermission(next);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !stage || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    let width = 1;
    let height = 1;
    let centreX = 0;
    let centreY = 0;
    let globeRadius = 1;
    let flakes: Flake[] = [];
    let frame = 0;
    let previousTime = performance.now();
    let previousDrawTime = 0;
    let gravityX = 0;
    let gravityY = 0.055;
    let targetGravityX = 0;
    let targetGravityY = 0.055;
    let impulseX = 0;
    let impulseY = 0;
    let baselineBeta: number | null = null;
    let baselineGamma: number | null = null;
    let lastAcceleration = { x: 0, y: 0, z: 0 };
    let hasAcceleration = false;
    let dragging = false;
    let pointerX = 0;
    let pointerY = 0;
    let dark = document.documentElement.classList.contains('dark');

    const resize = () => {
      const bounds = stage.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      centreX = width / 2;
      centreY = height * 0.47;
      globeRadius = Math.min(width * 0.43, height * 0.4);
      const maximum = coarsePointer ? 210 : 300;
      const count = Math.round(clamp((width * height) / 2600, 125, maximum));
      flakes = createFlakes(width, height, count, centreX, centreY, globeRadius);
    };

    const addShake = (strength = 1) => {
      impulseX += (Math.random() - 0.5) * 4.8 * strength;
      impulseY -= (3.2 + Math.random() * 3.6) * strength;
      for (const flake of flakes) {
        flake.vx += (Math.random() - 0.5) * 2.8 * strength;
        flake.vy += (Math.random() - 0.78) * 3.4 * strength;
      }
    };
    shakeRef.current = () => addShake(1);

    const drawGlobe = () => {
      const glass = context.createRadialGradient(
        centreX - globeRadius * 0.35,
        centreY - globeRadius * 0.45,
        globeRadius * 0.08,
        centreX,
        centreY,
        globeRadius,
      );
      if (dark) {
        glass.addColorStop(0, 'rgba(120, 168, 255, 0.22)');
        glass.addColorStop(0.55, 'rgba(35, 45, 76, 0.38)');
        glass.addColorStop(1, 'rgba(8, 10, 20, 0.76)');
      } else {
        glass.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
        glass.addColorStop(0.55, 'rgba(203, 225, 255, 0.48)');
        glass.addColorStop(1, 'rgba(113, 150, 207, 0.3)');
      }

      context.save();
      context.beginPath();
      context.arc(centreX, centreY, globeRadius, 0, Math.PI * 2);
      context.clip();
      context.fillStyle = glass;
      context.fillRect(
        centreX - globeRadius,
        centreY - globeRadius,
        globeRadius * 2,
        globeRadius * 2,
      );

      const snowLine = centreY + globeRadius * 0.57;
      context.fillStyle = dark ? 'rgba(220, 231, 255, 0.9)' : 'rgba(255, 255, 255, 0.96)';
      context.beginPath();
      context.moveTo(centreX - globeRadius, centreY + globeRadius);
      context.lineTo(centreX - globeRadius, snowLine + globeRadius * 0.08);
      context.quadraticCurveTo(
        centreX - globeRadius * 0.38,
        snowLine - globeRadius * 0.1,
        centreX,
        snowLine,
      );
      context.quadraticCurveTo(
        centreX + globeRadius * 0.45,
        snowLine + globeRadius * 0.09,
        centreX + globeRadius,
        snowLine - globeRadius * 0.03,
      );
      context.lineTo(centreX + globeRadius, centreY + globeRadius);
      context.closePath();
      context.fill();

      const cabinX = centreX - globeRadius * 0.18;
      const cabinY = snowLine - globeRadius * 0.16;
      context.fillStyle = dark ? '#845c52' : '#9b6554';
      context.fillRect(cabinX, cabinY, globeRadius * 0.28, globeRadius * 0.2);
      context.fillStyle = dark ? '#d9e4ff' : '#f8fbff';
      context.beginPath();
      context.moveTo(cabinX - globeRadius * 0.04, cabinY);
      context.lineTo(cabinX + globeRadius * 0.14, cabinY - globeRadius * 0.15);
      context.lineTo(cabinX + globeRadius * 0.32, cabinY);
      context.closePath();
      context.fill();
      context.fillStyle = '#f5bf55';
      context.fillRect(
        cabinX + globeRadius * 0.07,
        cabinY + globeRadius * 0.06,
        globeRadius * 0.055,
        globeRadius * 0.06,
      );

      const treeX = centreX + globeRadius * 0.26;
      const treeBase = snowLine + globeRadius * 0.01;
      context.fillStyle = dark ? '#4f8b75' : '#397963';
      for (let level = 0; level < 3; level += 1) {
        const top = treeBase - globeRadius * (0.18 + level * 0.1);
        const spread = globeRadius * (0.17 - level * 0.028);
        context.beginPath();
        context.moveTo(treeX, top - globeRadius * 0.12);
        context.lineTo(treeX - spread, top + globeRadius * 0.12);
        context.lineTo(treeX + spread, top + globeRadius * 0.12);
        context.closePath();
        context.fill();
      }

      for (const flake of flakes) {
        context.globalAlpha = flake.opacity;
        context.fillStyle = dark ? '#f5f8ff' : '#ffffff';
        context.beginPath();
        context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
      context.globalAlpha = 1;

      context.strokeStyle = dark
        ? 'rgba(215, 226, 255, 0.58)'
        : 'rgba(255, 255, 255, 0.95)';
      context.lineWidth = Math.max(2, globeRadius * 0.018);
      context.beginPath();
      context.arc(centreX, centreY, globeRadius, 0, Math.PI * 2);
      context.stroke();

      context.strokeStyle = dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.72)';
      context.lineWidth = Math.max(2, globeRadius * 0.025);
      context.beginPath();
      context.arc(
        centreX - globeRadius * 0.12,
        centreY - globeRadius * 0.1,
        globeRadius * 0.76,
        Math.PI * 1.08,
        Math.PI * 1.48,
      );
      context.stroke();

      const baseWidth = globeRadius * 1.18;
      const baseY = centreY + globeRadius * 0.87;
      const baseHeight = globeRadius * 0.28;
      const corner = globeRadius * 0.08;
      context.fillStyle = dark ? '#39323b' : '#66515a';
      context.beginPath();
      context.moveTo(centreX - baseWidth / 2 + corner, baseY);
      context.lineTo(centreX + baseWidth / 2 - corner, baseY);
      context.quadraticCurveTo(
        centreX + baseWidth / 2,
        baseY,
        centreX + baseWidth / 2,
        baseY + corner,
      );
      context.lineTo(centreX + baseWidth / 2, baseY + baseHeight - corner);
      context.quadraticCurveTo(
        centreX + baseWidth / 2,
        baseY + baseHeight,
        centreX + baseWidth / 2 - corner,
        baseY + baseHeight,
      );
      context.lineTo(centreX - baseWidth / 2 + corner, baseY + baseHeight);
      context.quadraticCurveTo(
        centreX - baseWidth / 2,
        baseY + baseHeight,
        centreX - baseWidth / 2,
        baseY + baseHeight - corner,
      );
      context.lineTo(centreX - baseWidth / 2, baseY + corner);
      context.quadraticCurveTo(
        centreX - baseWidth / 2,
        baseY,
        centreX - baseWidth / 2 + corner,
        baseY,
      );
      context.closePath();
      context.fill();
      context.fillStyle = dark ? '#514657' : '#816672';
      context.fillRect(
        centreX - baseWidth * 0.42,
        baseY + globeRadius * 0.08,
        baseWidth * 0.84,
        globeRadius * 0.035,
      );
    };

    const draw = (time: number) => {
      const elapsed = Math.min(34, Math.max(1, time - previousTime));
      const frameScale = elapsed / (1000 / 60);
      previousTime = time;

      gravityX += (targetGravityX - gravityX) * 0.08 * frameScale;
      gravityY += (targetGravityY - gravityY) * 0.08 * frameScale;
      impulseX *= Math.pow(0.88, frameScale);
      impulseY *= Math.pow(0.88, frameScale);

      if (!reducedMotion) {
        for (const flake of flakes) {
          const flutter = Math.sin(time * 0.0014 + flake.phase) * 0.004;
          flake.vx += (gravityX * 0.34 + impulseX * 0.024 + flutter) * frameScale;
          flake.vy += (gravityY * 0.34 + impulseY * 0.024) * frameScale;
          flake.vx *= Math.pow(0.992, frameScale);
          flake.vy *= Math.pow(0.992, frameScale);
          flake.x += flake.vx * frameScale;
          flake.y += flake.vy * frameScale;

          const dx = flake.x - centreX;
          const dy = flake.y - centreY;
          const distance = Math.max(0.001, Math.hypot(dx, dy));
          const limit = globeRadius - flake.radius - 4;
          if (distance > limit) {
            const normalX = dx / distance;
            const normalY = dy / distance;
            flake.x = centreX + normalX * limit;
            flake.y = centreY + normalY * limit;
            const outward = flake.vx * normalX + flake.vy * normalY;
            if (outward > 0) {
              flake.vx -= normalX * outward * 1.45;
              flake.vy -= normalY * outward * 1.45;
            }
            flake.vx *= 0.94;
            flake.vy *= 0.94;
          }
        }
      }

      context.clearRect(0, 0, width, height);
      drawGlobe();
    };

    const animate = (time: number) => {
      if (coarsePointer && time - previousDrawTime < 1000 / 30) {
        frame = window.requestAnimationFrame(animate);
        return;
      }
      previousDrawTime = time;
      draw(time);
      frame = window.requestAnimationFrame(animate);
    };

    const rotateForScreen = (x: number, y: number) => {
      const angle = window.screen.orientation?.angle ?? 0;
      if (angle === 90) return { x: -y, y: x };
      if (angle === 270 || angle === -90) return { x: y, y: -x };
      if (angle === 180) return { x: -x, y: -y };
      return { x, y };
    };

    const markSensorLive = () => {
      sensorEventSeenRef.current = true;
      if (permissionRef.current !== 'enabled') updatePermission('enabled');
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return;
      markSensorLive();
      if (baselineBeta === null || baselineGamma === null) {
        baselineBeta = event.beta;
        baselineGamma = event.gamma;
      }
      const relativeX = clamp((event.gamma - baselineGamma) / 26, -1.2, 1.2);
      const relativeY = clamp((event.beta - baselineBeta) / 26, -1.2, 1.2);
      const rotated = rotateForScreen(relativeX, relativeY);
      targetGravityX = rotated.x * 0.11;
      targetGravityY = 0.04 + rotated.y * 0.11;
    };

    const onMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (
        !acceleration ||
        acceleration.x === null ||
        acceleration.y === null ||
        acceleration.z === null
      ) {
        return;
      }
      markSensorLive();
      if (!hasAcceleration) {
        hasAcceleration = true;
        lastAcceleration = { x: acceleration.x, y: acceleration.y, z: acceleration.z };
        return;
      }
      const delta = Math.hypot(
        acceleration.x - lastAcceleration.x,
        acceleration.y - lastAcceleration.y,
        acceleration.z - lastAcceleration.z,
      );
      lastAcceleration = { x: acceleration.x, y: acceleration.y, z: acceleration.z };
      if (delta > 5.2) addShake(clamp(delta / 12, 0.45, 1.35));
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      stage.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - pointerX;
      const dy = event.clientY - pointerY;
      pointerX = event.clientX;
      pointerY = event.clientY;
      targetGravityX = clamp(dx / 38, -0.14, 0.14);
      targetGravityY = 0.04 + clamp(dy / 38, -0.14, 0.14);
      impulseX += dx * 0.018;
      impulseY += dy * 0.018;
    };

    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      window.setTimeout(() => {
        if (!dragging && permissionRef.current !== 'enabled') {
          targetGravityX = 0;
          targetGravityY = 0.055;
        }
      }, 240);
    };

    const resizeObserver = new ResizeObserver(resize);
    const themeObserver = new MutationObserver(() => {
      dark = document.documentElement.classList.contains('dark');
    });
    resizeObserver.observe(stage);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('deviceorientation', onOrientation);
    window.addEventListener('devicemotion', onMotion);
    resize();
    frame = window.requestAnimationFrame(animate);

    if (!window.isSecureContext || !('DeviceOrientationEvent' in window)) {
      updatePermission('unavailable');
    }

    return () => {
      shakeRef.current = () => undefined;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('devicemotion', onMotion);
    };
  }, [updatePermission]);

  const enableTilt = async () => {
    if (!window.isSecureContext) {
      updatePermission('unavailable');
      return;
    }

    const orientationEvent = window.DeviceOrientationEvent as unknown as
      | PermissionCapableConstructor
      | undefined;
    const motionEvent = window.DeviceMotionEvent as unknown as
      | PermissionCapableConstructor
      | undefined;
    if (!orientationEvent && !motionEvent) {
      updatePermission('unavailable');
      return;
    }

    sensorEventSeenRef.current = false;
    updatePermission('requesting');
    try {
      const requests: Array<Promise<'granted' | 'denied'>> = [];
      if (orientationEvent?.requestPermission) requests.push(orientationEvent.requestPermission());
      if (motionEvent?.requestPermission) requests.push(motionEvent.requestPermission());
      const results = requests.length > 0 ? await Promise.all(requests) : ['granted' as const];
      if (!results.includes('granted')) {
        updatePermission('denied');
        return;
      }

      window.setTimeout(() => {
        if (permissionRef.current === 'requesting') {
          updatePermission(sensorEventSeenRef.current ? 'enabled' : 'unavailable');
        }
      }, 1500);
    } catch {
      updatePermission('denied');
    }
  };

  const status =
    permission === 'enabled'
      ? 'Tilt and shake are live.'
      : permission === 'requesting'
        ? 'Waiting for the first motion reading…'
        : permission === 'denied'
          ? 'Sensor access was declined. Dragging still works.'
          : permission === 'unavailable'
            ? 'Motion sensing is unavailable here. Dragging still works.'
            : 'Drag the globe, shake it, or enable phone tilt.';

  return (
    <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
      <div
        ref={stageRef}
        className="relative min-h-[28rem] touch-none overflow-hidden rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_50%_35%,hsl(var(--muted)/0.55),transparent_62%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] sm:min-h-[36rem]"
        data-snow-globe-stage
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Interactive snow globe with a cabin, tree, and simulated snow"
        >
          An interactive snow globe. Use the controls beside it to move the snow.
        </canvas>
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
          drag · tilt · shake
        </p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <h2 className="font-semibold">Pocket snow globe</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground" aria-live="polite">
            {status}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void enableTilt()}
          disabled={
            permission === 'requesting' ||
            permission === 'enabled' ||
            permission === 'unavailable'
          }
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity disabled:cursor-default disabled:opacity-55"
        >
          <Smartphone className="h-4 w-4" aria-hidden="true" />
          {permission === 'enabled'
            ? 'Tilt enabled'
            : permission === 'requesting'
              ? 'Requesting access…'
              : 'Enable phone tilt'}
        </button>

        <button
          type="button"
          onClick={() => shakeRef.current()}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Shake the globe
        </button>

        <p className="px-1 text-xs leading-relaxed text-muted-foreground">
          Sensor readings stay in this page. Some mobile browsers ask for access after you tap the
          button.
        </p>
      </div>
    </section>
  );
}
