import { cache } from 'react'
import { fetchAllArtifacts } from './artifact-data'
import { ADMIN_UUID } from './constants'

export const getCachedArtifacts = cache(async () => {
  const { artifacts } = await fetchAllArtifacts(ADMIN_UUID, true)
  return artifacts
})