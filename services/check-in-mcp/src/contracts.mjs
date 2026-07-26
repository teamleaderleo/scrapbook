const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const DRIVE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const BRANCH_PREFIX = 'agent-check-in/';
const MODES = new Set(['quiet', 'goofy', 'serious', 'overdone']);

export class InputError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'InputError';
    this.field = field;
  }
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

function boundedText(value, field, { min = 1, max, singleLine = true } = {}) {
  if (typeof value !== 'string') throw new InputError(`${field} must be a string.`, field);
  if (singleLine && /[\r\n\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) {
    throw new InputError(`${field} must be a single printable line.`, field);
  }
  const trimmed = value.trim();
  if (trimmed.length < min || (max && trimmed.length > max)) {
    throw new InputError(`${field} must contain ${min}–${max} characters.`, field);
  }
  return trimmed;
}

function optionalText(value, field, options) {
  if (value === undefined) return undefined;
  return boundedText(value, field, options);
}

export function checkInBranch(entryId) {
  return `${BRANCH_PREFIX}${entryId}`;
}

export function validateEntryId(value) {
  const entryId = boundedText(value, 'entryId', { max: 96 });
  if (!ID_PATTERN.test(entryId)) {
    throw new InputError('entryId must be a lowercase kebab-case slug.', 'entryId');
  }
  return entryId;
}

export function validateBranch(value, entryId) {
  const branch = boundedText(value, 'branch', { max: 160 });
  const expected = checkInBranch(entryId);
  if (branch !== expected) {
    throw new InputError(`branch must equal ${expected}.`, 'branch');
  }
  return branch;
}

export function validateRepository(value) {
  const repository = boundedText(value, 'repository', { max: 128 });
  if (!REPOSITORY_PATTERN.test(repository)) {
    throw new InputError('repository must use owner/repo form.', 'repository');
  }
  return repository;
}

export function validateUtcDate(value) {
  const date = boundedText(value, 'date', { max: 10 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new InputError('date must use YYYY-MM-DD form.', 'date');
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new InputError('date must be a real UTC calendar date.', 'date');
  }
  return date;
}

function parseHttpsUrl(value, field) {
  const text = boundedText(value, field, { max: 512 });
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new InputError(`${field} must be an absolute HTTPS URL.`, field);
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new InputError(`${field} must be an HTTPS URL without credentials.`, field);
  }
  return url;
}

export function validateGitHubSource(value, repository) {
  const url = parseHttpsUrl(value, 'sourceHref');
  const parts = url.pathname.split('/').filter(Boolean);
  if (url.hostname !== 'github.com' || parts.length < 2) {
    throw new InputError('sourceHref must be an inspectable github.com URL.', 'sourceHref');
  }
  const sourceRepository = `${parts[0]}/${parts[1]}`;
  if (sourceRepository.toLowerCase() !== repository.toLowerCase()) {
    throw new InputError('sourceHref must point to the originating repository.', 'sourceHref');
  }
  return url.toString();
}

export function validateConversationHref(value) {
  if (value === undefined) return undefined;
  const url = parseHttpsUrl(value, 'conversationHref');
  if (url.hostname !== 'chatgpt.com' || !/^\/share\/[A-Za-z0-9-]+\/?$/.test(url.pathname)) {
    throw new InputError('conversationHref must be a canonical public ChatGPT shared link.', 'conversationHref');
  }
  return url.toString();
}

export function validateArtworkSource(sourceType, value) {
  if (sourceType === 'drive') {
    const source = boundedText(value, 'source', { max: 256 });
    if (!DRIVE_ID_PATTERN.test(source)) {
      throw new InputError('Drive artwork source must be a file ID.', 'source');
    }
    return source;
  }
  if (sourceType === 'github-attachment') {
    const url = parseHttpsUrl(value, 'source');
    const allowed =
      (url.hostname === 'github.com' && url.pathname.startsWith('/user-attachments/assets/')) ||
      url.hostname === 'user-images.githubusercontent.com' ||
      url.hostname === 'private-user-images.githubusercontent.com';
    if (!allowed) {
      throw new InputError('GitHub artwork source must be a supported user-attachment URL.', 'source');
    }
    return url.toString();
  }
  throw new InputError('sourceType must be drive or github-attachment.', 'sourceType');
}

export function requireApproval(value, field = 'approved') {
  if (value !== true) throw new InputError(`${field} must be true for this write.`, field);
  return true;
}

export function validateProposal(value) {
  const input = requireObject(value);
  rejectUnknownKeys(
    input,
    new Set([
      'entryId', 'name', 'mark', 'note', 'date', 'mode', 'repository', 'model',
      'sourceLabel', 'sourceHref', 'conversationLabel', 'conversationHref',
      'artwork', 'imageAlt', 'branch',
    ]),
  );

  const entryId = validateEntryId(input.entryId);
  const repository = validateRepository(input.repository);
  const branch = input.branch === undefined ? checkInBranch(entryId) : validateBranch(input.branch, entryId);
  const mode = boundedText(input.mode, 'mode', { max: 16 });
  if (!MODES.has(mode)) throw new InputError('mode must be quiet, goofy, serious, or overdone.', 'mode');

  const artwork = input.artwork === undefined ? 'none' : boundedText(input.artwork, 'artwork', { max: 16 });
  if (!['none', 'card'].includes(artwork)) {
    throw new InputError('artwork must be none or card in phase 1.', 'artwork');
  }

  const conversationHref = validateConversationHref(input.conversationHref);
  const conversationLabel = optionalText(input.conversationLabel, 'conversationLabel', { max: 32 });
  if ((conversationHref && !conversationLabel) || (conversationLabel && !conversationHref)) {
    throw new InputError('conversationLabel and conversationHref must be supplied together.', 'conversationHref');
  }

  const imageAlt = optionalText(input.imageAlt, 'imageAlt', { max: 240 });
  if ((artwork === 'card' && !imageAlt) || (artwork === 'none' && imageAlt)) {
    throw new InputError('imageAlt is required exactly when artwork is card.', 'imageAlt');
  }

  return {
    entryId,
    branch,
    name: boundedText(input.name, 'name', { max: 64 }),
    mark: boundedText(input.mark, 'mark', { max: 16 }),
    note: boundedText(input.note, 'note', { max: 240 }),
    date: validateUtcDate(input.date),
    mode,
    repository,
    model: optionalText(input.model, 'model', { max: 80 }),
    sourceLabel: boundedText(input.sourceLabel, 'sourceLabel', { max: 64 }),
    sourceHref: validateGitHubSource(input.sourceHref, repository),
    conversationLabel,
    conversationHref,
    artwork,
    imageAlt,
  };
}

export function validateReservation(value) {
  const input = requireObject(value);
  rejectUnknownKeys(input, new Set(['entryId', 'branch', 'approved']));
  const entryId = validateEntryId(input.entryId);
  return { entryId, branch: validateBranch(input.branch, entryId), approved: requireApproval(input.approved) };
}

export function validateImport(value) {
  const input = requireObject(value);
  rejectUnknownKeys(input, new Set(['entryId', 'branch', 'sourceType', 'source', 'approved']));
  const entryId = validateEntryId(input.entryId);
  const sourceType = boundedText(input.sourceType, 'sourceType', { max: 32 });
  return {
    entryId,
    branch: validateBranch(input.branch, entryId),
    sourceType,
    source: validateArtworkSource(sourceType, input.source),
    approved: requireApproval(input.approved),
  };
}

export function validateStatus(value) {
  const input = requireObject(value);
  rejectUnknownKeys(input, new Set(['entryId', 'branch']));
  const entryId = validateEntryId(input.entryId);
  return { entryId, branch: validateBranch(input.branch, entryId) };
}

export function validateSave(value) {
  const input = requireObject(value);
  rejectUnknownKeys(input, new Set(['proposal', 'approved']));
  return { proposal: validateProposal(input.proposal), approved: requireApproval(input.approved) };
}

export function validateOpenPr(value) {
  const input = requireObject(value);
  rejectUnknownKeys(input, new Set(['proposal', 'importerRunUrl', 'approved']));
  const importerRunUrl = input.importerRunUrl === undefined
    ? undefined
    : parseHttpsUrl(input.importerRunUrl, 'importerRunUrl').toString();
  if (importerRunUrl && !/^https:\/\/github\.com\/teamleaderleo\/scrapbook\/actions\/runs\/\d+\/?$/.test(importerRunUrl)) {
    throw new InputError('importerRunUrl must be a Scrapbook GitHub Actions run URL.', 'importerRunUrl');
  }
  return {
    proposal: validateProposal(input.proposal),
    importerRunUrl,
    approved: requireApproval(input.approved),
  };
}

export function validateFinalise(value) {
  const input = requireObject(value);
  rejectUnknownKeys(input, new Set(['prNumber', 'action', 'confirmation', 'approved']));
  if (!Number.isInteger(input.prNumber) || input.prNumber < 1) {
    throw new InputError('prNumber must be a positive integer.', 'prNumber');
  }
  const action = boundedText(input.action, 'action', { max: 16 });
  if (!['mark-ready', 'merge'].includes(action)) {
    throw new InputError('action must be mark-ready or merge.', 'action');
  }
  const expected = action === 'merge' ? `merge PR #${input.prNumber}` : `mark PR #${input.prNumber} ready`;
  if (input.confirmation !== expected) {
    throw new InputError(`confirmation must equal: ${expected}`, 'confirmation');
  }
  return { prNumber: input.prNumber, action, confirmation: expected, approved: requireApproval(input.approved) };
}
