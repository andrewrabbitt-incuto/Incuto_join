'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Save, Globe, Plus, Trash2, GripVertical, Loader2,
  Eye, ChevronUp, ChevronDown, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import type { PageSection } from '@/types/landing-page'

type SectionType = PageSection['type']

const SECTION_TYPES: { type: SectionType; label: string; description: string }[] = [
  { type: 'hero',         label: 'Hero',         description: 'Large banner with headline and CTA button' },
  { type: 'features',     label: 'Features',     description: 'Icon grid of key benefits' },
  { type: 'rates',        label: 'Rates',        description: 'Savings or loan rate table' },
  { type: 'testimonials', label: 'Testimonials', description: 'Member quotes and ratings' },
  { type: 'trust',        label: 'Trust Badges', description: 'FSCS, FCA, ABCUL logos/text' },
  { type: 'faq',          label: 'FAQ',          description: 'Accordion of common questions' },
  { type: 'cta',          label: 'CTA Banner',   description: 'Call-to-action banner' },
  { type: 'richtext',     label: 'Rich Text',    description: 'Free HTML content block' },
]

function defaultSection(type: SectionType): PageSection {
  switch (type) {
    case 'hero': return { type, headline: 'Join our credit union', subheadline: 'A better way to save and borrow.', ctaText: 'Apply now', ctaLink: '' }
    case 'features': return { type, heading: 'Why join us?', items: [{ icon: 'Shield', title: 'Safe & secure', body: 'Your savings are protected up to £85,000 by the FSCS.' }] }
    case 'rates': return { type, heading: 'Our rates', items: [{ product: 'Regular Savings', rate: '3.0% AER' }] }
    case 'testimonials': return { type, heading: 'What our members say', items: [{ quote: 'Great credit union — highly recommend!', author: 'A. Member', role: 'Member since 2019' }] }
    case 'trust': return { type, items: [{ icon: 'Shield', label: 'FSCS Protected' }, { icon: 'CheckCircle', label: 'FCA Regulated' }] }
    case 'faq': return { type, heading: 'Frequently asked questions', items: [{ question: 'Who can join?', answer: 'Anyone who meets our common bond criteria.' }] }
    case 'cta': return { type, headline: 'Ready to join?', subheadline: 'Apply online in minutes.', ctaText: 'Start your application', ctaLink: '' }
    case 'richtext': return { type, content: '<p>Add your content here.</p>' }
  }
}

// ─── Section editors ──────────────────────────────────────────────────────────

function HeroEditor({ section, onChange }: { section: Extract<PageSection, { type: 'hero' }>; onChange: (s: PageSection) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Headline"><Input value={section.headline} onChange={e => onChange({ ...section, headline: e.target.value })} /></Field>
      <Field label="Subheadline"><Input value={section.subheadline ?? ''} onChange={e => onChange({ ...section, subheadline: e.target.value })} /></Field>
      <Field label="CTA Button Text"><Input value={section.ctaText} onChange={e => onChange({ ...section, ctaText: e.target.value })} /></Field>
      <Field label="CTA Link (e.g. /form/join or /journey/apply)"><Input value={section.ctaLink} onChange={e => onChange({ ...section, ctaLink: e.target.value })} placeholder="/form/your-form-slug" /></Field>
      <Field label="Background Image URL (optional)"><Input value={section.backgroundImageUrl ?? ''} onChange={e => onChange({ ...section, backgroundImageUrl: e.target.value })} placeholder="https://..." /></Field>
      <Field label="Background Colour (if no image)"><Input type="color" value={section.backgroundColor ?? '#1E40AF'} onChange={e => onChange({ ...section, backgroundColor: e.target.value })} className="h-9 w-20 p-1" /></Field>
    </div>
  )
}

