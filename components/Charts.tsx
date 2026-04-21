'use client'

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface DailyPoint {
  date: string
  views: number
  reach: number
}

interface EngagementPoint {
  date: string
  likes: number
  comments: number
  shares: number
  saves: number
}

export function ViewsReachChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">Views & Reach</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gReach" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickFormatter={(d) => {
              try { return format(parseISO(d), 'MMM d') } catch { return d }
            }}
          />
          <YAxis tick={{ fill: '#71717a', fontSize: 11 }} width={45} />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
            labelStyle={{ color: '#a1a1aa' }}
            itemStyle={{ color: '#e4e4e7' }}
          />
          <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
          <Area type="monotone" dataKey="views" stroke="#818cf8" fill="url(#gViews)" strokeWidth={2} />
          <Area type="monotone" dataKey="reach" stroke="#34d399" fill="url(#gReach)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function EngagementChart({ data }: { data: EngagementPoint[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">Engagement Breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickFormatter={(d) => {
              try { return format(parseISO(d), 'MMM d') } catch { return d }
            }}
          />
          <YAxis tick={{ fill: '#71717a', fontSize: 11 }} width={45} />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
            labelStyle={{ color: '#a1a1aa' }}
            itemStyle={{ color: '#e4e4e7' }}
          />
          <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
          <Bar dataKey="likes" fill="#818cf8" radius={[2, 2, 0, 0]} />
          <Bar dataKey="comments" fill="#f472b6" radius={[2, 2, 0, 0]} />
          <Bar dataKey="shares" fill="#34d399" radius={[2, 2, 0, 0]} />
          <Bar dataKey="saves" fill="#fbbf24" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
