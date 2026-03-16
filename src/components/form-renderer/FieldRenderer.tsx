'use client'

import { useState } from 'react'
import type { FormFieldDef, FieldCondition } from '@/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { HelpCircle, Search, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldRendererProps {
  field: FormFieldDef
  value: unknown
  onChange: (value: unknown) => void
  error?: string
  formData: Record<string, unknown>
  /** Results from mid-form triggers (credit search, quotation, etc.) */
  formContext?: Record<string, unknown>
  branding: { primaryColor: string; borderRadius: string }
}

/** Resolve a dot-path like "credit_result.tier" into a nested object value */
function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc !== null && acc !== undefined && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Evaluate show/hide conditions against form field values and/or trigger context.
 *
 * Conditions with source='context' (or source omitted and fieldKey contains a dot)
 * are resolved against formContext using dot-path notation.
 * All other conditions are resolved against formData.
 */
export function evaluateConditions(
  conditions: FieldCondition[] | undefined,
  formData: Record<string, unknown>,
  formContext?: Record<string, unknown>
): boolean {
  if (!conditions || conditions.length === 0) return true

  let result = true
  for (let i = 0; i < conditions.length; i++) {
    const cond = conditions[i]

    // Determine source: explicit 'context', or implicit (fieldKey contains a dot)
    const isContext = cond.source === 'context' || (cond.source === undefined && cond.fieldKey.includes('.'))
    const fieldValue = isContext
      ? resolvePath(formContext ?? {}, cond.fieldKey)
      : formData[cond.fieldKey]

    let matches = false
    switch (cond.operator) {
      case 'equals':        matches = String(fieldValue) === String(cond.value); break
      case 'not_equals':    matches = String(fieldValue) !== String(cond.value); break
      case 'contains':      matches = String(fieldValue).includes(String(cond.value)); break
      case 'greater_than':  matches = Number(fieldValue) > Number(cond.value); break
      case 'less_than':     matches = Number(fieldValue) < Number(cond.value); break
      case 'is_empty':      matches = !fieldValue || String(fieldValue).trim() === ''; break
      case 'is_not_empty':  matches = !!fieldValue && String(fieldValue).trim() !== ''; break
    }

    result = i === 0 ? matches : (cond.logic === 'OR' ? result || matches : result && matches)
  }
  return result
}