function FeaturesEditor({ section, onChange }: { section: Extract<PageSection, { type: 'features' }>; onChange: (s: PageSection) => void }) {
  const items = section.items
  return (
    <div className="space-y-3">
      <Field label="Heading"><Input value={section.heading ?? ''} onChange={e => onChange({ ...section, heading: e.target.value })} /></Field>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Item {i + 1}</span>
              <button type="button" onClick={() => onChange({ ...section, items: items.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <Input placeholder="Icon name (e.g. Shield, Percent, Users)" value={item.icon ?? ''} onChange={e => { const next = [...items]; next[i] = { ...item, icon: e.target.value }; onChange({ ...section, items: next }) }} className="h-8 text-sm" />
            <Input placeholder="Title" value={item.title} onChange={e => { const next = [...items]; next[i] = { ...item, title: e.target.value }; onChange({ ...section, items: next }) }} className="h-8 text-sm" />
            <Input placeholder="Body text" value={item.body} onChange={e => { const next = [...items]; next[i] = { ...item, body: e.target.value }; onChange({ ...section, items: next }) }} className="h-8 text-sm" />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...section, items: [...items, { icon: 'CheckCircle', title: 'New feature', body: 'Description here.' }] })}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add item
        </Button>
      </div>
    </div>
  )
}

function RatesEditor({ section, onChange }: { section: Extract<PageSection, { type: 'rates' }>; onChange: (s: PageSection) => void }) {
  const items = section.items
  return (
    <div className="space-y-3">
      <Field label="Heading"><Input value={section.heading ?? ''} onChange={e => onChange({ ...section, heading: e.target.value })} /></Field>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex gap-2">
              <Input placeholder="Product" value={item.product} onChange={e => { const next = [...items]; next[i] = { ...item, product: e.target.value }; onChange({ ...section, items: next }) }} className="h-8 text-sm flex-1" />
              <Input placeholder="Rate" value={item.rate} onChange={e => { const next = [...items]; next[i] = { ...item, rate: e.target.value }; onChange({ ...section, items: next }) }} className="h-8 text-sm w-28" />
              <button type="button" onClick={() => onChange({ ...section, items: items.filter((_, j) => j !== i) })} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...section, items: [...items, { product: 'New product', rate: '0.00% AER' }] })}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add rate
        </Button>
      </div>
      <Field label="Small print"><Input value={section.note ?? ''} onChange={e => onChange({ ...section, note: e.target.value })} placeholder="Rates correct as of..." /></Field>
    </div>
  )
}

function FaqEditor({ section, onChange }: { section: Extract<PageSection, { type: 'faq' }>; onChange: (s: PageSection) => void }) {
  const items = section.items
  return (
    <div className="space-y-3">
      <Field label="Heading"><Input value={section.heading ?? ''} onChange={e => onChange({ ...section, heading: e.target.value })} /></Field>
      {items.map((item, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Q{i + 1}</span>
            <button type="button" onClick={() => onChange({ ...section, items: items.filter((_, j) => j !== i) })} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <Input placeholder="Question" value={item.question} onChange={e => { const next = [...items]; next[i] = { ...item, question: e.target.value }; onChange({ ...section, items: next }) }} className="h-8 text-sm" />
          <Textarea placeholder="Answer" value={item.answer} onChange={e => { const next = [...items]; next[i] = { ...item, answer: e.target.value }; onChange({ ...section, items: next }) }} rows={2} className="text-sm" />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...section, items: [...items, { question: 'New question?', answer: 'Answer here.' }] })}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Add question
      </Button>
    </div>
  )
}

function CtaEditor({ section, onChange }: { section: Extract<PageSection, { type: 'cta' }>; onChange: (s: PageSection) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Headline"><Input value={section.headline} onChange={e => onChange({ ...section, headline: e.target.value })} /></Field>
      <Field label="Subheadline"><Input value={section.subheadline ?? ''} onChange={e => onChange({ ...section, subheadline: e.target.value })} /></Field>
      <Field label="CTA Text"><Input value={section.ctaText} onChange={e => onChange({ ...section, ctaText: e.target.value })} /></Field>
      <Field label="CTA Link"><Input value={section.ctaLink} onChange={e => onChange({ ...section, ctaLink: e.target.value })} placeholder="/form/your-form-slug" /></Field>
    </div>
  )
}

