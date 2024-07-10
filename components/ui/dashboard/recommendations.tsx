import React, { useState } from 'react';
import { getRecommendations } from '@/app/lib/claude-utils';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface RecommendationsProps {
  projectId?: string;
  artifactId?: string;
  tags?: string[];
}

export function Recommendations({ projectId, artifactId, tags }: RecommendationsProps) {
  const [includeProjects, setIncludeProjects] = useState(true);
  const [includeArtifacts, setIncludeArtifacts] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [recommendations, setRecommendations] = useState<{projects: string[], artifacts: string[], tags: string[]}>({projects: [], artifacts: [], tags: []});
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const result = await getRecommendations({
        projectId,
        artifactId,
        tags,
        includeProjects,
        includeArtifacts,
        includeTags
      });
      setRecommendations(result);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Get Recommendations</h2>
      <div className="flex space-x-4 mb-4">
        <label className="flex items-center">
          <Switch
            checked={includeProjects}
            onCheckedChange={setIncludeProjects}
          />
          <span className="ml-2">Projects</span>
        </label>
        <label className="flex items-center">
          <Switch
            checked={includeArtifacts}
            onCheckedChange={setIncludeArtifacts}
          />
          <span className="ml-2">Artifacts</span>
        </label>
        <label className="flex items-center">
          <Switch
            checked={includeTags}
            onCheckedChange={setIncludeTags}
          />
          <span className="ml-2">Tags</span>
        </label>
      </div>
      <Button onClick={fetchRecommendations} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Get Recommendations'}
      </Button>
      {recommendations.projects.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold">Recommended Projects</h3>
          <ul className="list-disc pl-5">
            {recommendations.projects.map((project, index) => (
              <li key={index}>{project}</li>
            ))}
          </ul>
        </div>
      )}
      {recommendations.artifacts.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold">Recommended Artifacts</h3>
          <ul className="list-disc pl-5">
            {recommendations.artifacts.map((artifact, index) => (
              <li key={index}>{artifact}</li>
            ))}
          </ul>
        </div>
      )}
      {recommendations.tags.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold">Recommended Tags</h3>
          <div className="flex flex-wrap gap-2">
            {recommendations.tags.map((tag, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}