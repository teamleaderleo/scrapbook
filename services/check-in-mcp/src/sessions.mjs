import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  INSPIRATION_MODES,
  InputError,
  PERSONALITY_PRESETS,
  REMIX_KINDS,
  STYLE_PRESETS,
  checkInBranch,
  validateArtworkSource,
  validateConversationHref,
  validateEntryId,
  validateGitHubSource,
  validateProposal,
  validateRepository,
  validateUtcDate,
} from './contracts.mjs';

const TOKEN_PREFIX = 'sbs1';
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TOKEN_MAX_LENGTH = 12_000;
const MODES = new Set(['quiet', 'goofy', 'serious', 'overdone']);
const INSPIRATIONS = new Set(INSPIRATION_MODES);
const STYLES = new Set(STYLE_PRESETS);
const PERSONALITIES = new Set(PERSONALITY_PRESETS);
const REMIXES = new Set(REMIX_KINDS);
const IMPORT_PENDING = new Set(['queued', 'in_progress', 'requested', 'waiting', 'pending']);

export const SESSION_STAGES = [
  'awaiting_text',
  'awaiting_artwork',
  'ready_for_plan',
  'awaiting_branch',
  'awaiting_artwork_import',
  'awaiting_entry_save',
  'awaiting_draft_pr',
  'published',
];

function object(properties, required = []) {
  return { type: 'object', additionalProperties: false, properties, required };
}

function toolResult(data, message) {
  return {
    structuredContent: data,
    content: [{ type: 'text', text: message }],
  };
}

function toolError(error) {
  const message = error instanceof Error ? error.message : 'Unexpected session failure.';
  return {
    isError: true,
    structuredContent: { ok: false, error: message },
    content: [{ type: 'text', text: message }],
  };
}

function requireObject(value, field = 'arguments') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InputError(`${field} must be an object.`, field);
  }
  return value;
}

function rejectUnknownKeys(value, allowed, field = 'arguments') {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new InputError(`Unknown ${field} field: ${key}`, key);
  }
}

function boundedText(value, field, { min = 1, max = 240 } = {}) {
  if (typeof value !== 'string') throw new InputError(`${field} must be a string.`, field);
  if (/[\r\n\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) {
    throw new InputError(`${field} must be a single printable line.`, field);
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new InputError(`${field} must contain ${min}–${max} characters.`, field);
  }
  return trimmed;
}

function optionalText(value, field, options) {
  return value === undefined ? undefined : boundedText(value, field, options);
}

function optionalChoice(value, field, choices) {
  if (value === undefined) return undefined;
  const choice = boundedText(value, field, { max: 32 });
  if (!choices.has(choice)) throw new InputError(`${field} is not a supported option.`, field);
  return choice;
}

function optionalUniqueChoices(value, field, choices, maximum = 3) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new InputError(`${field} must be an array.`, field);
  if (value.length > maximum) throw new InputError(`${field} may contain at most ${maximum} values.`, field);
  const parsed = value.map((item, index) => optionalChoice(item, `${field}[${index}]`, choices));
  if (new Set(parsed).size !== parsed.length) throw new InputError(`${field} values must be unique.`, field);
  return parsed;
}

function validateCreative(input) {
  const inspiration = optionalChoice(input.inspiration, 'inspiration', INSPIRATIONS) || 'blind';
  const style = optionalChoice(input.style, 'style', STYLES);
  const styleNote = optionalText(input.styleNote, 'styleNote', { max: 160 });
  const personalities = optionalUniqueChoices(input.personalities, 'personalities', PERSONALITIES);
  const remixSourceId = input.remixSourceId === undefined ? undefined : validateEntryId(input.remixSourceId);
  const remixKind = optionalChoice(input.remixKind, 'remixKind', REMIXES);
  const remixNote = optionalText(input.remixNote, 'remixNote', { max: 160 });
  if (style === 'custom' && !styleNote) throw new InputError('styleNote is required when style is custom.', 'styleNote');
  const hasRemixFields = Boolean(remixSourceId || remixKind || remixNote);
  if (inspiration === 'remix' && (!remixSourceId || !remixKind)) {
    throw new InputError('remixSourceId and remixKind are required for remix inspiration.', 'remixSourceId');
  }
  if (inspiration !== 'remix' && hasRemixFields) {
    throw new InputError('Remix fields require inspiration to equal remix.', 'inspiration');
  }
  return { inspiration, style, styleNote, personalities, remixSourceId, remixKind, remixNote };
}