function TestimonialsEditor({ section, onChange }: { section: Extract<PageSection, { type: 'testimonials' }>; onChange: (s: PageSection) => void }) {
  const items = section.items
  return (
    <div className="space-y-3">
      <Field label="Heading"><Input value={section.heading ?? ''} onChange={e => onChange({ ...section, heading: e.target.value })} /></Field>
      {items.map((item, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Testimonial {i + 1}</span>
            <button type="button" onClick={() => onChange({ ...section, items: items.filter((_, j) => j !== i) })} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <Textarea placeholder="Quote" value={item.quote} onChange={e => { const next = [...items]; next[i] = { ...item, quote: e.target.value }; onChange({ ...section, items: next }) }} rows={2} className="text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Author name" value={item.author} onChange={e => { const next = [...items]; next[i] = { ...item, author: e.target.value }; onChange({ ...section, items: next }) }} className="h-8 text-sm" />
            <Input placeholder="Role (optional)" value={item.role ?? ''} onChange={e => { const next = [...items]; next[i] = { ...item, role: e.target.value }; onChange({ ...section, items: next }) }} className="h-8 text-sm" />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...section, items: [...items, { quote: 'Great credit union!', author: 'A. Member' }] })}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Add testimonial
      </Button>
    </div>
  )
}

function TrustEditor({ section, onChange }: { section: Extract<PageSection, { type: 'trust' }>; onChange: (s: PageSection) => void }) {
  const items = section.items
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input placeholder="Icon name" value={item.icon ?? ''} onChange={e => { const next = [...items]; next[i] = { ...item, icon: e.target.value }; onChange({ ...section, items: next }) }} className="h-8 text-sm w-32" />
          <Input placeholder="Label" value={item.label} onChange={e => { const next = [...items]; next[i] = { ...item, label: e.target.value }; onChange({ ...section, items: next }) }} className="h-8 text-sm flex-1" />
          <button type="button" onClick={() => onChange({ ...section, items: items.filter((_, j) => j !== i) })} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...section, items: [...items, { icon: 'Shield', label: 'FSCS Protected' }] })}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Add badge
      </Button>
    </div>
  )
}

function RichTextEditor({ section, onChange }: { section: Extract<PageSection, { type: 'richtext' }>; onChange: (s: PageSection) => void }) {
  return (
    <Field label="HTML content">
      <Textarea value={section.content} onChange={e => onChange({ ...section, content: e.target.value })} rows={6} className="font-mono text-xs" />
    </Field>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-gray-500">{label}</Label>
      {children}
    </div>
  )
}

function SectionEditor({ section, onChange, onDelete, onMove, canMoveUp, canMoveDown }: {
  section: PageSection; onChange: (s: PageSection) => void
  onDelete: () => void; onMove: (dir: 'up' | 'down') => void
  canMoveUp: boolean; canMoveDown: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  const label = SECTION_TYPES.find(t => t.type === section.type)?.label ?? section.type

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="font-medium text-sm text-gray-700 flex-1">{label}</span>
        <div className="flex gap-1 items-center" onClick={e => e.stopPropagation()}>
          <button onClick={() => onMove('up')} disabled={!canMoveUp} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button onClick={() => onMove('down')} disabled={!canMoveDown} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {expanded && (
        <div className="p-4">
          {section.type === 'hero'         && <HeroEditor section={section} onChange={onChange} />}
          {section.type === 'features'     && <FeaturesEditor section={section} onChange={onChange} />}
          {section.type === 'rates'        && <RatesEditor section={section} onChange={onChange} />}
          {section.type === 'faq'          && <FaqEditor section={section} onChange={onChange} />}
          {section.type === 'cta'          && <CtaEditor section={section} onChange={onChange} />}
          {section.type === 'testimonials' && <TestimonialsEditor section={section} onChange={onChange} />}
          {section.type === 'trust'        && <TrustEditor section={section} onChange={onChange} />}
          {section.type === 'richtext'     && <RichTextEditor section={section} onChange={onChange} />}
        </div>
      )}
    </div>
  )
}

// ─── Main page editor ─────────────────────────────────────────────────────────

