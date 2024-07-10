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
  const prompt = `Analyze the following content and suggest up to 5 relevant tags:

${content}

Respond with only a comma-separated list of tags.`;

  try {
    const result = await getClaudeResponse(prompt);
    return result.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
  } catch (error) {
    console.error('Error in suggestTags:', error);
    return [];
  }
}

export async function suggestContentExtensions(content: string): Promise<string[]> {
  const prompt = `Given the following content, suggest 3 ways to extend or improve it:

${content}

Respond with only a comma-separated list of extension ideas.`;

  try {
    const result = await getClaudeResponse(prompt);
    return result.split(',').map(idea => idea.trim()).filter(idea => idea !== '');
  } catch (error) {
    console.error('Error in suggestContentExtensions:', error);
    return [];
  }
}