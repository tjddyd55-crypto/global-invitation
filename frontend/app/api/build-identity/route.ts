import { NextResponse } from 'next/server';
import { BUILD_IDENTITY } from '@/src/lib/buildIdentity';

export const dynamic = 'force-dynamic';

/** Deploy verification — must match git SHA after Railway Frontend redeploy. */
export async function GET() {
  return NextResponse.json({
    ...BUILD_IDENTITY,
    service: 'frontend',
  });
}
