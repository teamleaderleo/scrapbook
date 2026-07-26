import { describe, expect, it } from 'vitest';
import {
  FIXED_TIMESTEP_SECONDS,
  agitateTactileWorld,
  createTactileWorld,
  gelArea,
  resetTactileWorld,
  snapshotWorld,
  solveAreaConstraint,
  solveDistanceConstraint,
  stepTactileWorld,
} from './physics';
import { consumeFixedTime } from './loop';

describe('tactile physics foundation', () => {
  it('accumulates fixed timesteps and bounds catch-up work', () => {
    const first = consumeFixedTime(0, 10, 16, 4);
    expect(first).toEqual({ steps: 0, remainderMs: 10, droppedMs: 0 });

    const second = consumeFixedTime(first.remainderMs, 90, 16, 4);
    expect(second.steps).toBe(4);
    expect(second.remainderMs).toBe(4);
    expect(second.droppedMs).toBe(32);
  });

  it('resets to the same deterministic seed and agitation sequence', () => {
    const first = createTactileWorld(911);
    const second = createTactileWorld(911);
    agitateTactileWorld(first);
    agitateTactileWorld(second);
    expect(snapshotWorld(first)).toEqual(snapshotWorld(second));

    stepTactileWorld(first, FIXED_TIMESTEP_SECONDS);
    const reset = resetTactileWorld(first);
    expect(snapshotWorld(reset)).toEqual(snapshotWorld(createTactileWorld(911)));
  });

  it('projects stretched distance and area constraints toward rest values', () => {
    const world = createTactileWorld();
    const distanceConstraint = world.distanceConstraints[0];
    world.particles[distanceConstraint.b].x += 80;
    const beforeDistance = Math.hypot(
      world.particles[distanceConstraint.b].x - world.particles[distanceConstraint.a].x,
      world.particles[distanceConstraint.b].y - world.particles[distanceConstraint.a].y,
    );
    solveDistanceConstraint(world.particles, distanceConstraint);
    const afterDistance = Math.hypot(
      world.particles[distanceConstraint.b].x - world.particles[distanceConstraint.a].x,
      world.particles[distanceConstraint.b].y - world.particles[distanceConstraint.a].y,
    );
    expect(Math.abs(afterDistance - distanceConstraint.restLength)).toBeLessThan(
      Math.abs(beforeDistance - distanceConstraint.restLength),
    );

    world.particles[0].x += 120;
    const beforeAreaError = Math.abs(gelArea(world) - world.areaConstraint.restArea);
    for (let index = 0; index < 8; index += 1) {
      solveAreaConstraint(world.particles, world.areaConstraint);
    }
    expect(Math.abs(gelArea(world) - world.areaConstraint.restArea)).toBeLessThan(beforeAreaError);
  });

  it('keeps particles and rigid blocks inside collision bounds', () => {
    const world = createTactileWorld();
    world.particles[0].x = -200;
    world.particles[0].y = world.height + 200;
    world.blocks[0].x = -100;
    world.blocks[0].y = world.height + 100;

    stepTactileWorld(world, FIXED_TIMESTEP_SECONDS);

    for (const particle of world.particles) {
      expect(particle.x).toBeGreaterThanOrEqual(particle.radius);
      expect(particle.x).toBeLessThanOrEqual(world.width - particle.radius);
      expect(particle.y).toBeGreaterThanOrEqual(particle.radius);
      expect(particle.y).toBeLessThanOrEqual(world.height - particle.radius);
    }
    for (const block of world.blocks) {
      expect(block.x).toBeGreaterThanOrEqual(block.width / 2);
      expect(block.x).toBeLessThanOrEqual(world.width - block.width / 2);
      expect(block.y).toBeGreaterThanOrEqual(block.height / 2);
      expect(block.y).toBeLessThanOrEqual(world.height - block.height / 2);
    }
  });
});
