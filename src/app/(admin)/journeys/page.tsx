'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, GitBranch, FileText, ShieldCheck, Search,
  MoreHorizontal, Globe, Archive, Loader2, Trash2,
  UserPlus, ThumbsUp, ArrowLeft, CheckCircle2,
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
import { JOURNEY_TEMPLATES, type JourneyTemplate } from '@/lib/journey-templates'
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

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  GitBranch: <GitBranch className="w-5 h-5" />,
  UserPlus:  <UserPlus className="w-5 h-5" />,
  ThumbsUp:  <ThumbsUp className="w-5 h-5" />,
}

// Step count badge colour per type
const STEP_TYPE_COLORS: Record<string, string> = {
  FORM:         'bg-blue-100 text-blue-700',
  ID_CHECK:     'bg-purple-100 text-purple-700',
  CREDIT_CHECK: 'bg-amber-100 text-amber-700',
  CONDITION:    'bg-gray-100 text-gray-600',
}

export default function JourneysPage() {
  const router = useRouter()
  const [journeys, setJourneys] = useState<JourneyDef[]>([])
  const [loading, setLoading] = useState(true)

  // Template picker dialog state
  const [showPicker, setShowPicker] = useState(false)
  const [pickerStep, setPickerStep] = useState<'template' | 'name'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<JourneyTemplate | null>(null)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/journeys')
      .then(r => r.json())
      .then(data => { setJourneys(data); setLoading(false) })
  }, [])

  const openPicker = () => {
    setPickerStep('template')
    setSelectedTemplate(null)
    setNewName('')
    setNewDesc('')
    setShowPicker(true)
  }

  const selectTemplate = (template: JourneyTemplate) => {
    setSelectedTemplate(template)
    setNewName(template.id === 'blank' ? '' : template.name)
    setPickerStep('name')
  }

  const createJourney = async () => {
    if (!newName.trim()) return
    setCreating(true)
    const res = await fetch('/api/journeys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName,
        description: newDesc,
        templateId: selectedTemplate?.id ?? 'blank',
      }),
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
        <Button onClick={openPicker}>
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
          <Button onClick={openPicker}>
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
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {Object.entries(stepCounts)
                      .filter(([type]) => type !== 'START' && type !== 'END')
                      .map(([type, count]) => {
                        const Icon = STEP_ICONS[type] ?? GitBranch
                        return (
                          <span
                            key={type}
                            className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full', STEP_TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600')}
                          >
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

      {/* New journey dialog — 2-step: template picker → name */}
      <Dialog open={showPicker} onOpenChange={open => { if (!creating) setShowPicker(open) }}>
        <DialogContent className={pickerStep === 'template' ? 'max-w-2xl' : 'max-w-lg'}>
          {pickerStep === 'template' ? (
            <>
              <DialogHeader>
                <DialogTitle>New Customer Journey</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">Choose a template to get started</p>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                {JOURNEY_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => selectTemplate(template)}
                    className="text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mb-2.5 text-gray-500 group-hover:text-blue-600 transition-colors">
                      {TEMPLATE_ICONS[template.icon] ?? <GitBranch className="w-5 h-5" />}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-1">{template.name}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{template.description}</p>
                    {/* Step type summary */}
                    {template.steps.filter(s => s.type !== 'START' && s.type !== 'END').length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {Array.from(new Set(template.steps.filter(s => s.type !== 'START' && s.type !== 'END').map(s => s.type))).map(type => {
                          const Icon = STEP_ICONS[type] ?? GitBranch
                          return (
                            <span key={type} className={cn('inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full', STEP_TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600')}>
                              <Icon className="w-2.5 h-2.5" />
                              {type.toLowerCase().replace('_', ' ')}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPickerStep('template')} className="text-gray-400 hover:text-gray-600">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <DialogTitle>Name Your Journey</DialogTitle>
                </div>
                {selectedTemplate && (
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    Starting from: <strong>{selectedTemplate.name}</strong>
                    {selectedTemplate.steps.some(s => s.formTemplateId) ? (
                      <span className="text-xs text-blue-600 ml-1">(forms will be created automatically)</span>
                    ) : null}
                  </p>
                )}
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="j-name">Journey Name *</Label>
                  <Input
                    id="j-name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. GetToYes — Personal Loans"
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
                <Button variant="outline" onClick={() => setShowPicker(false)}>Cancel</Button>
                <Button onClick={createJourney} disabled={!newName.trim() || creating}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create &amp; Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