function InfoButton({ button }: { button: NonNullable<FormFieldDef['infoButton']> }) {
  const [open, setOpen] = useState(false)

  if (button.type === 'tooltip') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-gray-400 hover:text-blue-500 transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">{button.content}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-gray-400 hover:text-blue-500">
        <HelpCircle className="w-4 h-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{button.title}</DialogTitle>
            <DialogDescription className="whitespace-pre-wrap text-gray-600 text-sm">
              {button.content}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function FieldRenderer({ field, value, onChange, error, formData, formContext, branding }: FieldRendererProps) {
  // Show/hide based on conditions (may reference formContext via dot-path)
  const visible = evaluateConditions(field.conditions, formData, formContext)
  if (!visible) return null

  const inputClass = cn(
    'w-full',
    error && 'border-red-400 focus-visible:ring-red-400'
  )

  const renderInput = () => {
    switch (field.fieldType) {
      case 'TEXT':
      case 'NATIONAL_INSURANCE':
        return <Input className={inputClass} placeholder={field.placeholder} value={String(value || '')} onChange={e => onChange(e.target.value)} />

      case 'EMAIL':
        return <Input type="email" className={inputClass} placeholder={field.placeholder || 'email@example.com'} value={String(value || '')} onChange={e => onChange(e.target.value)} />

      case 'PHONE':
        return <Input type="tel" className={inputClass} placeholder={field.placeholder || '+44 7700 900000'} value={String(value || '')} onChange={e => onChange(e.target.value)} />

      case 'NUMBER':
      case 'SORT_CODE':
      case 'ACCOUNT_NUMBER':
        return <Input type={field.fieldType === 'NUMBER' ? 'number' : 'text'} className={inputClass} placeholder={field.placeholder} value={String(value || '')} onChange={e => onChange(e.target.value)} />

      case 'DATE':
        return <Input type="date" className={inputClass} value={String(value || '')} onChange={e => onChange(e.target.value)} />

      case 'TEXTAREA':
        return <Textarea className={inputClass} placeholder={field.placeholder} value={String(value || '')} onChange={e => onChange(e.target.value)} rows={4} />

      case 'SELECT':
      case 'LOAN_PURPOSE':
      case 'LOAN_TERM':
        return (
          <Select value={String(value || '')} onValueChange={onChange}>
            <SelectTrigger className={inputClass}>
              <SelectValue placeholder={field.placeholder || 'Select…'} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'RADIO':
      case 'MEMBER_TYPE_SELECTOR':
        return (
          <div className="space-y-2">
            {(field.options || [{ label: 'Individual', value: 'INDIVIDUAL' }, { label: 'Business', value: 'CORPORATE' }, { label: 'Child', value: 'CHILD' }]).map(opt => (
              <label key={opt.value} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors" style={value === opt.value ? { borderColor: branding.primaryColor, backgroundColor: `${branding.primaryColor}10` } : {}}>
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: value === opt.value ? branding.primaryColor : '#D1D5DB' }}>
                  {value === opt.value && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: branding.primaryColor }} />}
                </div>
                <div>
                  <span className="text-sm font-medium">{opt.label}</span>
                  {opt.description && <p className="text-xs text-gray-500">{opt.description}</p>}
                </div>
                <input type="radio" className="sr-only" value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} />
              </label>
            ))}
          </div>
        )

      case 'PRODUCT_SELECTOR':
        return (
          <div className="space-y-2">
            {[
              { label: 'Savings Account', value: 'savings', description: 'Open a savings account with us' },
              { label: 'Loan', value: 'loan', description: 'Apply for a personal loan' },
              { label: 'Savings + Loan', value: 'both', description: 'Open a savings account and apply for a loan' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors" style={value === opt.value ? { borderColor: branding.primaryColor, backgroundColor: `${branding.primaryColor}10` } : {}}>
                <input type="radio" className="sr-only" value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} />
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: value === opt.value ? branding.primaryColor : '#D1D5DB' }}>
                  {value === opt.value && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: branding.primaryColor }} />}
                </div>
                <div>
                  <span className="text-sm font-medium">{opt.label}</span>
                  <p className="text-xs text-gray-500">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        )

      case 'CHECKBOX':
      case 'CONSENT':
      case 'DECLARATION':
        return (
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-0.5">
              <input type="checkbox" className="sr-only" checked={!!value} onChange={e => onChange(e.target.checked)} />
              <div className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors" style={{ borderColor: value ? branding.primaryColor : '#D1D5DB', backgroundColor: value ? branding.primaryColor : 'transparent' }}>
                {!!value && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>
            <span className="text-sm text-gray-700 leading-relaxed">{field.placeholder || field.label}</span>
          </label>
        )

      case 'MULTI_SELECT':
        const selectedValues = (value as string[] || [])
        return (
          <div className="space-y-2">
            {(field.options || []).map(opt => {
              const checked = selectedValues.includes(opt.value)
              return (
                <label key={opt.value} className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-gray-50" style={checked ? { borderColor: branding.primaryColor } : {}}>
                  <div className="w-4 h-4 rounded border-2 flex items-center justify-center" style={{ borderColor: checked ? branding.primaryColor : '#D1D5DB', backgroundColor: checked ? branding.primaryColor : 'transparent' }}>
                    {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-sm">{opt.label}</span>
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => {
                    if (checked) onChange(selectedValues.filter(v => v !== opt.value))
                    else onChange([...selectedValues, opt.value])
                  }} />
                </label>
              )
            })}
          </div>
        )

      case 'ADDRESS_LOOKUP':
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                className={cn(inputClass, 'flex-1')}
                placeholder="Enter postcode…"
                value={String((value as Record<string, string> || {}).postcode || '')}
                onChange={e => onChange({ ...(value as Record<string, string> || {}), postcode: e.target.value })}
              />
              <Button type="button" variant="outline" size="sm" className="h-10">
                <Search className="w-4 h-4 mr-1" /> Find
              </Button>
            </div>
            {(value as Record<string, string>)?.line1 !== undefined && (
              <div className="space-y-2 pl-2">
                <Input placeholder="Address line 1" value={String((value as Record<string, string> || {}).line1 || '')} onChange={e => onChange({ ...(value as Record<string, string> || {}), line1: e.target.value })} className="h-9 text-sm" />
                <Input placeholder="Address line 2" value={String((value as Record<string, string> || {}).line2 || '')} onChange={e => onChange({ ...(value as Record<string, string> || {}), line2: e.target.value })} className="h-9 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Town/City" value={String((value as Record<string, string> || {}).city || '')} onChange={e => onChange({ ...(value as Record<string, string> || {}), city: e.target.value })} className="h-9 text-sm" />
                  <Input placeholder="County" value={String((value as Record<string, string> || {}).county || '')} onChange={e => onChange({ ...(value as Record<string, string> || {}), county: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>
            )}
          </div>
        )

      case 'COMMON_BOND_SELECTOR':
        return (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-3">Please confirm your eligibility</p>
            <Select value={String(value || '')} onValueChange={onChange}>
              <SelectTrigger><SelectValue placeholder="Select your qualifying category…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="geographical">I live in the qualifying area</SelectItem>
                <SelectItem value="employment">I work for a qualifying employer</SelectItem>
                <SelectItem value="family">I am a family member of an existing member</SelectItem>
                <SelectItem value="community">I am a member of the qualifying community</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )

      case 'LOAN_AMOUNT':
        return (
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">£</span>
              <Input type="number" className={cn(inputClass, 'pl-7')} placeholder="0" min={100} max={50000} step={100} value={String(value || '')} onChange={e => onChange(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1000, 2500, 5000, 10000].map(amount => (
                <button key={amount} type="button" onClick={() => onChange(String(amount))} className="py-1.5 text-sm rounded border transition-colors hover:border-blue-400 hover:bg-blue-50">
                  £{amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )

      case 'FILE_UPLOAD':
      case 'ID_UPLOAD':
        return (
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
            <input type="file" className="sr-only" id={`file-${field.id}`} accept={field.fieldType === 'ID_UPLOAD' ? 'image/*,.pdf' : '*'} onChange={e => onChange(e.target.files?.[0])} />
            <label htmlFor={`file-${field.id}`} className="cursor-pointer">
              <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <p className="text-sm text-gray-600">Click to upload or drag &amp; drop</p>
              <p className="text-xs text-gray-400 mt-1">{field.fieldType === 'ID_UPLOAD' ? 'Passport, driving licence or national ID' : 'PDF, JPG, PNG up to 10MB'}</p>
            </label>
          </div>
        )

      case 'SIGNATURE':
        return (
          <div className="border-2 rounded-lg p-4 bg-gray-50 min-h-[100px] flex items-center justify-center text-sm text-gray-400 italic">
            Click to sign
          </div>
        )

      case 'HEADING':
        return <h3 className="text-xl font-bold text-gray-800">{field.label}</h3>

      case 'PARAGRAPH':
        return <p className="text-sm text-gray-600 leading-relaxed">{field.placeholder || field.label}</p>

      case 'DIVIDER':
        return <hr className="border-gray-200" />

      default:
        return <Input className={inputClass} placeholder={field.placeholder} value={String(value || '')} onChange={e => onChange(e.target.value)} />
    }
  }

  const isLayout = ['HEADING', 'PARAGRAPH', 'DIVIDER'].includes(field.fieldType)

  return (
    <div className={cn(
      field.width === 'HALF' ? 'col-span-1' : 'col-span-2',
      'space-y-1.5'
    )}>
      {!isLayout && (
        <div className="flex items-center gap-1.5">
          <Label htmlFor={field.id} className="text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.infoButton?.title && <InfoButton button={field.infoButton} />}
        </div>
      )}
      {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}

      {renderInput()}

      {error && (
        <div className="flex items-center gap-1.5 text-red-600">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="text-xs">{error}</span>
        </div>
      )}
    </div>
  )
}
