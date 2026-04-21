'use client'

import { format, parseISO } from 'date-fns'
import { ContentAnalytics } from '@/lib/supabase'

type SortKey = 'views' | 'likes' | 'shares' | 'engagement_rate'

interface Props {
  posts: ContentAnalytics[]
  sortBy: SortKey
  onSortChange: (key: SortKey) => void
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'views', label: 'Views' },
  { value: 'likes', label: 'Likes' },
  { value: 'shares', label: 'Shares' },
  { value: 'engagement_rate', label: 'Engagement Rate' },
]

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export default function TopPostsGrid({ posts, sortBy, onSortChange }: Props) {
  const sorted = [...posts].sort((a, b) => b[sortBy] - a[sortBy]).slice(0, 25)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Top Performing Posts</h3>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="bg-zinc-800 text-zinc-300 text-sm border border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-left">
              <th className="pb-3 font-medium w-12"></th>
              <th className="pb-3 font-medium">Post</th>
              <th className="pb-3 font-medium text-right">Views</th>
              <th className="pb-3 font-medium text-right">Likes</th>
              <th className="pb-3 font-medium text-right">Shares</th>
              <th className="pb-3 font-medium text-right">Eng. Rate</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((post) => (
              <tr key={post.post_id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="py-3 pr-3">
                  {post.thumbnail_url ? (
                    <img
                      src={post.thumbnail_url}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-zinc-800" />
                  )}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      post.platform === 'instagram'
                        ? 'bg-pink-500/20 text-pink-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {post.platform === 'instagram' ? 'IG' : 'YT'}
                    </span>
                    <div>
                      <p className="text-zinc-200 line-clamp-1 max-w-xs">
                        {post.title || 'Untitled'}
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {post.published_at
                          ? format(parseISO(post.published_at), 'dd MMM yyyy')
                          : '—'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-right text-zinc-300">{fmtNum(post.views)}</td>
                <td className="py-3 text-right text-zinc-300">{fmtNum(post.likes)}</td>
                <td className="py-3 text-right text-zinc-300">{fmtNum(post.shares)}</td>
                <td className="py-3 text-right text-zinc-300">{post.engagement_rate.toFixed(1)}%</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500">
                  No posts yet. Run a sync to pull your data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
