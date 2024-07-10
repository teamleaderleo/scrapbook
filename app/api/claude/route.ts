import { NextRequest, NextResponse } from 'next/server';
import Client from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  console.log('Claude API route hit');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set');
    return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
  }

  const client = new Client({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const { prompt } = await request.json();
    console.log('Received prompt:', prompt);

    // Format the prompt according to Claude's requirements
    const formattedPrompt = `\n\nHuman: ${prompt}\n\nAssistant:`;

    const response = await client.completions.create({
      model: "claude-2",
      prompt: formattedPrompt,
      max_tokens_to_sample: 300,
    });

    return NextResponse.json({ result: response.completion });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return NextResponse.json({ 
      error: 'Failed to get response from Claude',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}