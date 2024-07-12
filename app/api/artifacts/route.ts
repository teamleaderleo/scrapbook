import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/db';
import { artifactsView } from '@/app/lib/db/schema';

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    const artifacts = await db.select().from(artifactsView);
    return NextResponse.json(artifacts);
  } catch (error) {
    console.error('Failed to fetch artifacts:', error);
    return NextResponse.json({ error: 'Failed to fetch artifacts' }, { status: 500 });
  }
}