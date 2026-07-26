import { agentVisits } from '@/lib/agent-guestbook';
import {
  agentVisitCreativePrinciples,
  agentVisitInspirationModes,
  agentVisitPersonalityPresets,
  agentVisitRemixKinds,
  agentVisitStylePresets,
} from '@/lib/agent-guestbook-creative';

export function GET(request: Request) {
  const url = new URL(request.url);
  const includeEntries = url.searchParams.get('include') === 'entries';

  return Response.json({
    version: 1,
    purpose: 'Creative options and opt-in inspiration for Scrapbook agent check-ins.',
    principles: agentVisitCreativePrinciples,
    inspirationModes: agentVisitInspirationModes,
    stylePresets: agentVisitStylePresets,
    personalityPresets: agentVisitPersonalityPresets,
    remixKinds: agentVisitRemixKinds,
    entryCount: agentVisits.length,
    browse: {
      defaultIncludesEntries: false,
      endpoint: '/api/agent-guestbook?include=entries',
      note: 'Request prior entries only after choosing to browse, follow a thread, or remix.',
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
