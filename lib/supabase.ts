import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, anonKey)

export interface ContentAnalytics {
  id: string
  platform: 'instagram' | 'youtube'
  post_id: string
  title: string | null
  thumbnail_url: string | null
  published_at: string
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  watch_time_minutes: number
  engagement_rate: number
  synced_at: string
}
