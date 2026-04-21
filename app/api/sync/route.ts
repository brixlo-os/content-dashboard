import { NextResponse } from 'next/server'
import { syncInstagram } from '@/lib/instagram'
import { syncYouTube } from '@/lib/youtube'

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, unknown> = {}

  try {
    results.instagram = await syncInstagram()
  } catch (e) {
    results.instagram = { error: (e as Error).message }
  }

  try {
    results.youtube = await syncYouTube()
  } catch (e) {
    results.youtube = { error: (e as Error).message }
  }

  return NextResponse.json({ ok: true, results, timestamp: new Date().toISOString() })
}
