export const TACTILE_SEED = 411;
export const FIXED_TIMESTEP_SECONDS = 1 / 60;
export const WORLD_WIDTH = 720;
export const WORLD_HEIGHT = 420;

export type Vec2 = { x: number; y: number };

export type Particle = Vec2 & {
  id: string;
  previousX: number;
  previousY: number;
  radius: number;
  inverseMass: number;
};

export type DistanceConstraint = {
  a: number;
  b: number;
  restLength: number;
  stiffness: number;
};

export type AreaConstraint = {
  indices: number[];
  restArea: number;
  stiffness: number;
};

export type RigidBlock = Vec2 & {
  id: string;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  restitution: number;
};

export type TactileWorld = {
  seed: number;
  randomState: number;
  width: number;
  height: number;
  frame: number;
  particles: Particle[];
  distanceConstraints: DistanceConstraint[];
  areaConstraint: AreaConstraint;
  blocks: RigidBlock[];
};

export type StepOptions = {
  gravity?: number;
  particleDamping?: number;
  blockDamping?: number;
  solverIterations?: number;
};

export type SelectedBody = 'gel' | string;

function nextRandom(state: number): [number, number] {
  const next = (state + 0x6d2b79f5) | 0;
  let value = next;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return [((value ^ (value >>> 14)) >>> 0) / 4_294_967_296, next];
}

