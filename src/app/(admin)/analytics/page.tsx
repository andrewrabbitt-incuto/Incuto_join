'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { TrendingUp, MousePointerClick, FileText, GitBranch, Loader2, ArrowRight } from 'lucide-react'

interface EventGroup {
  landingPageId?: string | null
  formId?: string | null
  journeyId?: string | null
  eventType: string
  _count: { id: number }
}

interface DailyView { date: string; count: number }

interface LandingPageRow { id: string; name: string; slug?: string | null }
interface FormRow      { id: string; name: string }
interface JourneyRow   { id: string; name: string; slug: string }

function pct(num: number, denom: number) {
  if (!denom) return '—'
  return `${Math.round((num / denom) * 100)}%`
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniSparkline({ data }: { data: DailyView[] }) {
  if (!data.length) return <div className="h-12 flex items-center text-xs text-gray-300">No data</div>
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-0.5 h-12">
      {data.map((d, i) => (
        <div key={i} className="flex-1 rounded-t" style={{ height: `${(d.count / max) * 100}%`, backgroundColor: '#3b82f6', minHeight: 2 }} title={`${d.date}: ${d.count} views`} />
      ))}
    </div>
  )
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [lpEvents, setLpEvents] = useState<EventGroup[]>([])
  const [formEvents, setFormEvents] = useState<EventGroup[]>([])
  const [journeyEvents, setJourneyEvents] = useState<EventGroup[]>([])
  const [dailyViews, setDailyViews] = useState<DailyView[]>([])
  const [landingPages, setLandingPages] = useState<LandingPageRow[]>([])
  const [forms, setForms] = useState<FormRow[]>([])
  const [journeys, setJourneys] = useState<JourneyRow[]>([])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/analytics?since=${period}`).then(r => r.json()),
      fetch('/api/landing-pages').then(r => r.json()),
      fetch('/api/forms').then(r => r.json()),
      fetch('/api/journeys').then(r => r.json()),
    ]).then(([analytics, lps, fms, jrns]) => {
      setLpEvents(analytics.lpEvents ?? [])
      setFormEvents(analytics.formEvents ?? [])
      setJourneyEvents(analytics.journeyEvents ?? [])
      setDailyViews(analytics.dailyViews ?? [])
      setLandingPages(Array.isArray(lps) ? lps : [])
      setForms(Array.isArray(fms) ? fms : [])
      setJourneys(Array.isArray(jrns) ? jrns : [])
    }).finally(() => setLoading(false))
  }, [period])

  function countFor(events: EventGroup[], idKey: 'landingPageId' | 'formId' | 'journeyId', idVal: string, type: string) {
    return events.find(e => e[idKey] === idVal && e.eventType === type)?._count.id ?? 0
  }

  const totalViews    = lpEvents.filter(e => e.eventType === 'PAGE_VIEW').reduce((s, e) => s + e._count.id, 0)
  const totalStarts   = formEvents.filter(e => e.eventType === 'FORM_START').reduce((s, e) => s + e._count.id, 0)
  const totalComplete = formEvents.filter(e => e.eventType === 'FORM_COMPLETE').reduce((s, e) => s + e._count.id, 0)

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-500">Compare performance across landing pages, forms and journeys</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Page views" value={totalViews.toLocaleString()} icon={MousePointerClick} color="#3b82f6" />
        <StatCard label="Form starts" value={totalStarts.toLocaleString()} icon={FileText} color="#8b5cf6" />
        <StatCard label="Completions" value={totalComplete.toLocaleString()} icon={TrendingUp} color="#10b981" />
        <StatCard label="Conversion rate" value={pct(totalComplete, totalStarts)} icon={ArrowRight} color="#f59e0b" />
      </div>

      {/* Daily sparkline */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Daily page views</CardTitle></CardHeader>
        <CardContent>
          <MiniSparkline data={dailyViews} />
        </CardContent>
      </Card>

      {/* Landing pages table */}
      <section>
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MousePointerClick className="w-4 h-4 text-blue-500" />Landing Pages
        </h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">Page</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs">Views</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs">Form starts</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs">Conversions</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs">Conv. rate</th>
                </tr>
              </thead>
              <tbody>
                {landingPages.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No landing pages yet</td></tr>
                ) : landingPages.map(lp => {
                  const views    = countFor(lpEvents, 'landingPageId', lp.id, 'PAGE_VIEW')
                  const starts   = countFor(formEvents, 'formId', lp.id, 'FORM_START')
                  const complete = countFor(formEvents, 'formId', lp.id, 'FORM_COMPLETE')
                  return (
                    <tr key={lp.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{lp.name}</p>
                        {lp.slug && <p className="text-xs text-gray-400">/lp/{lp.slug}</p>}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{starts.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{complete.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant={complete > 0 ? 'success' : 'secondary'}>{pct(complete, starts)}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Forms table */}
      <section>
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-500" />Forms
        </h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">Form</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs">Starts</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs">Completions</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs">Completion rate</th>
                </tr>
              </thead>
              <tbody>
                {forms.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No forms yet</td></tr>
                ) : forms.map(form => {
                  const starts   = countFor(formEvents, 'formId', form.id, 'FORM_START')
                  const complete = countFor(formEvents, 'formId', form.id, 'FORM_COMPLETE')
                  return (
                    <tr key={form.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{form.name}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{starts.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{complete.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant={complete > 0 ? 'success' : 'secondary'}>{pct(complete, starts)}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Journeys table */}
      <section>
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-amber-500" />Journeys
        </h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">Journey</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs">Starts</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs">Completions</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs">Completion rate</th>
                </tr>
              </thead>
              <tbody>
                {journeys.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No journeys yet</td></tr>
                ) : journeys.map(journey => {
                  const starts   = countFor(journeyEvents, 'journeyId', journey.id, 'JOURNEY_START')
                  const complete = countFor(journeyEvents, 'journeyId', journey.id, 'JOURNEY_COMPLETE')
                  return (
                    <tr key={journey.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{journey.name}</p>
                        <p className="text-xs text-gray-400">/journey/{journey.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{starts.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{complete.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant={complete > 0 ? 'success' : 'secondary'}>{pct(complete, starts)}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}
