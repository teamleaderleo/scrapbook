import { NextResponse } from 'next/server';
import Client from '@anthropic-ai/sdk';

const client = new Client({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(request: Request) {
  const { prompt } = await request.json();

  try {
    const response = await client.completions.create({
      model: "claude-2",
      prompt: prompt,
      max_tokens_to_sample: 300,
    });

    return NextResponse.json({ result: response.completion });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return NextResponse.json({ error: 'Failed to get response from Claude' }, { status: 500 });
  }
}