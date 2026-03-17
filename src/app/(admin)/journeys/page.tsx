'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, GitBranch, FileText, ShieldCheck, Search,
  MoreHorizontal, Globe, Archive, Loader2, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { JourneyDef } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  DRAFT:     'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  ARCHIVED:  'bg-gray-100 text-gray-500',
}

const STEP_ICONS: Record<string, React.ElementType> = {
  FORM:         FileText,
  ID_CHECK:     ShieldCheck,
  CREDIT_CHECK: Search,
  CONDITION:    GitBranch,
}

export default function JourneysPage() {
  const router = useRouter()
  const [journeys, setJourneys] = useState<JourneyDef[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/journeys')
      .then(r => r.json())
      .then(data => { setJourneys(data); setLoading(false) })
  }, [])

  const createJourney = async () => {
    if (!newName.trim()) return
    setCreating(true)
    const res = await fetch('/api/journeys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, description: newDesc }),
    })
    const journey = await res.json()
    router.push(`/journeys/${journey.id}`)
  }

  const deleteJourney = async (id: string) => {
    if (!confirm('Delete this journey? This cannot be undone.')) return
    await fetch(`/api/journeys/${id}`, { method: 'DELETE' })
    setJourneys(j => j.filter(x => x.id !== id))
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Journeys</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Connect forms, ID checks and credit searches into guided application flows with branching logic.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4" />
          New Journey
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500 py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading journeys…
        </div>
      )}

      {!loading && journeys.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <GitBranch className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h2 className="text-lg font-semibold text-gray-700">No journeys yet</h2>
          <p className="text-gray-400 text-sm mt-1 mb-6 max-w-sm mx-auto">
            Create your first journey to chain forms, ID checks, and credit searches into a guided application flow.
          </p>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4" />
            Create Journey
          </Button>
        </div>
      )}

      {!loading && journeys.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {journeys.map(j => {
            const steps = j.steps ?? []
            const stepCounts = steps.reduce((acc, s) => {
              acc[s.type] = (acc[s.type] ?? 0) + 1
              return acc
            }, {} as Record<string, number>)

            return (
              <div
                key={j.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col"
              >
                <Link href={`/journeys/${j.id}`} className="flex-1 p-5 block">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <GitBranch className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_COLORS[j.status])}>
                      {j.status.charAt(0) + j.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-3">{j.name}</h3>
                  {j.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{j.description}</p>
                  )}
                  {/* Step type summary */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {Object.entries(stepCounts)
                      .filter(([type]) => type !== 'START' && type !== 'END')
                      .map(([type, count]) => {
                        const Icon = STEP_ICONS[type] ?? GitBranch
                        return (
                          <span key={type} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            <Icon className="w-3 h-3" />
                            {count} {type.toLowerCase().replace('_', ' ')}
                          </span>
                        )
                      })}
                    {steps.filter(s => s.type !== 'START').length === 0 && (
                      <span className="text-xs text-gray-400 italic">Empty — open to build</span>
                    )}
                  </div>
                </Link>

                <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                  {j.status === 'PUBLISHED' ? (
                    <a
                      href={`/journey/${j.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <Globe className="w-3 h-3" />
                      View live
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Not published</span>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/journeys/${j.id}`}>Edit journey</Link>
                      </DropdownMenuItem>
                      {j.status === 'PUBLISHED' && (
                        <DropdownMenuItem asChild>
                          <a href={`/journey/${j.slug}`} target="_blank" rel="noopener noreferrer">
                            <Globe className="w-3.5 h-3.5 mr-2" />
                            View live
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => deleteJourney(j.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New journey dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Customer Journey</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="j-name">Name</Label>
              <Input
                id="j-name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. New Member Join"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && createJourney()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="j-desc">Description (optional)</Label>
              <Textarea
                id="j-desc"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Describe what this journey does…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={createJourney} disabled={!newName.trim() || creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create &amp; Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