export default function LandingPageEditorPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [pageTitle, setPageTitle] = useState('')
  const [seoDesc, setSeoDesc] = useState('')
  const [published, setPublished] = useState(false)
  const [sections, setSections] = useState<PageSection[]>([])

  useEffect(() => {
    fetch(`/api/landing-pages/${id}`)
      .then(r => r.json())
      .then(data => {
        setName(data.name ?? '')
        setSlug(data.slug ?? '')
        setPageTitle(data.pageTitle ?? '')
        setSeoDesc(data.seoDescription ?? '')
        setPublished(data.published ?? false)
        setSections((data.content ?? []) as PageSection[])
      })
      .finally(() => setLoading(false))
  }, [id])

  async function save(publish?: boolean) {
    setSaving(true)
    try {
      await fetch(`/api/landing-pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, slug, pageTitle, seoDescription: seoDesc,
          published: publish ?? published,
          content: sections,
        }),
      })
      if (publish !== undefined) setPublished(publish)
      toast({ title: publish ? 'Page published!' : 'Saved!' })
    } catch {
      toast({ title: 'Error saving', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  function addSection(type: SectionType) {
    setSections(prev => [...prev, defaultSection(type)])
  }

  function updateSection(i: number, s: PageSection) {
    setSections(prev => prev.map((sec, j) => j === i ? s : sec))
  }

  function deleteSection(i: number) {
    setSections(prev => prev.filter((_, j) => j !== i))
  }

  function moveSection(i: number, dir: 'up' | 'down') {
    setSections(prev => {
      const next = [...prev]
      const target = dir === 'up' ? i - 1 : i + 1
      ;[next[i], next[target]] = [next[target], next[i]]
      return next
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
  }

  return (
    <div className="flex h-full">
      {/* ── Left: section editor ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Toolbar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center gap-3 px-4 sticky top-0 z-10">
          <Link href="/landing-pages">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <Input value={name} onChange={e => setName(e.target.value)} className="h-8 w-56 font-medium text-sm" />
          <div className="ml-auto flex items-center gap-2">
            {published && slug && (
              <a href={`/lp/${slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <Globe className="w-3.5 h-3.5" />View live
              </a>
            )}
            <Button variant="outline" size="sm" onClick={() => save()}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </Button>
            {!published
              ? <Button size="sm" onClick={() => save(true)}><Globe className="w-3.5 h-3.5 mr-1" />Publish</Button>
              : <Button size="sm" variant="destructive" onClick={() => save(false)}>Unpublish</Button>}
          </div>
        </div>

        <div className="p-6 space-y-6 max-w-3xl">
          {/* Page settings */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Page Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="URL slug (/lp/...)">
                  <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="my-campaign" />
                </Field>
                <Field label="Page title (browser tab)">
                  <Input value={pageTitle} onChange={e => setPageTitle(e.target.value)} placeholder="Join our credit union" />
                </Field>
              </div>
              <Field label="SEO description">
                <Textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} rows={2} placeholder="Short description shown in Google search results" />
              </Field>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-sm font-medium">Published</p>
                  <p className="text-xs text-gray-400">Make this page publicly accessible at /lp/{slug || '…'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={published ? 'success' : 'secondary'}>{published ? 'Live' : 'Draft'}</Badge>
                  <Switch checked={published} onCheckedChange={v => { setPublished(v); save(v) }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">Page sections</h3>
            {sections.length === 0 && (
              <div className="border-2 border-dashed border-gray-200 rounded-xl py-12 text-center text-gray-400 text-sm">
                Add sections below to build your page
              </div>
            )}
            {sections.map((section, i) => (
              <SectionEditor
                key={i}
                section={section}
                onChange={s => updateSection(i, s)}
                onDelete={() => deleteSection(i)}
                onMove={dir => moveSection(i, dir)}
                canMoveUp={i > 0}
                canMoveDown={i < sections.length - 1}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: add sections sidebar ───────────────────────────────────── */}
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Section</p>
        </div>
        <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {SECTION_TYPES.map(st => (
            <button
              key={st.type}
              type="button"
              onClick={() => addSection(st.type)}
              className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors"
            >
              <p className="text-xs font-medium text-gray-700">{st.label}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{st.description}</p>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-gray-100">
          <a href={`/lp/${slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:underline py-2">
            <Eye className="w-3.5 h-3.5" />
            Preview page
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
