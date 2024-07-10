export async function getClaudeResponse(prompt: string): Promise<string> {
  console.log('Sending request to Claude API');
  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    console.log('Received response:', response.status, response.statusText);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Parsed response data:', data);

    if (!data.result) {
      console.error('Unexpected response structure:', data);
      throw new Error('No result in Claude response');
    }

    return data.result;
  } catch (error) {
    console.error('Error in getClaudeResponse:', error);
    throw new Error('Failed to get response from Claude');
  }
}

export async function suggestTags(content: string): Promise<string[]> {
  const prompt = content.trim() ?
    `Analyze the following content and suggest up to 5 relevant tags:

    ${content}

    Respond with only a comma-separated list of tags.` :
    `Suggest 5 interesting and diverse tags that could be used to categorize various artifacts in a knowledge management system. Be creative and think broadly. Respond with only a comma-separated list of tags.`;

  try {
    const result = await getClaudeResponse(prompt);
    return result.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
  } catch (error) {
    console.error('Error in suggestTags:', error);
    return [];
  }
}

export async function suggestContentExtensions(content: string): Promise<string[]> {
  const prompt = content.trim() ?
    `Given the following content, suggest 3 ways to extend or improve it:

    ${content}

    Respond with only a comma-separated list of extension ideas.` :
    `Suggest 3 creative ideas for content that could be added to an artifact in a knowledge management system. Think broadly and innovatively. Respond with only a comma-separated list of content ideas.`;

  try {
    const result = await getClaudeResponse(prompt);
    return result.split(',').map(idea => idea.trim()).filter(idea => idea !== '');
  } catch (error) {
    console.error('Error in suggestContentExtensions:', error);
    return [];
  }
}

export async function suggestArtifactName(content: string): Promise<string> {
  const prompt = `Based on the following content, suggest a concise and descriptive name for an artifact:

  ${content}

  Respond with only the suggested name.`;

  try {
    return await getClaudeResponse(prompt);
  } catch (error) {
    console.error('Error in suggestArtifactName:', error);
    return '';
  }
}

export async function summarizeContent(content: string): Promise<string> {
  const prompt = `Summarize the following content in a brief paragraph:

  ${content}

  Provide only the summary.`;

  try {
    return await getClaudeResponse(prompt);
  } catch (error) {
    console.error('Error in summarizeContent:', error);
    return '';
  }
}

export async function suggestRelatedTopics(content: string): Promise<string[]> {
  const prompt = `Based on the following content, suggest 5 related topics or areas for further exploration:

  ${content}

  Respond with only a comma-separated list of topics.`;

  try {
    const result = await getClaudeResponse(prompt);
    return result.split(',').map(topic => topic.trim()).filter(topic => topic !== '');
  } catch (error) {
    console.error('Error in suggestRelatedTopics:', error);
    return [];
  }
}

export async function generateArtifactIdeas(context: string): Promise<string[]> {
  const prompt = `Given the following context, suggest 3 ideas for new artifacts that could be created:

  ${context}

  Respond with only a comma-separated list of artifact ideas.`;

  try {
    const result = await getClaudeResponse(prompt);
    return result.split(',').map(idea => idea.trim()).filter(idea => idea !== '');
  } catch (error) {
    console.error('Error in generateArtifactIdeas:', error);
    return [];
  }
}