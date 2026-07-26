import { InputError, validateProposal } from './contracts.mjs';
import {
  createSessionCodec,
  createSessionToolRegistry as createInnerSessionToolRegistry,
} from './sessions.mjs';

const TEXT_FIELDS = ['entryId', 'name', 'mark', 'note', 'date', 'mode'];

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
  const message = error instanceof Error ? error.message : 'Unexpected orchestration failure.';
  return {
    isError: true,
    structuredContent: { ok: false, error: message },
    content: [{ type: 'text', text: message }],
  };
}

function requireObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InputError('arguments must be an object.', 'arguments');
  }
  return value;
}

function validateReserveInput(value) {
  const input = requireObject(value);
  for (const key of Object.keys(input)) {
    if (!['sessionToken', 'approved'].includes(key)) throw new InputError(`Unknown arguments field: ${key}`, key);
  }
  if (typeof input.sessionToken !== 'string' || input.sessionToken.length < 32 || input.sessionToken.length > 12_000) {
    throw new InputError('sessionToken is invalid.', 'sessionToken');
  }
  if (input.approved !== true) throw new InputError('approved must be true for this write.', 'approved');
  return { sessionToken: input.sessionToken, approved: true };
}

function hasText(session) {
  return TEXT_FIELDS.every((field) => Boolean(session.draft?.[field]));
}

function provisionalProposal(session) {
  const draft = { ...session.draft, artwork: 'none' };
  delete draft.imageAlt;
  return validateProposal(draft);
}

function reservationNext(full, branchExists) {
  if (branchExists) {
    return {
      tools: ['attach_check_in_artwork_source', 'skip_check_in_artwork'],
      reason: 'The final entry identity and branch are reserved. Create the artwork in its own turn, then attach its source, or deliberately continue text-only.',
      requiresApproval: false,
    };
  }
  if (full) {
    return {
      tools: ['reserve_check_in_identity'],
      reason: 'Reserve the final entry ID and fixed branch before generating artwork.',
      requiresApproval: true,
    };
  }
  return {
    tools: ['get_check_in_session'],
    reason: 'Connect the full write-capable profile, using the same session signing secret, to reserve the final identity before generating artwork.',
    requiresApproval: false,
  };
}

function overrideSession(result, { stage, next, missing = [] }) {
  if (result?.isError || !result?.structuredContent?.session) return result;
  return {
    ...result,
    structuredContent: {
      ...result.structuredContent,
      session: {
        ...result.structuredContent.session,
        stage,
        missing,
        next,
      },
    },
  };
}

async function readStatus(baseRegistry, session) {
  if (!hasText(session)) return null;
  const result = await baseRegistry.call('get_check_in_status', {
    entryId: session.draft.entryId,
    branch: session.draft.branch,
  });
  if (result?.isError) throw new InputError(result.content?.[0]?.text || 'Could not inspect the reserved check-in identity.', 'sessionToken');
  return result.structuredContent;
}

function reserveDescriptor(innerRegistry) {
  const advance = innerRegistry.tools.find((tool) => tool.name === 'advance_check_in_session');
  const granular = innerRegistry.tools.find((tool) => tool.name === 'reserve_check_in');
  if (!advance || !granular) throw new Error('Full guided registry is missing reservation dependencies.');
  const securitySchemes = granular.securitySchemes;
  return {
    name: 'reserve_check_in_identity',
    title: 'Reserve the guided check-in identity',
    description: 'After explicit approval, validates the final entry ID and provenance against current main, then reserves only agent-check-in/<entry-id>. Use this before the dedicated artwork-generation turn. It does not import artwork, save the entry, open a pull request, mark ready, or merge.',
    inputSchema: object({
      sessionToken: advance.inputSchema.properties.sessionToken,
      approved: { type: 'boolean', const: true },
    }, ['sessionToken', 'approved']),
    outputSchema: advance.outputSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: true,
      idempotentHint: true,
    },
    securitySchemes,
    _meta: {
      securitySchemes,
      'openai/toolInvocation/invoking': 'Reserving the check-in identity',
      'openai/toolInvocation/invoked': 'Check-in identity reserved',
    },
  };
}

