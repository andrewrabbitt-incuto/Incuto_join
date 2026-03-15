'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface TrendPoint {
  date: string
  starts: number
  completions: number
}

export function AnalyticsCharts({ trend }: { trend: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorStarts" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ fontSize: 12 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="starts" name="Starts" stroke="#3B82F6" fill="url(#colorStarts)" strokeWidth={2} />
        <Area type="monotone" dataKey="completions" name="Completions" stroke="#10B981" fill="url(#colorCompletions)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
