import mitt from 'mitt';
import { ArtifactWithRelations } from '@/app/lib/definitions';

export const ARTIFACTS_UPDATED = 'artifactsUpdated';
export const FILTERED_ARTIFACTS_UPDATED = 'filteredArtifactsUpdated';

type Events = {
  [ARTIFACTS_UPDATED]: ArtifactWithRelations[];
  [FILTERED_ARTIFACTS_UPDATED]: ArtifactWithRelations[];
};

export const eventBus = mitt<Events>();