function validateStartInput(value) {
  const input = requireObject(value);
  rejectUnknownKeys(input, new Set([
    'repository', 'model', 'sourceLabel', 'sourceHref', 'conversationLabel', 'conversationHref',
    'inspiration', 'style', 'styleNote', 'personalities', 'remixSourceId', 'remixKind', 'remixNote',
  ]));
  const repository = validateRepository(input.repository);
  const conversationHref = validateConversationHref(input.conversationHref);
  const conversationLabel = optionalText(input.conversationLabel, 'conversationLabel', { max: 32 });
  if ((conversationHref && !conversationLabel) || (conversationLabel && !conversationHref)) {
    throw new InputError('conversationLabel and conversationHref must be supplied together.', 'conversationHref');
  }
  return {
    repository,
    model: optionalText(input.model, 'model', { max: 80 }),
    sourceLabel: boundedText(input.sourceLabel, 'sourceLabel', { max: 64 }),
    sourceHref: validateGitHubSource(input.sourceHref, repository),
    conversationLabel,
    conversationHref,
    ...validateCreative(input),
  };
}

function validateTextInput(value) {
  const input = requireObject(value);
  rejectUnknownKeys(input, new Set(['sessionToken', 'entryId', 'name', 'mark', 'note', 'date', 'mode']));
  const entryId = validateEntryId(input.entryId);
  const mode = boundedText(input.mode, 'mode', { max: 16 });
  if (!MODES.has(mode)) throw new InputError('mode must be quiet, goofy, serious, or overdone.', 'mode');
  return {
    sessionToken: boundedText(input.sessionToken, 'sessionToken', { max: TOKEN_MAX_LENGTH }),
    entryId,
    branch: checkInBranch(entryId),
    name: boundedText(input.name, 'name', { max: 80 }),
    mark: boundedText(input.mark, 'mark', { max: 16 }),
    note: boundedText(input.note, 'note', { max: 240 }),
    date: validateUtcDate(input.date),
    mode,
  };
}

function validateAttachInput(value) {
  const input = requireObject(value);
  rejectUnknownKeys(input, new Set(['sessionToken', 'sourceType', 'source', 'imageAlt']));
  const sourceType = boundedText(input.sourceType, 'sourceType', { max: 32 });
  return {
    sessionToken: boundedText(input.sessionToken, 'sessionToken', { max: TOKEN_MAX_LENGTH }),
    sourceType,
    source: validateArtworkSource(sourceType, input.source),
    imageAlt: boundedText(input.imageAlt, 'imageAlt', { max: 240 }),
  };
}

function validateTokenOnly(value) {
  const input = requireObject(value);
  rejectUnknownKeys(input, new Set(['sessionToken']));
  return { sessionToken: boundedText(input.sessionToken, 'sessionToken', { max: TOKEN_MAX_LENGTH }) };
}

function validateAdvanceInput(value) {
  const input = requireObject(value);
  rejectUnknownKeys(input, new Set(['sessionToken', 'approved']));
  if (input.approved !== true) throw new InputError('approved must be true for this write.', 'approved');
  return {
    sessionToken: boundedText(input.sessionToken, 'sessionToken', { max: TOKEN_MAX_LENGTH }),
    approved: true,
  };
}

function signature(secret, body) {
  return createHmac('sha256', secret).update(`${TOKEN_PREFIX}.${body}`).digest('base64url');
}

