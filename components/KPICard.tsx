'use client'

import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface KPICardProps {
  label: string
  value: number | string
  change: number
  sparkData: { value: number }[]
  format?: 'number' | 'percent'
}

function fmt(value: number | string, format: 'number' | 'percent') {
  if (typeof value === 'string') return value
  if (format === 'percent') return `${value.toFixed(1)}%`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

export default function KPICard({ label, value, change, sparkData, format = 'number' }: KPICardProps) {
  const up = change >= 0
  const color = up ? '#22c55e' : '#ef4444'

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
      <span className="text-zinc-400 text-sm font-medium">{label}</span>
      <div className="flex items-end justify-between gap-2">
        <span className="text-white text-2xl font-bold">{fmt(value, format)}</span>
        <span className="text-sm font-medium pb-1" style={{ color }}>
          {up ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </span>
      </div>
      {sparkData.length > 1 && (
        <ResponsiveContainer width="100%" height={36}>
          <LineChart data={sparkData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
