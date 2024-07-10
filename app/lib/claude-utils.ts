import { Artifact } from "./definitions";

export async function getClaudeResponse(prompt: string): Promise<string> {
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to get response from Claude');
  }

  const data = await response.json();
  return data.result;
}

export async function suggestTags(content: string): Promise<string[]> {
  const prompt = `Analyze the following content and suggest up to 5 relevant tags:

${content}

Respond with only a comma-separated list of tags.`;

  const result = await getClaudeResponse(prompt);
  return result.split(',').map(tag => tag.trim());
}

export async function getRecommendations(options: {
  projectId?: string;
  artifactId?: string;
  tags?: string[];
  includeProjects: boolean;
  includeArtifacts: boolean;
  includeTags: boolean;
}): Promise<{projects: string[], artifacts: string[], tags: string[]}> {
  const { projectId, artifactId, tags, includeProjects, includeArtifacts, includeTags } = options;
  
  let prompt = `Based on the following information, provide recommendations:\n`;
  if (projectId) prompt += `Project ID: ${projectId}\n`;
  if (artifactId) prompt += `Artifact ID: ${artifactId}\n`;
  if (tags && tags.length > 0) prompt += `Tags: ${tags.join(', ')}\n`;
  
  prompt += `Please provide:`;
  if (includeProjects) prompt += `\n- Up to 3 related project names`;
  if (includeArtifacts) prompt += `\n- Up to 3 related artifact names`;
  if (includeTags) prompt += `\n- Up to 5 related tags`;
  
  prompt += `\n\nRespond in the following format:
Projects: project1, project2, project3
Artifacts: artifact1, artifact2, artifact3
Tags: tag1, tag2, tag3, tag4, tag5`;

  const result = await getClaudeResponse(prompt);
  const lines = result.split('\n');
  
  return {
    projects: includeProjects ? lines.find(l => l.startsWith('Projects:'))?.split(':')[1].split(',').map(s => s.trim()) || [] : [],
    artifacts: includeArtifacts ? lines.find(l => l.startsWith('Artifacts:'))?.split(':')[1].split(',').map(s => s.trim()) || [] : [],
    tags: includeTags ? lines.find(l => l.startsWith('Tags:'))?.split(':')[1].split(',').map(s => s.trim()) || [] : [],
  };
}