export function createSessionCodec(secret, { now = () => Date.now(), randomId = randomUUID } = {}) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 16) {
    throw new Error('Scrapbook session signing secret must contain at least 16 bytes.');
  }

  return {
    create(draft) {
      const createdAt = now();
      return {
        version: 1,
        id: randomId(),
        createdAt,
        updatedAt: createdAt,
        expiresAt: createdAt + TOKEN_TTL_MS,
        draft,
        artworkSource: null,
        plannedAt: null,
        lastAction: null,
      };
    },
    encode(session) {
      const body = Buffer.from(JSON.stringify(session)).toString('base64url');
      return `${TOKEN_PREFIX}.${body}.${signature(secret, body)}`;
    },
    decode(token) {
      if (typeof token !== 'string' || token.length > TOKEN_MAX_LENGTH) {
        throw new InputError('sessionToken is invalid.', 'sessionToken');
      }
      const [prefix, body, supplied, extra] = token.split('.');
      if (prefix !== TOKEN_PREFIX || !body || !supplied || extra) {
        throw new InputError('sessionToken is invalid.', 'sessionToken');
      }
      const expected = signature(secret, body);
      const left = Buffer.from(supplied);
      const right = Buffer.from(expected);
      if (left.length !== right.length || !timingSafeEqual(left, right)) {
        throw new InputError('sessionToken signature is invalid.', 'sessionToken');
      }
      let session;
      try {
        session = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      } catch {
        throw new InputError('sessionToken payload is invalid.', 'sessionToken');
      }
      if (!session || session.version !== 1 || typeof session.id !== 'string' || !session.draft) {
        throw new InputError('sessionToken payload is unsupported.', 'sessionToken');
      }
      if (!Number.isFinite(session.expiresAt) || session.expiresAt <= now()) {
        throw new InputError('sessionToken has expired. Start a new check-in session.', 'sessionToken');
      }
      return session;
    },
    touch(session, patch = {}) {
      return { ...session, ...patch, updatedAt: now() };
    },
    now,
  };
}

function completeProposal(session) {
  return validateProposal(session.draft);
}

function draftStage(session) {
  const textFields = ['entryId', 'name', 'mark', 'note', 'date', 'mode'];
  if (textFields.some((field) => !session.draft[field])) return 'awaiting_text';
  if (!session.draft.artwork) return 'awaiting_artwork';
  return session.plannedAt ? 'awaiting_branch' : 'ready_for_plan';
}

function stageFromStatus(proposal, status) {
  if (status.pullRequest) return 'published';
  if (!status.branch.exists) return 'awaiting_branch';
  if (proposal.artwork === 'card' && !status.image.exists) return 'awaiting_artwork_import';
  if (!status.guestbook.containsEntry) return 'awaiting_entry_save';
  return 'awaiting_draft_pr';
}

function nextForStage(stage) {
  switch (stage) {
    case 'awaiting_text':
      return { tools: ['submit_check_in_text'], reason: 'Write the guestbook note and identity.', requiresApproval: false };
    case 'awaiting_artwork':
      return {
        tools: ['attach_check_in_artwork_source', 'skip_check_in_artwork'],
        reason: 'Attach an already-created image source or deliberately continue text-only.',
        requiresApproval: false,
      };
    case 'ready_for_plan':
      return { tools: ['plan_check_in_session'], reason: 'Validate the complete proposal against the live wall.', requiresApproval: false };
    case 'awaiting_branch':
      return { tools: ['advance_check_in_session'], reason: 'Reserve the fixed check-in branch.', requiresApproval: true };
    case 'awaiting_artwork_import':
      return { tools: ['advance_check_in_session', 'get_check_in_session'], reason: 'Dispatch or wait for the repository-owned image import.', requiresApproval: true };
    case 'awaiting_entry_save':
      return { tools: ['advance_check_in_session'], reason: 'Save the validated typed guestbook entry.', requiresApproval: true };
    case 'awaiting_draft_pr':
      return { tools: ['advance_check_in_session'], reason: 'Open the draft pull request.', requiresApproval: true };
    case 'published':
      return { tools: ['get_check_in_status'], reason: 'The draft PR exists; inspect CI before any review action.', requiresApproval: false };
    default:
      throw new Error(`Unknown check-in session stage: ${stage}`);
  }
}

