'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { ArrowLeft, FileText, Loader2, UserPlus, Calculator, PiggyBank, Baby, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { slugify, cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { FORM_TEMPLATES, type FormTemplate } from '@/lib/form-templates'

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  FileText: <FileText className="w-5 h-5" />,
  UserPlus: <UserPlus className="w-5 h-5" />,
  Calculator: <Calculator className="w-5 h-5" />,
  PiggyBank: <PiggyBank className="w-5 h-5" />,
  Baby: <Baby className="w-5 h-5" />,
}

export default function NewFormPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<'template' | 'details'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    formType: 'STANDARD',
    includesSavings: true,
    includesLoan: false,
    allowsCorporate: false,
    allowsChildren: false,
    requireCommonBond: true,
    chatbotEnabled: false,
    loanRedirectUrl: '',
  })

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: slugify(name) }))
  }

  const handleTemplateSelect = (template: FormTemplate) => {
    setSelectedTemplate(template)
    setForm(f => ({
      ...f,
      formType: template.formType,
      includesSavings: template.includesSavings,
      includesLoan: template.includesLoan,
      allowsCorporate: template.allowsCorporate,
      allowsChildren: template.allowsChildren,
      requireCommonBond: template.requireCommonBond,
    }))
    setStep('details')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          templateId: selectedTemplate?.id ?? 'blank',
        }),
      })
      if (!res.ok) throw new Error('Failed to create form')
      const data = await res.json()
      toast({ title: 'Form created!', description: 'Opening the form builder…' })
      router.push(`/forms/${data.id}`)
    } catch {
      toast({ title: 'Error', description: 'Failed to create form', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (step === 'template') {
    return (
      <div className="p-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/forms">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">New Form</h1>
            <p className="text-gray-500">Choose a template to get started</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FORM_TEMPLATES.map(template => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleTemplateSelect(template)}
              className="text-left p-5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mb-3 text-gray-500 group-hover:text-blue-600 transition-colors">
                {TEMPLATE_ICONS[template.icon] ?? <FileText className="w-5 h-5" />}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{template.name}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{template.description}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {template.includesSavings && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Savings</span>}
                {template.includesLoan && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Loan</span>}
                {template.requireCommonBond && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Common bond</span>}
                {template.allowsChildren && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Junior</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => setStep('template')}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">New Form</h1>
          <p className="text-gray-500">
            {selectedTemplate ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                Starting from: <strong>{selectedTemplate.name}</strong>
              </span>
            ) : 'Configure your join form'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Form Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Standard Join Form"
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="slug">URL Identifier *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">/join/</span>
                  <Input
                    id="slug"
                    placeholder="standard-join"
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this form…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Form Type</Label>
                <Select value={form.formType} onValueChange={v => setForm(f => ({ ...f, formType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard Join Form</SelectItem>
                    <SelectItem value="SAVINGS_ONLY">Savings Account Only</SelectItem>
                    <SelectItem value="LOAN">Loan Application</SelectItem>
                    <SelectItem value="ISA">ISA Product</SelectItem>
                    <SelectItem value="CORPORATE">Corporate Member</SelectItem>
                    <SelectItem value="CHILDREN">Junior Member</SelectItem>
                    <SelectItem value="CAMPAIGN">Campaign Form</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products &amp; Members</CardTitle>
            <CardDescription>Select which products and member types this form supports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'includesSavings', label: 'Savings Account', description: 'Include savings account application' },
              { key: 'includesLoan', label: 'Loan Application', description: 'Include loan application section' },
              { key: 'allowsCorporate', label: 'Corporate Members', description: 'Allow business/company applications' },
              { key: 'allowsChildren', label: 'Junior/Children Members', description: 'Allow applications for children' },
              { key: 'requireCommonBond', label: 'Require Common Bond', description: 'Member must confirm eligibility' },
              { key: 'chatbotEnabled', label: 'Enable AI Chatbot', description: 'Show AI assistant on member-facing form' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <Switch
                  checked={form[item.key as keyof typeof form] as boolean}
                  onCheckedChange={v => setForm(f => ({ ...f, [item.key]: v }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {form.includesLoan && (
          <Card>
            <CardHeader>
              <CardTitle>Loan Journey</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Loan Application Redirect URL</Label>
                <Input
                  placeholder="https://loans.incuto.com/apply?ref={memberId}"
                  value={form.loanRedirectUrl}
                  onChange={e => setForm(f => ({ ...f, loanRedirectUrl: e.target.value }))}
                />
                <p className="text-xs text-gray-500">Use {'{memberId}'} as a placeholder for the created member ID</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : <>
              <FileText className="w-4 h-4 mr-2" />Create &amp; Open Builder
            </>}
          </Button>
          <Link href="/forms">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
