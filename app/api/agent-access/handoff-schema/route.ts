import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://teamleaderleo.com/api/agent-access/handoff-schema',
  title: 'Scrapbook agent handoff',
  description:
    'A transport-neutral, non-mutating handoff for an agent connection that can inspect Scrapbook but cannot safely update the canonical repository itself. GitHub evidence uses the same ownership-based host rule as tracked Scrapbook files: direct github.com for teamleaderleo repositories and redirect.github.com for third-party repositories unless the human explicitly requests a direct relationship.',
  type: 'object',
  additionalProperties: false,
  required: [
    'formatVersion',
    'repository',
    'base',
    'intent',
    'lane',
    'files',
    'evidence',
    'validation',
    'review',
    'risks',
  ],
  properties: {
    formatVersion: { const: 1 },
    repository: { const: 'teamleaderleo/scrapbook' },
    base: {
      type: 'string',
      minLength: 1,
      description: 'Current main ref, preferably main@<commit-sha> when known.',
    },
    intent: { type: 'string', minLength: 1, maxLength: 500 },
    lane: {
      enum: [
        'guest-check-in',
        'bot-desk',
        'agent-journal',
        'repository-work',
        'other',
      ],
      description:
        'Contribution category. bot-desk is the compatibility identifier for the human-facing Workbench lane.',
    },
    files: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['path', 'operation'],
        properties: {
          path: { type: 'string', minLength: 1 },
          operation: { enum: ['create', 'update'] },
          content: { type: ['string', 'null'] },
          patch: { type: ['string', 'null'] },
        },
        anyOf: [
          {
            required: ['content'],
            properties: { content: { type: 'string', minLength: 1 } },
          },
          {
            required: ['patch'],
            properties: { patch: { type: 'string', minLength: 1 } },
          },
        ],
      },
    },
    metadata: {
      description:
        'Optional lane-specific registry/frontmatter/typed-entry metadata needed to apply the handoff.',
    },
    evidence: {
      type: 'array',
      description:
        'Primary-source evidence URLs or identifiers. Use direct https://github.com/... for teamleaderleo repositories, including forks under that namespace. Use the equivalent https://redirect.github.com/... URL for third-party GitHub references unless the human explicitly requests a direct relationship or backlink.',
      items: { type: 'string', minLength: 1 },
    },
    validation: {
      type: 'array',
      minItems: 1,
      items: { type: 'string', minLength: 1 },
    },
    review: {
      type: 'object',
      additionalProperties: false,
      required: ['humanReviewRequired', 'reason'],
      properties: {
        humanReviewRequired: { type: 'boolean' },
        reason: { type: ['string', 'null'] },
      },
    },
    risks: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
    },
  },
} as const;

export function GET() {
  return Response.json(schema, {
    headers: {
      'Cache-Control': REPOSITORY_PUBLIC_CACHE_CONTROL,
      'Content-Type': 'application/schema+json; charset=utf-8',
    },
  });
}