function missingForStage(stage) {
  if (stage === 'awaiting_text') return ['entryId', 'name', 'mark', 'note', 'date', 'mode'];
  if (stage === 'awaiting_artwork') return ['artwork choice'];
  return [];
}

function sessionView(session, stage) {
  return {
    id: session.id,
    stage,
    createdAt: new Date(session.createdAt).toISOString(),
    updatedAt: new Date(session.updatedAt).toISOString(),
    expiresAt: new Date(session.expiresAt).toISOString(),
    draft: session.draft,
    artworkSource: session.artworkSource,
    missing: missingForStage(stage),
    next: nextForStage(stage),
    lastAction: session.lastAction,
  };
}

function securedDescriptor({ access, invoking, invoked, ...descriptor }) {
  const scope = access === 'write' ? 'scrapbook.checkins.write' : 'scrapbook.checkins.read';
  const securitySchemes = [{ type: 'oauth2', scopes: [scope] }];
  return {
    ...descriptor,
    securitySchemes,
    _meta: {
      securitySchemes,
      'openai/toolInvocation/invoking': invoking,
      'openai/toolInvocation/invoked': invoked,
    },
  };
}

function sessionSchemas(baseRegistry) {
  const planTool = baseRegistry.tools.find((tool) => tool.name === 'plan_check_in');
  const capabilitiesTool = baseRegistry.tools.find((tool) => tool.name === 'get_check_in_capabilities');
  if (!planTool || !capabilitiesTool) throw new Error('Base check-in registry is missing required tools.');
  const proposalSchema = planTool.inputSchema;
  const token = { type: 'string', minLength: 32, maxLength: TOKEN_MAX_LENGTH };
  const nullableString = { anyOf: [{ type: 'string' }, { type: 'null' }] };
  const artworkSource = {
    anyOf: [
      { type: 'null' },
      object({
        sourceType: { type: 'string', enum: ['drive', 'github-attachment'] },
        source: { type: 'string' },
      }, ['sourceType', 'source']),
    ],
  };
  const next = object({
    tools: { type: 'array', minItems: 1, items: { type: 'string' } },
    reason: { type: 'string' },
    requiresApproval: { type: 'boolean' },
  }, ['tools', 'reason', 'requiresApproval']);
  const lastAction = {
    anyOf: [
      { type: 'null' },
      object({ tool: { type: 'string' }, status: { type: 'string' }, at: { type: 'string' } }, ['tool', 'status', 'at']),
    ],
  };
  const session = object({
    id: { type: 'string' },
    stage: { type: 'string', enum: SESSION_STAGES },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    expiresAt: { type: 'string', format: 'date-time' },
    draft: { ...proposalSchema, required: [] },
    artworkSource,
    missing: { type: 'array', items: { type: 'string' } },
    next,
    lastAction,
  }, ['id', 'stage', 'createdAt', 'updatedAt', 'expiresAt', 'draft', 'artworkSource', 'missing', 'next', 'lastAction']);
  const sessionOutput = object({ ok: { const: true }, sessionToken: token, session }, ['ok', 'sessionToken', 'session']);
  const action = {
    anyOf: [
      { type: 'null' },
      object({ tool: { type: 'string' }, status: { type: 'string' }, message: { type: 'string' } }, ['tool', 'status', 'message']),
    ],
  };
  return {
    proposalSchema,
    planOutputSchema: planTool.outputSchema,
    capabilitiesTool,
    token,
    session,
    sessionOutput,
    startInput: object({
      repository: proposalSchema.properties.repository,
      model: proposalSchema.properties.model,
      sourceLabel: proposalSchema.properties.sourceLabel,
      sourceHref: proposalSchema.properties.sourceHref,
      conversationLabel: proposalSchema.properties.conversationLabel,
      conversationHref: proposalSchema.properties.conversationHref,
      inspiration: proposalSchema.properties.inspiration,
      style: proposalSchema.properties.style,
      styleNote: proposalSchema.properties.styleNote,
      personalities: proposalSchema.properties.personalities,
      remixSourceId: proposalSchema.properties.remixSourceId,
      remixKind: proposalSchema.properties.remixKind,
      remixNote: proposalSchema.properties.remixNote,
    }, ['repository', 'sourceLabel', 'sourceHref']),
    textInput: object({
      sessionToken: token,
      entryId: proposalSchema.properties.entryId,
      name: proposalSchema.properties.name,
      mark: proposalSchema.properties.mark,
      note: proposalSchema.properties.note,
      date: proposalSchema.properties.date,
      mode: proposalSchema.properties.mode,
    }, ['sessionToken', 'entryId', 'name', 'mark', 'note', 'date', 'mode']),
    attachInput: object({
      sessionToken: token,
      sourceType: { type: 'string', enum: ['drive', 'github-attachment'] },
      source: { type: 'string', minLength: 1, maxLength: 512 },
      imageAlt: proposalSchema.properties.imageAlt,
    }, ['sessionToken', 'sourceType', 'source', 'imageAlt']),
    tokenInput: object({ sessionToken: token }, ['sessionToken']),
    advanceInput: object({ sessionToken: token, approved: { type: 'boolean', const: true } }, ['sessionToken', 'approved']),
    planSessionOutput: object({
      ok: { const: true },
      sessionToken: token,
      session,
      plan: planTool.outputSchema,
    }, ['ok', 'sessionToken', 'session', 'plan']),
    advanceOutput: object({
      ok: { const: true },
      sessionToken: token,
      session,
      action,
    }, ['ok', 'sessionToken', 'session', 'action']),
    capabilityFlow: object({
      mode: { const: 'signed-stateless' },
      expiresAfterHours: { const: 168 },
      sequence: { type: 'array', items: { type: 'string' } },
      imageBrief: { const: 'separate-evolving-step' },
      publication: { const: 'one-approved-repository-mutation-per-advance' },
    }, ['mode', 'expiresAfterHours', 'sequence', 'imageBrief', 'publication']),
  };
}

