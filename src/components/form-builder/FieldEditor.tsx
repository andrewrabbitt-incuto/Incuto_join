'use client'

import { useState } from 'react'
import type { FormFieldDef, FieldCondition, FieldOption } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { X, Plus, GripVertical, Trash2, Info } from 'lucide-react'
import { v4 as uuid } from 'uuid'

interface FieldEditorProps {
  field: FormFieldDef
  allFields: FormFieldDef[]
  onChange: (updates: Partial<FormFieldDef>) => void
  onClose: () => void
}

const HAS_OPTIONS = ['SELECT', 'MULTI_SELECT', 'RADIO', 'CHECKBOX']
const HAS_CONDITIONS = true

export function FieldEditor({ field, allFields, onChange, onClose }: FieldEditorProps) {
  const [newOption, setNewOption] = useState('')

  const addOption = () => {
    if (!newOption.trim()) return
    const options = [...(field.options || []), { label: newOption, value: newOption.toLowerCase().replace(/\s+/g, '_') }]
    onChange({ options })
    setNewOption('')
  }

  const removeOption = (idx: number) => {
    const options = field.options?.filter((_, i) => i !== idx) || []
    onChange({ options })
  }

  const addCondition = () => {
    const condition: FieldCondition = {
      id: uuid(),
      fieldKey: '',
      operator: 'equals',
      value: '',
      logic: 'AND',
    }
    onChange({ conditions: [...(field.conditions || []), condition] })
  }

  const updateCondition = (idx: number, updates: Partial<FieldCondition>) => {
    const conditions = (field.conditions || []).map((c, i) => i === idx ? { ...c, ...updates } : c)
    onChange({ conditions })
  }

  const removeCondition = (idx: number) => {
    onChange({ conditions: (field.conditions || []).filter((_, i) => i !== idx) })
  }

  const otherFields = allFields.filter(f => f.fieldKey !== field.fieldKey)

  return (
    <div className="w-80 border-l bg-white flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold text-sm">Edit Field</h3>
          <p className="text-xs text-gray-400">{field.fieldType}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="properties">
          <TabsList className="w-full rounded-none border-b h-9">
            <TabsTrigger value="properties" className="flex-1 text-xs">Properties</TabsTrigger>
            <TabsTrigger value="validation" className="flex-1 text-xs">Validation</TabsTrigger>
            <TabsTrigger value="logic" className="flex-1 text-xs">Logic</TabsTrigger>
            <TabsTrigger value="help" className="flex-1 text-xs">Help</TabsTrigger>
          </TabsList>

          {/* PROPERTIES TAB */}
          <TabsContent value="properties" className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Label *</Label>
              <Input value={field.label} onChange={e => onChange({ label: e.target.value })} className="h-8 text-xs" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Field Key</Label>
              <Input
                value={field.fieldKey}
                onChange={e => onChange({ fieldKey: e.target.value })}
                className="h-8 text-xs font-mono"
                placeholder="e.g. first_name"
                disabled={field.isSystemField}
              />
            </div>

            {!['HEADING', 'PARAGRAPH', 'DIVIDER'].includes(field.fieldType) && (
              <div className="space-y-2">
                <Label className="text-xs">Placeholder</Label>
                <Input value={field.placeholder || ''} onChange={e => onChange({ placeholder: e.target.value })} className="h-8 text-xs" />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs">Help Text</Label>
              <Textarea value={field.helpText || ''} onChange={e => onChange({ helpText: e.target.value })} rows={2} className="text-xs" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Width</Label>
              <Select value={field.width} onValueChange={v => onChange({ width: v as FormFieldDef['width'] })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL">Full width</SelectItem>
                  <SelectItem value="HALF">Half width</SelectItem>
                  <SelectItem value="THIRD">One third</SelectItem>
                  <SelectItem value="TWO_THIRDS">Two thirds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Required</Label>
              <Switch
                checked={field.required}
                onCheckedChange={v => onChange({ required: v })}
                disabled={field.isSystemField}
              />
            </div>

            {/* Incuto field mapping */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                Incuto Field Key
                <Info className="w-3 h-3 text-gray-400" />
              </Label>
              <Input
                value={field.incutoFieldKey || ''}
                onChange={e => onChange({ incutoFieldKey: e.target.value })}
                className="h-8 text-xs font-mono"
                placeholder="e.g. firstName"
              />
            </div>

            {/* Options for select/radio/checkbox */}
            {HAS_OPTIONS.includes(field.fieldType) && (
              <div className="space-y-2">
                <Label className="text-xs">Options</Label>
                <div className="space-y-1.5">
                  {(field.options || []).map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <GripVertical className="w-3 h-3 text-gray-300" />
                      <Input value={opt.label} onChange={e => {
                        const options = [...(field.options || [])]
                        options[idx] = { ...options[idx], label: e.target.value }
                        onChange({ options })
                      }} className="flex-1 h-7 text-xs" />
                      <button onClick={() => removeOption(idx)} className="text-gray-400 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={newOption}
                    onChange={e => setNewOption(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())}
                    placeholder="Add option…"
                    className="h-7 text-xs flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={addOption} className="h-7 text-xs">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* VALIDATION TAB */}
          <TabsContent value="validation" className="p-4 space-y-4">
            {['TEXT', 'TEXTAREA', 'EMAIL', 'PHONE'].includes(field.fieldType) && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Min Length</Label>
                    <Input
                      type="number"
                      value={field.validation?.minLength || ''}
                      onChange={e => onChange({ validation: { ...field.validation, minLength: Number(e.target.value) } })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max Length</Label>
                    <Input
                      type="number"
                      value={field.validation?.maxLength || ''}
                      onChange={e => onChange({ validation: { ...field.validation, maxLength: Number(e.target.value) } })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pattern (regex)</Label>
                  <Input
                    value={field.validation?.pattern || ''}
                    onChange={e => onChange({ validation: { ...field.validation, pattern: e.target.value } })}
                    className="h-8 text-xs font-mono"
                    placeholder="e.g. ^[A-Z]{1,2}\d{1,2}.*"
                  />
                </div>
              </>
            )}
            {field.fieldType === 'NUMBER' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Min Value</Label>
                  <Input type="number" value={field.validation?.min || ''} onChange={e => onChange({ validation: { ...field.validation, min: Number(e.target.value) } })} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Value</Label>
                  <Input type="number" value={field.validation?.max || ''} onChange={e => onChange({ validation: { ...field.validation, max: Number(e.target.value) } })} className="h-8 text-xs" />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Custom Error Message</Label>
              <Input
                value={field.validation?.message || ''}
                onChange={e => onChange({ validation: { ...field.validation, message: e.target.value } })}
                className="h-8 text-xs"
                placeholder="Please enter a valid value"
              />
            </div>
          </TabsContent>

          {/* LOGIC TAB */}
          <TabsContent value="logic" className="p-4 space-y-4">
            <p className="text-xs text-gray-500">Show this field only when these conditions are met:</p>
            {(field.conditions || []).map((cond, idx) => (
              <div key={cond.id} className="space-y-2 p-3 bg-gray-50 rounded-lg border">
                {idx > 0 && (
                  <Select value={cond.logic || 'AND'} onValueChange={v => updateCondition(idx, { logic: v as 'AND' | 'OR' })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {/* Source selector: form field vs trigger context */}
                <Select
                  value={cond.source ?? 'form'}
                  onValueChange={v => updateCondition(idx, { source: v as 'form' | 'context', fieldKey: '' })}
                >
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="form">Form field value</SelectItem>
                    <SelectItem value="context">Trigger result (credit/quotation)</SelectItem>
                  </SelectContent>
                </Select>
                {(cond.source ?? 'form') === 'context' ? (
                  <div className="space-y-1">
                    <Input
                      value={cond.fieldKey}
                      onChange={e => updateCondition(idx, { fieldKey: e.target.value })}
                      className="h-7 text-xs font-mono"
                      placeholder="e.g. credit_result.tier"
                    />
                    <p className="text-[10px] text-gray-400">
                      Dot-path into trigger context — e.g. <code>credit_result.decision</code>, <code>quotation_result.bestRate</code>
                    </p>
                  </div>
                ) : (
                <Select value={cond.fieldKey} onValueChange={v => updateCondition(idx, { fieldKey: v })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select field…" /></SelectTrigger>
                  <SelectContent>
                    {otherFields.map(f => (
                      <SelectItem key={f.fieldKey} value={f.fieldKey}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                )}
                <Select value={cond.operator} onValueChange={v => updateCondition(idx, { operator: v as FieldCondition['operator'] })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">equals</SelectItem>
                    <SelectItem value="not_equals">does not equal</SelectItem>
                    <SelectItem value="contains">contains</SelectItem>
                    <SelectItem value="greater_than">is greater than</SelectItem>
                    <SelectItem value="less_than">is less than</SelectItem>
                    <SelectItem value="is_empty">is empty</SelectItem>
                    <SelectItem value="is_not_empty">is not empty</SelectItem>
                  </SelectContent>
                </Select>
                {!['is_empty', 'is_not_empty'].includes(cond.operator) && (
                  <Input
                    value={String(cond.value)}
                    onChange={e => updateCondition(idx, { value: e.target.value })}
                    className="h-7 text-xs"
                    placeholder="Value…"
                  />
                )}
                <Button variant="ghost" size="sm" onClick={() => removeCondition(idx)} className="h-7 text-xs text-red-500">
                  <Trash2 className="w-3 h-3 mr-1" />Remove
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addCondition} className="w-full text-xs h-8">
              <Plus className="w-3 h-3 mr-1" />Add Condition
            </Button>
          </TabsContent>

          {/* HELP TAB */}
          <TabsContent value="help" className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Info Button Title</Label>
              <Input
                value={field.infoButton?.title || ''}
                onChange={e => onChange({ infoButton: { ...field.infoButton, title: e.target.value, content: field.infoButton?.content || '', type: field.infoButton?.type || 'tooltip' } })}
                className="h-8 text-xs"
                placeholder="e.g. Why do we need this?"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Info Button Content</Label>
              <Textarea
                value={field.infoButton?.content || ''}
                onChange={e => onChange({ infoButton: { ...field.infoButton, content: e.target.value, title: field.infoButton?.title || '', type: field.infoButton?.type || 'tooltip' } })}
                rows={4}
                className="text-xs"
                placeholder="Explanation shown when member clicks the info button…"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Display Type</Label>
              <Select
                value={field.infoButton?.type || 'tooltip'}
                onValueChange={v => onChange({ infoButton: { ...field.infoButton, type: v as 'tooltip' | 'modal' | 'drawer', title: field.infoButton?.title || '', content: field.infoButton?.content || '' } })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tooltip">Tooltip (hover)</SelectItem>
                  <SelectItem value="modal">Modal (click)</SelectItem>
                  <SelectItem value="drawer">Side Drawer (click)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
