import { supabaseAdmin } from './supabase-admin'

const BASE = 'https://graph.facebook.com/v21.0'
const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN!
const IG_USER_ID = process.env.IG_USER_ID!

async function fetchJSON(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Instagram API error ${res.status}: ${await res.text()}`)
  return res.json()
}

async function getMediaInsights(mediaId: string, mediaType: string) {
  const isVideo = ['VIDEO', 'REEL'].includes(mediaType)
  const metrics = isVideo
    ? 'impressions,reach,saved,shares,total_interactions'
    : 'impressions,reach,saved,shares,total_interactions'
  try {
    const data = await fetchJSON(
      `${BASE}/${mediaId}/insights?metric=${metrics}&access_token=${TOKEN}`
    )
    const result: Record<string, number> = {}
    for (const item of data.data || []) {
      result[item.name] = item.values?.[0]?.value ?? item.value ?? 0
    }
    return result
  } catch {
    return {}
  }
}

export async function syncInstagram() {
  const mediaList = await fetchJSON(
    `${BASE}/${IG_USER_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count&limit=25&access_token=${TOKEN}`
  )

  const posts = mediaList.data || []
  const records = []

  for (const post of posts) {
    const insights = await getMediaInsights(post.id, post.media_type)
    const likes = post.like_count || 0
    const comments = post.comments_count || 0
    const saves = insights.saved || 0
    const shares = insights.shares || 0
    const reach = insights.reach || 0
    const views = insights.impressions || 0
    const total = likes + comments + saves + shares
    const engagement_rate = reach > 0 ? (total / reach) * 100 : 0

    records.push({
      platform: 'instagram',
      post_id: post.id,
      title: post.caption?.slice(0, 200) || null,
      thumbnail_url: post.thumbnail_url || post.media_url || null,
      published_at: post.timestamp,
      views,
      likes,
      comments,
      shares,
      saves,
      reach,
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