async function inspectStage(baseRegistry, session) {
  const proposal = completeProposal(session);
  if (!session.plannedAt) return { proposal, stage: draftStage(session), status: null };
  const statusResult = await baseRegistry.call('get_check_in_status', {
    entryId: proposal.entryId,
    branch: proposal.branch,
  });
  if (statusResult.isError) throw new InputError(statusResult.content?.[0]?.text || 'Could not inspect check-in status.', 'sessionToken');
  return { proposal, stage: stageFromStatus(proposal, statusResult.structuredContent), status: statusResult.structuredContent };
}

export function createSessionToolRegistry(baseRegistry, {
  sessionSecret = 'development-only-scrapbook-session-signing-secret',
  now,
  randomId,
} = {}) {
  const codec = createSessionCodec(sessionSecret, { ...(now ? { now } : {}), ...(randomId ? { randomId } : {}) });
  const schema = sessionSchemas(baseRegistry);
  const full = baseRegistry.profile === 'full';
  const sessionTools = [
    {
      access: 'read',
      requiresApproval: false,
      descriptor: {
        ...schema.capabilitiesTool,
        description: `${schema.capabilitiesTool.description} It also reports the guided signed-session flow.`,
        outputSchema: {
          ...schema.capabilitiesTool.outputSchema,
          properties: {
            ...schema.capabilitiesTool.outputSchema.properties,
            sessionFlow: schema.capabilityFlow,
          },
          required: [...schema.capabilitiesTool.outputSchema.required, 'sessionFlow'],
        },
      },
    },
    {
      access: 'read',
      requiresApproval: false,
      descriptor: securedDescriptor({
        access: 'read',
        name: 'start_check_in_session',
        title: 'Start a guided Scrapbook check-in',
        description: 'Starts a signed, stateless seven-day check-in session from originating repository provenance and optional creative direction. It reads no prior cards and writes nothing.',
        inputSchema: schema.startInput,
        outputSchema: schema.sessionOutput,
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: false },
        invoking: 'Starting the check-in session',
        invoked: 'Check-in session started',
      }),
    },
    {
      access: 'read',
      requiresApproval: false,
      descriptor: securedDescriptor({
        access: 'read',
        name: 'submit_check_in_text',
        title: 'Add the check-in text',
        description: 'Adds the visitor identity, note, date, and tone to a signed session. It returns the next artwork choice without generating or prescribing an image brief.',
        inputSchema: schema.textInput,
        outputSchema: schema.sessionOutput,
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
        invoking: 'Adding the check-in text',
        invoked: 'Check-in text added',
      }),
    },
    {
      access: 'read',
      requiresApproval: false,
      descriptor: securedDescriptor({
        access: 'read',
        name: 'attach_check_in_artwork_source',
        title: 'Attach an artwork source',
        description: 'Attaches an already-created Drive file ID or supported GitHub user attachment to the signed session. It does not import or write the image yet.',
        inputSchema: schema.attachInput,
        outputSchema: schema.sessionOutput,
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
        invoking: 'Attaching the artwork source',
        invoked: 'Artwork source attached',
      }),
    },
    {
      access: 'read',
      requiresApproval: false,
      descriptor: securedDescriptor({
        access: 'read',
        name: 'skip_check_in_artwork',
        title: 'Continue with a text-only check-in',
        description: 'Deliberately marks a signed session as text-only. It performs no repository write and can be reversed later by attaching an artwork source.',
        inputSchema: schema.tokenInput,
        outputSchema: schema.sessionOutput,
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
        invoking: 'Choosing a text-only check-in',
        invoked: 'Text-only check-in selected',
      }),
    },
    {
      access: 'read',
      requiresApproval: false,
      descriptor: securedDescriptor({
        access: 'read',
        name: 'get_check_in_session',
        title: 'Get guided check-in progress',
        description: 'Restores a signed session and, after planning, re-reads live branch, image, entry, and draft-PR progress to return the exact next turn.',
        inputSchema: schema.tokenInput,
        outputSchema: schema.sessionOutput,
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true, idempotentHint: true },
        invoking: 'Reading the check-in session',
        invoked: 'Check-in session restored',
      }),
    },
    {
      access: 'read',
      requiresApproval: false,
      descriptor: securedDescriptor({
        access: 'read',
        name: 'plan_check_in_session',
        title: 'Validate a guided check-in session',
        description: 'Validates the completed signed session against the current guestbook and fixed branch boundary. It performs no write and returns the next publication turn.',
        inputSchema: schema.tokenInput,
        outputSchema: schema.planSessionOutput,
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true, idempotentHint: true },
        invoking: 'Validating the guided check-in',
        invoked: 'Guided check-in validated',
      }),
    },
    ...(full ? [{
      access: 'write',
      requiresApproval: true,
      descriptor: securedDescriptor({
        access: 'write',
        name: 'advance_check_in_session',
        title: 'Advance one approved publication step',
        description: 'After explicit approval, performs at most one next repository mutation for a planned session: reserve its fixed branch, dispatch its image import, save its typed entry, or open its draft PR. It never marks ready or merges.',
        inputSchema: schema.advanceInput,
        outputSchema: schema.advanceOutput,
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true, idempotentHint: true },
        invoking: 'Advancing one publication step',
        invoked: 'Publication step completed',
      }),
    }] : []),
  ];

  const sessionNames = new Set(sessionTools.map(({ descriptor }) => descriptor.name));
  const tools = [
    ...sessionTools.map(({ descriptor }) => descriptor),
    ...baseRegistry.tools.filter((tool) => !sessionNames.has(tool.name)),
  ];

  const handlers = {
    async get_check_in_capabilities(args) {
      const base = await baseRegistry.call('get_check_in_capabilities', args);
      if (base.isError) return base;
      const sessionFlow = {
        mode: 'signed-stateless',
        expiresAfterHours: 168,
        sequence: [
          'start_check_in_session',
          'submit_check_in_text',
          'attach_check_in_artwork_source or skip_check_in_artwork',
          'plan_check_in_session',
          ...(full ? ['advance_check_in_session until a draft PR exists'] : ['connect a full profile before publication']),
        ],
        imageBrief: 'separate-evolving-step',
        publication: 'one-approved-repository-mutation-per-advance',
      };
      return toolResult(
        { ...base.structuredContent, sessionFlow },
        `${base.content?.[0]?.text || 'Check-in capabilities loaded'} Guided signed sessions are available.`,
      );
    },
    async start_check_in_session(args) {
      const draft = validateStartInput(args);
      const session = codec.create(draft);
      const stage = draftStage(session);
      return toolResult({ ok: true, sessionToken: codec.encode(session), session: sessionView(session, stage) }, 'The guided check-in session is ready for its text.');
    },
    async submit_check_in_text(args) {
      const input = validateTextInput(args);
      const session = codec.decode(input.sessionToken);
      if (session.plannedAt) throw new InputError('This session has already been planned. Start a new session to change its identity.', 'sessionToken');
      if (session.draft.remixSourceId === input.entryId) throw new InputError('A check-in cannot remix itself.', 'entryId');
      const next = codec.touch(session, {
        draft: { ...session.draft, ...input, sessionToken: undefined, artwork: undefined, imageAlt: undefined },
        artworkSource: null,
      });
      delete next.draft.sessionToken;
      const stage = draftStage(next);
      return toolResult({ ok: true, sessionToken: codec.encode(next), session: sessionView(next, stage) }, 'The check-in text is saved in the signed session. Choose an artwork source or continue text-only.');
    },
    async attach_check_in_artwork_source(args) {
      const input = validateAttachInput(args);
      const session = codec.decode(input.sessionToken);
      if (!session.draft.entryId) throw new InputError('Submit the check-in text before attaching artwork.', 'sessionToken');
      if (session.plannedAt) throw new InputError('This session has already been planned. Start a new session to replace its artwork.', 'sessionToken');
      const draft = { ...session.draft, artwork: 'card', imageAlt: input.imageAlt };
      validateProposal(draft);
      const next = codec.touch(session, {
        draft,
        artworkSource: { sourceType: input.sourceType, source: input.source },
      });
      return toolResult({ ok: true, sessionToken: codec.encode(next), session: sessionView(next, 'ready_for_plan') }, 'The artwork source is attached. The complete session is ready for validation.');
    },
    async skip_check_in_artwork(args) {
      const { sessionToken } = validateTokenOnly(args);
      const session = codec.decode(sessionToken);
      if (!session.draft.entryId) throw new InputError('Submit the check-in text before choosing a text-only visit.', 'sessionToken');
      if (session.plannedAt) throw new InputError('This session has already been planned. Start a new session to change its artwork choice.', 'sessionToken');
      const draft = { ...session.draft, artwork: 'none' };
      delete draft.imageAlt;
      validateProposal(draft);
      const next = codec.touch(session, { draft, artworkSource: null });
      return toolResult({ ok: true, sessionToken: codec.encode(next), session: sessionView(next, 'ready_for_plan') }, 'The session is intentionally text-only and ready for validation.');
    },
    async get_check_in_session(args) {
      const { sessionToken } = validateTokenOnly(args);
      const session = codec.decode(sessionToken);
      const inspected = session.plannedAt ? await inspectStage(baseRegistry, session) : { stage: draftStage(session) };
      return toolResult({ ok: true, sessionToken: codec.encode(session), session: sessionView(session, inspected.stage) }, `The guided session is at ${inspected.stage}.`);
    },
    async plan_check_in_session(args) {
      const { sessionToken } = validateTokenOnly(args);
      const session = codec.decode(sessionToken);
      const proposal = completeProposal(session);
      const plan = await baseRegistry.call('plan_check_in', proposal);
      if (plan.isError) return plan;
      const next = codec.touch(session, { plannedAt: codec.now() });
      const inspected = await inspectStage(baseRegistry, next);
      return toolResult({
        ok: true,
        sessionToken: codec.encode(next),
        session: sessionView(next, inspected.stage),
        plan: plan.structuredContent,
      }, `The guided check-in is valid and ready for ${inspected.stage}.`);
    },
    async advance_check_in_session(args) {
      const input = validateAdvanceInput(args);
      const session = codec.decode(input.sessionToken);
      if (!session.plannedAt) throw new InputError('Plan the check-in session before advancing publication.', 'sessionToken');
      const inspected = await inspectStage(baseRegistry, session);
      const { proposal, stage, status } = inspected;
      let result;
      let tool = null;
      let nextStage = stage;

      if (stage === 'published') {
        return toolResult({
          ok: true,
          sessionToken: codec.encode(session),
          session: sessionView(session, stage),
          action: null,
        }, 'The draft pull request already exists. No repository mutation was performed.');
      }
      if (stage === 'awaiting_branch') {
        tool = 'reserve_check_in';
        result = await baseRegistry.call(tool, { entryId: proposal.entryId, branch: proposal.branch, approved: true });
        nextStage = proposal.artwork === 'card' ? 'awaiting_artwork_import' : 'awaiting_entry_save';
      } else if (stage === 'awaiting_artwork_import') {
        if (status?.importer && IMPORT_PENDING.has(status.importer.status)) {
          return toolResult({
            ok: true,
            sessionToken: codec.encode(session),
            session: sessionView(session, stage),
            action: null,
          }, 'The artwork importer is still running. No duplicate workflow was dispatched.');
        }
        if (!session.artworkSource) throw new InputError('The session has no attached artwork source.', 'sessionToken');
        tool = 'import_check_in_artwork';
        result = await baseRegistry.call(tool, {
          entryId: proposal.entryId,
          branch: proposal.branch,
          ...session.artworkSource,
          approved: true,
        });
        nextStage = 'awaiting_artwork_import';
      } else if (stage === 'awaiting_entry_save') {
        tool = 'save_check_in';
        result = await baseRegistry.call(tool, { proposal, approved: true });
        nextStage = 'awaiting_draft_pr';
      } else if (stage === 'awaiting_draft_pr') {
        tool = 'open_check_in_pr';
        result = await baseRegistry.call(tool, {
          proposal,
          importerRunUrl: status?.importer?.url || undefined,
          approved: true,
        });
        nextStage = 'published';
      } else {
        throw new InputError(`Session stage ${stage} cannot be advanced.`, 'sessionToken');
      }

      if (result?.isError) return result;
      const statusText = result.structuredContent?.status || 'completed';
      const next = codec.touch(session, {
        lastAction: { tool, status: statusText, at: new Date(codec.now()).toISOString() },
      });
      return toolResult({
        ok: true,
        sessionToken: codec.encode(next),
        session: sessionView(next, nextStage),
        action: { tool, status: statusText, message: result.content?.[0]?.text || `${tool} completed.` },
      }, `${tool} completed. The next session stage is ${nextStage}.`);
    },
  };

  return {
    tools,
    profile: baseRegistry.profile,
    allowMerge: baseRegistry.allowMerge,
    async call(name, args) {
      if (!sessionNames.has(name)) return baseRegistry.call(name, args);
      try {
        return await handlers[name](args ?? {});
      } catch (error) {
        return toolError(error);
      }
    },
  };
}
