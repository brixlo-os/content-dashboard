import { supabaseAdmin } from './supabase-admin'

const BASE = 'https://www.googleapis.com/youtube/v3'
const API_KEY = process.env.YOUTUBE_API_KEY
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID

export async function syncYouTube() {
  if (!API_KEY || !CHANNEL_ID) {
    return { synced: 0, skipped: true, reason: 'YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID not set' }
  }

  const searchRes = await fetch(
    `${BASE}/search?part=snippet&channelId=${CHANNEL_ID}&type=video&maxResults=25&order=date&key=${API_KEY}`
  )
  if (!searchRes.ok) throw new Error(`YouTube search error ${searchRes.status}: ${await searchRes.text()}`)
  const searchData = await searchRes.json()

  const items = searchData.items || []
  if (items.length === 0) return { synced: 0 }

  const videoIds = items.map((v: { id: { videoId: string } }) => v.id.videoId).join(',')

  const statsRes = await fetch(
    `${BASE}/videos?part=statistics,contentDetails&id=${videoIds}&key=${API_KEY}`
  )
  if (!statsRes.ok) throw new Error(`YouTube stats error ${statsRes.status}`)
  const statsData = await statsRes.json()

  const statsMap: Record<string, { stats: Record<string, string>; duration: string }> = {}
  for (const item of statsData.items || []) {
    statsMap[item.id] = { stats: item.statistics, duration: item.contentDetails?.duration || '' }
  }

  const records = []
  for (const item of items) {
    const videoId = item.id.videoId
    const snippet = item.snippet
    const s = statsMap[videoId]?.stats || {}
    const views = parseInt(s.viewCount || '0')
    const likes = parseInt(s.likeCount || '0')
    const comments = parseInt(s.commentCount || '0')
    const engagement_rate = views > 0 ? ((likes + comments) / views) * 100 : 0

    records.push({
      platform: 'youtube',
      post_id: videoId,
      title: snippet.title || null,
      thumbnail_url: snippet.thumbnails?.medium?.url || null,
      published_at: snippet.publishedAt,
      views,
      likes,
      comments,
      shares: 0,
      saves: 0,
      reach: views,
      watch_time_minutes: 0,
      engagement_rate: Math.round(engagement_rate * 100) / 100,
      synced_at: new Date().toISOString(),
    })
  }

  if (records.length === 0) return { synced: 0 }

  const { error } = await supabaseAdmin
    .from('content_analytics')
    .upsert(records, { onConflict: 'post_id' })

  if (error) throw new Error(`Supabase upsert error: ${error.message}`)
  return { synced: records.length }
}
