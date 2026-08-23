import {
  getScrapletPetCount,
  incrementScrapletPetCount,
} from '@/lib/scraplet-store';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
} as const;

function requestMatchesHost(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost ?? request.headers.get('host');
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const pets = await getScrapletPetCount();
    return NextResponse.json({ pets }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Unable to read Scraplet pet count', error);
    return NextResponse.json(
      { error: 'Scraplet counter unavailable' },
      { status: 503, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  if (!requestMatchesHost(request)) {
    return NextResponse.json(
      { error: 'Cross-origin pet rejected' },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const pets = await incrementScrapletPetCount();
    return NextResponse.json({ pets }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Unable to pet Scraplet globally', error);
    return NextResponse.json(
      { error: 'Scraplet counter unavailable' },
      { status: 503, headers: NO_STORE_HEADERS }
    );
  }
}
