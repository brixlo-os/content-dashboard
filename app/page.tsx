'use client'

import { useEffect, useState, useCallback } from 'react'
import { subDays, isAfter, parseISO, format, startOfDay } from 'date-fns'
import { supabase, ContentAnalytics } from '@/lib/supabase'
import KPICard from '@/components/KPICard'
import { ViewsReachChart, EngagementChart } from '@/components/Charts'
import TopPostsGrid from '@/components/TopPostsGrid'

type Platform = 'all' | 'instagram' | 'youtube'
type TimeRange = 7 | 14 | 30 | 90
type SortKey = 'views' | 'likes' | 'shares' | 'engagement_rate'

function sumField(posts: ContentAnalytics[], key: keyof ContentAnalytics) {
  return posts.reduce((acc, p) => acc + (Number(p[key]) || 0), 0)
}

function avgField(posts: ContentAnalytics[], key: keyof ContentAnalytics) {
  if (posts.length === 0) return 0
  return sumField(posts, key) / posts.length
}

function pctChange(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0
  return ((curr - prev) / prev) * 100
}

function toDailyData(posts: ContentAnalytics[], days: number) {
  const byDate: Record<string, { views: number; reach: number; likes: number; comments: number; shares: number; saves: number }> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
    byDate[d] = { views: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
  }
  for (const p of posts) {
    if (!p.published_at) continue
    const d = format(startOfDay(parseISO(p.published_at)), 'yyyy-MM-dd')
    if (byDate[d]) {
      byDate[d].views += p.views
      byDate[d].reach += p.reach
      byDate[d].likes += p.likes
      byDate[d].comments += p.comments
      byDate[d].shares += p.shares
      byDate[d].saves += p.saves
    }
  }
  return Object.entries(byDate).map(([date, v]) => ({ date, ...v }))
}

export default function Dashboard() {
  const [allPosts, setAllPosts] = useState<ContentAnalytics[]>([])
  const [followers, setFollowers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [platform, setPlatform] = useState<Platform>('all')
  const [days, setDays] = useState<TimeRange>(30)
  const [sortBy, setSortBy] = useState<SortKey>('views')

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('content_analytics')
      .select('*')
      .order('published_at', { ascending: false })
    setAllPosts((data as ContentAnalytics[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPosts()
    fetch('/api/followers')
      .then((r) => r.json())
      .then((d) => setFollowers(d.followers ?? 0))
      .catch(() => {})
  }, [fetchPosts])

  const cutoff = subDays(new Date(), days)
  const prevCutoff = subDays(new Date(), days * 2)

  const filtered = allPosts.filter((p) => {
    const matchPlatform = platform === 'all' || p.platform === platform
    const matchTime = p.published_at && isAfter(parseISO(p.published_at), cutoff)
    return matchPlatform && matchTime
  })

  const prevPeriod = allPosts.filter((p) => {
    const matchPlatform = platform === 'all' || p.platform === platform
    const d = p.published_at ? parseISO(p.published_at) : null
    return matchPlatform && d && isAfter(d, prevCutoff) && !isAfter(d, cutoff)
  })

  const kpis = {
    views: sumField(filtered, 'views'),
    reach: sumField(filtered, 'reach'),
    engagement: avgField(filtered, 'engagement_rate'),
    shares: sumField(filtered, 'shares'),
    saves: sumField(filtered, 'saves'),
  }
  const prev = {
    views: sumField(prevPeriod, 'views'),
    reach: sumField(prevPeriod, 'reach'),
    engagement: avgField(prevPeriod, 'engagement_rate'),
    shares: sumField(prevPeriod, 'shares'),
    saves: sumField(prevPeriod, 'saves'),
  }

  const daily = toDailyData(filtered, days)

  async function triggerSync() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'x-cron-secret': 'brixlo-cron-2026' },
      })
      const data = await res.json()
      const ig = data.results?.instagram
      const yt = data.results?.youtube
      const msgs: string[] = []
      if (ig?.synced !== undefined) msgs.push(`Instagram: ${ig.synced} posts synced`)
      if (ig?.error) msgs.push(`Instagram error: ${ig.error}`)
      if (yt?.synced !== undefined && !yt?.skipped) msgs.push(`YouTube: ${yt.synced} videos synced`)
      if (yt?.skipped) msgs.push('YouTube: API key not configured yet')
      if (yt?.error) msgs.push(`YouTube error: ${yt.error}`)
      setSyncMsg(msgs.join(' · ') || 'Synced')
      await fetchPosts()
    } catch (e) {
      setSyncMsg('Sync failed — check console')
      console.error(e)
    }
    setSyncing(false)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Content Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-1">@josh_brixlo</p>
          </div>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {syncing ? 'Syncing...' : '↻ Sync Now'}
          </button>
        </div>

        {syncMsg && (
          <div className="mb-6 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-300">
            {syncMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            {(['all', 'instagram', 'youtube'] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  platform === p ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {p === 'all' ? 'All' : p === 'instagram' ? 'Instagram' : 'YouTube'}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            {([7, 14, 30, 90] as TimeRange[]).map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  days === d ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-zinc-500">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <KPICard
                label="Unique Viewers"
                value={kpis.views}
                change={pctChange(kpis.views, prev.views)}
                sparkData={daily.map((d) => ({ value: d.views }))}
              />
              <KPICard
                label="Reach"
                value={kpis.reach}
                change={pctChange(kpis.reach, prev.reach)}
                sparkData={daily.map((d) => ({ value: d.reach }))}
              />
              <KPICard
                label="Engagement Rate"
                value={kpis.engagement}
                change={pctChange(kpis.engagement, prev.engagement)}
                sparkData={daily.map((_, i) => {
                  const dayPosts = filtered.filter((p) =>
                    p.published_at &&
                    format(startOfDay(parseISO(p.published_at)), 'yyyy-MM-dd') === daily[i]?.date
                  )
                  const val = dayPosts.length > 0
                    ? dayPosts.reduce((a, p) => a + p.engagement_rate, 0) / dayPosts.length
                    : 0
                  return { value: val }
                })}
                format="percent"
              />
              <KPICard
                label="Followers"
                value={followers}
                change={0}
                sparkData={[]}
              />
              <KPICard
                label="Shares"
                value={kpis.shares}
                change={pctChange(kpis.shares, prev.shares)}
                sparkData={daily.map((d) => ({ value: d.shares }))}
              />
              <KPICard
                label="Saves"
                value={kpis.saves}
                change={pctChange(kpis.saves, prev.saves)}
                sparkData={daily.map((d) => ({ value: d.saves }))}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <ViewsReachChart data={daily} />
              <EngagementChart data={daily} />
            </div>

            <TopPostsGrid posts={filtered} sortBy={sortBy} onSortChange={setSortBy} />

            {filtered.length === 0 && (
              <p className="mt-8 text-center text-zinc-500 text-sm">
                No posts in this range. Hit Sync Now or widen the date range.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}