function polygonArea(particles: Particle[], indices: number[]): number {
  let sum = 0;
  for (let index = 0; index < indices.length; index += 1) {
    const current = particles[indices[index]];
    const next = particles[indices[(index + 1) % indices.length]];
    sum += current.x * next.y - next.x * current.y;
  }
  return sum / 2;
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function createTactileWorld(
  seed = TACTILE_SEED,
  width = WORLD_WIDTH,
  height = WORLD_HEIGHT,
): TactileWorld {
  let randomState = seed | 0;
  const particles: Particle[] = [];
  const particleCount = 10;
  const centreX = width * 0.56;
  const centreY = height * 0.38;

  for (let index = 0; index < particleCount; index += 1) {
    const angle = (Math.PI * 2 * index) / particleCount;
    const [jitter, nextState] = nextRandom(randomState);
    randomState = nextState;
    const x = centreX + Math.cos(angle) * (74 + jitter * 4);
    const y = centreY + Math.sin(angle) * (52 + jitter * 3);
    particles.push({
      id: `gel-${index}`,
      x,
      y,
      previousX: x,
      previousY: y,
      radius: 8,
      inverseMass: 1,
    });
  }

  const distanceConstraints: DistanceConstraint[] = [];
  for (let index = 0; index < particleCount; index += 1) {
    const next = (index + 1) % particleCount;
    const brace = (index + 2) % particleCount;
    distanceConstraints.push({
      a: index,
      b: next,
      restLength: distance(particles[index], particles[next]),
      stiffness: 0.88,
    });
    distanceConstraints.push({
      a: index,
      b: brace,
      restLength: distance(particles[index], particles[brace]),
      stiffness: 0.32,
    });
  }

  const blocks: RigidBlock[] = [
    {
      id: 'block-a',
      x: width * 0.2,
      y: height * 0.25,
      width: 82,
      height: 54,
      velocityX: 12,
      velocityY: 0,
      restitution: 0.2,
    },
    {
      id: 'block-b',
      x: width * 0.34,
      y: height * 0.54,
      width: 66,
      height: 66,
      velocityX: -8,
      velocityY: 0,
      restitution: 0.18,
    },
    {
      id: 'block-c',
      x: width * 0.76,
      y: height * 0.2,
      width: 96,
      height: 42,
      velocityX: -10,
      velocityY: 0,
      restitution: 0.22,
    },
  ];

  const areaIndices = particles.map((_, index) => index);
  return {
    seed,
    randomState,
    width,
    height,
    frame: 0,
    particles,
    distanceConstraints,
    areaConstraint: {
      indices: areaIndices,
      restArea: polygonArea(particles, areaIndices),
      stiffness: 0.36,
    },
    blocks,
  };
}

export function snapshotWorld(world: TactileWorld) {
  return {
    seed: world.seed,
    randomState: world.randomState,
    particles: world.particles.map((particle) => ({
      x: particle.x,
      y: particle.y,
      previousX: particle.previousX,
      previousY: particle.previousY,
    })),
    blocks: world.blocks.map((block) => ({
      x: block.x,
      y: block.y,
      velocityX: block.velocityX,
      velocityY: block.velocityY,
    })),
  };
}

export function solveDistanceConstraint(
  particles: Particle[],
  constraint: DistanceConstraint,
): void {
  const a = particles[constraint.a];
  const b = particles[constraint.b];
  const deltaX = b.x - a.x;
  const deltaY = b.y - a.y;
  const currentLength = Math.hypot(deltaX, deltaY);
  if (currentLength < 0.0001) return;

  const inverseMass = a.inverseMass + b.inverseMass;
  if (inverseMass === 0) return;
  const correction = ((currentLength - constraint.restLength) / currentLength) * constraint.stiffness;
  const correctionX = deltaX * correction;
  const correctionY = deltaY * correction;

  a.x += correctionX * (a.inverseMass / inverseMass);
  a.y += correctionY * (a.inverseMass / inverseMass);
  b.x -= correctionX * (b.inverseMass / inverseMass);
  b.y -= correctionY * (b.inverseMass / inverseMass);
}

export function solveAreaConstraint(
  particles: Particle[],
  constraint: AreaConstraint,
): void {
  const currentArea = polygonArea(particles, constraint.indices);
  const areaError = currentArea - constraint.restArea;
  if (Math.abs(areaError) < 0.001) return;

  const gradients = constraint.indices.map((particleIndex, index) => {
    const previous = particles[constraint.indices[(index - 1 + constraint.indices.length) % constraint.indices.length]];
    const next = particles[constraint.indices[(index + 1) % constraint.indices.length]];
    return {
      particleIndex,
      x: (next.y - previous.y) / 2,
      y: (previous.x - next.x) / 2,
    };
  });

  let denominator = 0;
  for (const gradient of gradients) {
    const particle = particles[gradient.particleIndex];
    denominator += particle.inverseMass * (gradient.x ** 2 + gradient.y ** 2);
  }
  if (denominator < 0.0001) return;

  const lambda = (areaError / denominator) * constraint.stiffness;
  for (const gradient of gradients) {
    const particle = particles[gradient.particleIndex];
    particle.x -= particle.inverseMass * lambda * gradient.x;
    particle.y -= particle.inverseMass * lambda * gradient.y;
  }
}

function collideParticleWithBounds(particle: Particle, world: TactileWorld): void {
  const velocityX = particle.x - particle.previousX;
  const velocityY = particle.y - particle.previousY;
  const minimumX = particle.radius;
  const maximumX = world.width - particle.radius;
  const minimumY = particle.radius;
  const maximumY = world.height - particle.radius;

  if (particle.x < minimumX || particle.x > maximumX) {
    particle.x = clamp(particle.x, minimumX, maximumX);
    particle.previousX = particle.x + velocityX * 0.18;
  }
  if (particle.y < minimumY || particle.y > maximumY) {
    particle.y = clamp(particle.y, minimumY, maximumY);
    particle.previousY = particle.y + velocityY * 0.12;
  }
}

function collideBlockWithBounds(block: RigidBlock, world: TactileWorld): void {
  const halfWidth = block.width / 2;
  const halfHeight = block.height / 2;
  const minimumX = halfWidth;
  const maximumX = world.width - halfWidth;
  const minimumY = halfHeight;
  const maximumY = world.height - halfHeight;

  if (block.x < minimumX || block.x > maximumX) {
    block.x = clamp(block.x, minimumX, maximumX);
    block.velocityX *= -block.restitution;
  }
  if (block.y < minimumY || block.y > maximumY) {
    block.y = clamp(block.y, minimumY, maximumY);
    block.velocityY *= -block.restitution;
    if (Math.abs(block.velocityY) < 3) block.velocityY = 0;
  }
}

function collideBlocks(a: RigidBlock, b: RigidBlock): void {
  const overlapX = (a.width + b.width) / 2 - Math.abs(b.x - a.x);
  const overlapY = (a.height + b.height) / 2 - Math.abs(b.y - a.y);
  if (overlapX <= 0 || overlapY <= 0) return;

  if (overlapX < overlapY) {
    const direction = b.x >= a.x ? 1 : -1;
    a.x -= (overlapX / 2) * direction;
    b.x += (overlapX / 2) * direction;
    const average = (a.velocityX + b.velocityX) / 2;
    a.velocityX = average * 0.3;
    b.velocityX = average * 0.3;
  } else {
    const direction = b.y >= a.y ? 1 : -1;
    a.y -= (overlapY / 2) * direction;
    b.y += (overlapY / 2) * direction;
    const average = (a.velocityY + b.velocityY) / 2;
    a.velocityY = average * 0.2;
    b.velocityY = average * 0.2;
  }
}

function collideParticleWithBlock(particle: Particle, block: RigidBlock): void {
  const left = block.x - block.width / 2;
  const right = block.x + block.width / 2;
  const top = block.y - block.height / 2;
  const bottom = block.y + block.height / 2;
  const nearestX = clamp(particle.x, left, right);
  const nearestY = clamp(particle.y, top, bottom);
  let deltaX = particle.x - nearestX;
  let deltaY = particle.y - nearestY;
  let length = Math.hypot(deltaX, deltaY);

  if (length >= particle.radius) return;
  if (length < 0.0001) {
    const distances = [
      { axis: 'x' as const, direction: -1, value: Math.abs(particle.x - left) },
      { axis: 'x' as const, direction: 1, value: Math.abs(right - particle.x) },
      { axis: 'y' as const, direction: -1, value: Math.abs(particle.y - top) },
      { axis: 'y' as const, direction: 1, value: Math.abs(bottom - particle.y) },
    ].sort((first, second) => first.value - second.value);
    const nearest = distances[0];
    deltaX = nearest.axis === 'x' ? nearest.direction : 0;
    deltaY = nearest.axis === 'y' ? nearest.direction : 0;
    length = 1;
  }

  const penetration = particle.radius - length;
  particle.x += (deltaX / length) * penetration;
  particle.y += (deltaY / length) * penetration;
}

export function stepTactileWorld(
  world: TactileWorld,
  deltaSeconds = FIXED_TIMESTEP_SECONDS,
  options: StepOptions = {},
): void {
  const gravity = options.gravity ?? 820;
  const particleDamping = options.particleDamping ?? 0.992;
  const blockDamping = options.blockDamping ?? 0.996;
  const solverIterations = options.solverIterations ?? 6;

  for (const particle of world.particles) {
    const velocityX = (particle.x - particle.previousX) * particleDamping;
    const velocityY = (particle.y - particle.previousY) * particleDamping;
    particle.previousX = particle.x;
    particle.previousY = particle.y;
    particle.x += velocityX;
    particle.y += velocityY + gravity * deltaSeconds * deltaSeconds;
  }

  for (const block of world.blocks) {
    block.velocityX *= blockDamping;
    block.velocityY = block.velocityY * blockDamping + gravity * deltaSeconds;
    block.x += block.velocityX * deltaSeconds;
    block.y += block.velocityY * deltaSeconds;
  }

  for (let iteration = 0; iteration < solverIterations; iteration += 1) {
    for (const constraint of world.distanceConstraints) {
      solveDistanceConstraint(world.particles, constraint);
    }
    solveAreaConstraint(world.particles, world.areaConstraint);

    for (const particle of world.particles) {
      collideParticleWithBounds(particle, world);
      for (const block of world.blocks) collideParticleWithBlock(particle, block);
    }
    for (const block of world.blocks) collideBlockWithBounds(block, world);
    for (let a = 0; a < world.blocks.length; a += 1) {
      for (let b = a + 1; b < world.blocks.length; b += 1) {
        collideBlocks(world.blocks[a], world.blocks[b]);
      }
    }
  }

  world.frame += 1;
}

export function resetTactileWorld(world: TactileWorld): TactileWorld {
  return createTactileWorld(world.seed, world.width, world.height);
}

export function agitateTactileWorld(world: TactileWorld, strength = 120): void {
  for (const particle of world.particles) {
    const [randomX, stateAfterX] = nextRandom(world.randomState);
    const [randomY, stateAfterY] = nextRandom(stateAfterX);
    world.randomState = stateAfterY;
    particle.previousX = particle.x - (randomX - 0.5) * strength * FIXED_TIMESTEP_SECONDS;
    particle.previousY = particle.y - (randomY - 0.65) * strength * FIXED_TIMESTEP_SECONDS;
  }
  for (const block of world.blocks) {
    const [randomX, stateAfterX] = nextRandom(world.randomState);
    const [randomY, stateAfterY] = nextRandom(stateAfterX);
    world.randomState = stateAfterY;
    block.velocityX += (randomX - 0.5) * strength;
    block.velocityY -= randomY * strength * 0.55;
  }
}

export function setParticlePosition(world: TactileWorld, index: number, position: Vec2): void {
  const particle = world.particles[index];
  if (!particle) return;
  particle.x = clamp(position.x, particle.radius, world.width - particle.radius);
  particle.y = clamp(position.y, particle.radius, world.height - particle.radius);
  particle.previousX = particle.x;
  particle.previousY = particle.y;
}

export function setBlockPosition(world: TactileWorld, id: string, position: Vec2): void {
  const block = world.blocks.find((candidate) => candidate.id === id);
  if (!block) return;
  block.x = clamp(position.x, block.width / 2, world.width - block.width / 2);
  block.y = clamp(position.y, block.height / 2, world.height - block.height / 2);
  block.velocityX = 0;
  block.velocityY = 0;
}

export function nudgeSelectedBody(world: TactileWorld, selected: SelectedBody, offset: Vec2): void {
  if (selected === 'gel') {
    for (let index = 0; index < world.particles.length; index += 1) {
      const particle = world.particles[index];
      setParticlePosition(world, index, { x: particle.x + offset.x, y: particle.y + offset.y });
    }
    return;
  }
  const block = world.blocks.find((candidate) => candidate.id === selected);
  if (block) setBlockPosition(world, block.id, { x: block.x + offset.x, y: block.y + offset.y });
}

export function selectedBodyAnchor(world: TactileWorld, selected: SelectedBody): Vec2 {
  if (selected !== 'gel') {
    const block = world.blocks.find((candidate) => candidate.id === selected);
    if (block) return { x: block.x, y: block.y };
  }
  const sum = world.particles.reduce(
    (total, particle) => ({ x: total.x + particle.x, y: total.y + particle.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / world.particles.length, y: sum.y / world.particles.length };
}

export function gelArea(world: TactileWorld): number {
  return polygonArea(world.particles, world.areaConstraint.indices);
}
