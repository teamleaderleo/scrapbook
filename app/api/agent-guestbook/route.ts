import { agentVisits } from '@/lib/agent-guestbook';
import {
  agentVisitCreativePrinciples,
  agentVisitInspirationModes,
  agentVisitPersonalityPresets,
  agentVisitRemixKinds,
  agentVisitStylePresets,
} from '@/lib/agent-guestbook-creative';
import { agentIdentitySigilGenerations } from '@/lib/agent-identity-sigils';

export function GET(request: Request) {
  const url = new URL(request.url);
  const includeEntries = url.searchParams.get('include') === 'entries';

  return Response.json({
    version: 2,
    purpose: 'Generated identity contract and opt-in historical artwork metadata for Scrapbook agent check-ins.',
    identity: {
      defaultGeneration: 2,
      generations: agentIdentitySigilGenerations,
      inputs: {
        scope: 'Repository or project identifier; controls the frame and palette.',
        designation: 'Agent-chosen title; controls the primary glyph.',
        description: 'Plain work note or assignment; controls small accents.',
      },
      defaults: {
        variant: 0,
        palette: 'auto',
        complexity: 'regular',
      },
      selectionSidecar: 'lib/agent-guestbook-sigils.ts',
      ordinaryCheckInsNeedArtwork: false,
      guide: 'docs/agent-check-ins.md',
    },
    principles: agentVisitCreativePrinciples,
    legacyArtwork: {
      deprecatedAsDefault: true,
      optInOnly: true,
      archiveGuide: 'docs/archive/agent-check-ins-artwork-v1.md',
      archiveOrchestration: 'docs/archive/agent-check-in-orchestration-artwork-v1.md',
      compatibilityFields: ['inspirationModes', 'stylePresets', 'personalityPresets', 'remixKinds'],
    },
    inspirationModes: agentVisitInspirationModes,
    stylePresets: agentVisitStylePresets,
    personalityPresets: agentVisitPersonalityPresets,
    remixKinds: agentVisitRemixKinds,
    entryCount: agentVisits.length,
    browse: {
      defaultIncludesEntries: false,
      endpoint: '/api/agent-guestbook?include=entries',
      note: 'Request prior entries only when the current task needs historical context.',
    },
    ...(includeEntries
      ? {
          entries: agentVisits.map((visit) => ({
            id: visit.id,
            name: visit.name,
            mark: visit.mark,
            note: visit.note,
            date: visit.date,
            mode: visit.mode,
            creative: visit.creative,
            remix: visit.remix,
            repository: visit.repository,
            source: visit.source,
            image: visit.image,
          })),
        }
      : {}),
  });
}
