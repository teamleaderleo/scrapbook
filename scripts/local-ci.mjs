#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';

const argumentsSet = new Set(process.argv.slice(2));
const supportedArguments = new Set(['--skip-install']);
const unknownArguments = [...argumentsSet].filter(
  argument => !supportedArguments.has(argument)
);

if (unknownArguments.length > 0) {
  console.error(`Unknown local CI option: ${unknownArguments.join(', ')}`);
  console.error(
    'Browser checks are explicit: use pnpm test:e2e, pnpm test:e2e:full, or a targeted Playwright command.'
  );
  process.exit(2);
}

const nodeMajor = Number.parseInt(
  process.versions.node.split('.')[0] ?? '',
  10
);
if (nodeMajor !== 22) {
  console.error(
    `Local CI requires Node 22.x (current: ${process.versions.node}).`
  );
  process.exit(2);
}

const verificationEnvironment = {
  ...process.env,
  LOCAL_CI: '1',
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
};

const steps = [];

if (!argumentsSet.has('--skip-install')) {
  steps.push({
    label: 'Install locked dependencies',
    command: 'pnpm',
    args: ['install', '--frozen-lockfile', '--prefer-offline', '--reporter=silent'],
  });
}

steps.push(
  { label: 'Lint', command: 'pnpm', args: ['lint'] },
  { label: 'Unit tests', command: 'pnpm', args: ['test'] },
  {
    label: 'Production build (includes TypeScript)',
    command: 'pnpm',
    args: ['build'],
  },
  {
    label: 'Reject whitespace errors',
    command: 'git',
    args: ['diff', '--check'],
  }
);

const startedAt = Date.now();

for (const [index, step] of steps.entries()) {
  const stepStartedAt = Date.now();
  console.log(`\n[${index + 1}/${steps.length}] ${step.label}`);

  const result = spawnSync(step.command, step.args, {
    env: verificationEnvironment,
    stdio: 'inherit',
  });

  const elapsedSeconds = ((Date.now() - stepStartedAt) / 1_000).toFixed(1);

  if (result.error) {
    console.error(`${step.label} could not start: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${step.label} failed after ${elapsedSeconds}s.`);
    process.exit(result.status ?? 1);
  }

  console.log(`${step.label} passed in ${elapsedSeconds}s.`);
}

const totalSeconds = ((Date.now() - startedAt) / 1_000).toFixed(1);
console.log(
  `\nLocal verification passed ${steps.length}/${steps.length} steps in ${totalSeconds}s.`
);