export function createSessionToolRegistry(baseRegistry, {
  sessionSecret = 'development-only-scrapbook-session-signing-secret',
  now,
  randomId,
} = {}) {
  const codec = createSessionCodec(sessionSecret, {
    ...(now ? { now } : {}),
    ...(randomId ? { randomId } : {}),
  });
  const inner = createInnerSessionToolRegistry(baseRegistry, { sessionSecret, now, randomId });
  const full = baseRegistry.profile === 'full';
  const reserve = full ? reserveDescriptor(inner) : null;
  const tools = inner.tools.flatMap((tool) => {
    if (tool.name === 'get_check_in_capabilities') {
      const flow = tool.outputSchema.properties.sessionFlow;
      return [{
        ...tool,
        outputSchema: {
          ...tool.outputSchema,
          properties: {
            ...tool.outputSchema.properties,
            sessionFlow: {
              ...flow,
              properties: {
                ...flow.properties,
                identityReservation: { const: 'before-artwork-generation' },
              },
              required: [...flow.required, 'identityReservation'],
            },
          },
        },
      }];
    }
    if (reserve && tool.name === 'advance_check_in_session') return [reserve, tool];
    return [tool];
  });

  return {
    tools,
    profile: inner.profile,
    allowMerge: inner.allowMerge,
    async call(name, args) {
      try {
        if (name === 'get_check_in_capabilities') {
          const result = await inner.call(name, args);
          if (result?.isError) return result;
          const sequence = [
            'start_check_in_session',
            'submit_check_in_text',
            ...(full
              ? ['reserve_check_in_identity after explicit approval']
              : ['connect a full profile to reserve the identity']),
            'create artwork in a separate turn',
            'attach_check_in_artwork_source or skip_check_in_artwork',
            'plan_check_in_session',
            ...(full ? ['advance_check_in_session until a draft PR exists'] : ['connect a full profile before publication']),
          ];
          return {
            ...result,
            structuredContent: {
              ...result.structuredContent,
              sessionFlow: {
                ...result.structuredContent.sessionFlow,
                sequence,
                identityReservation: 'before-artwork-generation',
              },
            },
          };
        }

        if (name === 'submit_check_in_text') {
          const result = await inner.call(name, args);
          if (result?.isError) return result;
          const session = codec.decode(result.structuredContent.sessionToken);
          const status = await readStatus(baseRegistry, session);
          const branchExists = Boolean(status?.branch?.exists);
          return overrideSession(result, {
            stage: branchExists ? 'awaiting_artwork' : 'awaiting_branch',
            next: reservationNext(full, branchExists),
          });
        }

        if (name === 'get_check_in_session') {
          const result = await inner.call(name, args);
          if (result?.isError) return result;
          const session = codec.decode(result.structuredContent.sessionToken);
          if (hasText(session) && !session.draft.artwork) {
            const status = await readStatus(baseRegistry, session);
            const branchExists = Boolean(status?.branch?.exists);
            return overrideSession(result, {
              stage: branchExists ? 'awaiting_artwork' : 'awaiting_branch',
              next: reservationNext(full, branchExists),
            });
          }
          return result;
        }

        if (name === 'reserve_check_in_identity') {
          if (!full) throw new InputError('reserve_check_in_identity is unavailable in the read-only profile.', 'tool');
          const input = validateReserveInput(args);
          const session = codec.decode(input.sessionToken);
          if (!hasText(session)) throw new InputError('Submit the final entry identity and text before reserving its branch.', 'sessionToken');
          const proposal = provisionalProposal(session);
          const plan = await baseRegistry.call('plan_check_in', proposal);
          if (plan?.isError) return plan;
          const reserved = await baseRegistry.call('reserve_check_in', {
            entryId: proposal.entryId,
            branch: proposal.branch,
            approved: true,
          });
          if (reserved?.isError) return reserved;
          const nextSession = codec.touch(session, {
            identityReservedAt: session.identityReservedAt || codec.now(),
            lastAction: {
              tool: 'reserve_check_in',
              status: reserved.structuredContent?.status || 'reserved',
              at: new Date(codec.now()).toISOString(),
            },
          });
          const sessionToken = codec.encode(nextSession);
          const restored = await inner.call('get_check_in_session', { sessionToken });
          const guided = overrideSession(restored, {
            stage: 'awaiting_artwork',
            next: reservationNext(true, true),
          });
          return toolResult({
            ok: true,
            sessionToken,
            session: guided.structuredContent.session,
            action: {
              tool: 'reserve_check_in',
              status: reserved.structuredContent?.status || 'reserved',
              message: reserved.content?.[0]?.text || 'The check-in identity is reserved.',
            },
          }, 'The final entry identity and fixed branch are reserved. Create the artwork in its own turn, then attach its source or continue text-only.');
        }

        if (name === 'attach_check_in_artwork_source' || name === 'skip_check_in_artwork') {
          const input = requireObject(args);
          const session = codec.decode(input.sessionToken);
          const status = await readStatus(baseRegistry, session);
          if (!status?.branch?.exists) {
            throw new InputError('Reserve the final check-in identity and branch before choosing or attaching artwork.', 'sessionToken');
          }
          return inner.call(name, args);
        }

        if (name === 'plan_check_in_session') {
          const input = requireObject(args);
          const session = codec.decode(input.sessionToken);
          const status = await readStatus(baseRegistry, session);
          if (!status?.branch?.exists) {
            throw new InputError('Reserve the final check-in identity and branch before validating the finished proposal.', 'sessionToken');
          }
          return inner.call(name, args);
        }

        if (name === 'advance_check_in_session') {
          const input = requireObject(args);
          const session = codec.decode(input.sessionToken);
          if (!session.draft.artwork) {
            throw new InputError('Finish the dedicated artwork turn, attach its source or choose text-only, then validate the session before publication.', 'sessionToken');
          }
          return inner.call(name, args);
        }

        return inner.call(name, args);
      } catch (error) {
        return toolError(error);
      }
    },
  };
}
