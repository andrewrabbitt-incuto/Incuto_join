'use client'

import { useState } from 'react'
import {
  SortableContext, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import type { FormSectionDef, FormFieldDef, SectionTrigger, TriggerType } from '@/types'
import { SortableField } from './SortableField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  GripVertical, ChevronDown, ChevronUp, Trash2,
  Plus, Zap, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { v4 as uuid } from 'uuid'

const TRIGGER_LABELS: Record<TriggerType, string> = {
  CREDIT_SEARCH: 'Credit Search',
  QUOTATION: 'Quotation',
  OPEN_BANKING: 'Open Banking',
  WEBHOOK: 'Custom Webhook',
}

const TRIGGER_DESCRIPTIONS: Record<TriggerType, string> = {
  CREDIT_SEARCH: 'Run a soft credit search and store the result in form context',
  QUOTATION: 'Fetch loan quotation offers based on the requested amount and term',
  OPEN_BANKING: 'Initiate an open banking affordability check',
  WEBHOOK: 'Call a custom URL and store the JSON response in form context',
}

interface SectionEditorProps {
  section: FormSectionDef
  selectedFieldId: string | null
  onSelectField: (fieldId: string | null) => void
  onUpdateSection: (updates: Partial<FormSectionDef>) => void
  onDeleteSection: () => void
  onUpdateField: (fieldId: string, updates: Partial<FormFieldDef>) => void
  onDeleteField: (fieldId: string) => void
  onDuplicateField: (fieldId: string) => void
  isDragDisabled?: boolean
}

export function SectionEditor({
  section,
  selectedFieldId,
  onSelectField,
  onUpdateSection,
  onDeleteSection,
  onUpdateField,
  onDeleteField,
  onDuplicateField,
}: SectionEditorProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [showTriggers, setShowTriggers] = useState(false)

  const { setNodeRef: droppableRef, isOver } = useDroppable({
    id: `section-${section.id}`,
    data: { type: 'SECTION', sectionId: section.id },
  })

  const triggers = section.triggers ?? []

  function addTrigger() {
    const trigger: SectionTrigger = {
      id: uuid(),
      name: 'Credit Search',
      triggerType: 'CREDIT_SEARCH',
      contextKey: 'credit_result',
      fieldMappings: [],
      fireOn: 'SECTION_COMPLETE',
      loadingMessage: 'Running a credit check…',
    }
    onUpdateSection({ triggers: [...triggers, trigger] })
  }

  function updateTrigger(triggerId: string, updates: Partial<SectionTrigger>) {
    onUpdateSection({
      triggers: triggers.map(t => t.id === triggerId ? { ...t, ...updates } : t)
    })
  }

  function removeTrigger(triggerId: string) {
    onUpdateSection({ triggers: triggers.filter(t => t.id !== triggerId) })
  }

  return (
    <div className="border rounded-xl bg-white mb-4 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b">
        <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />

        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <Input
              value={section.title}
              onChange={e => onUpdateSection({ title: e.target.value })}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
              autoFocus
              className="h-7 text-sm font-semibold"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-sm font-semibold text-gray-800 hover:text-blue-600 text-left truncate w-full"
            >
              {section.title || 'Untitled Section'}
            </button>
          )}
          {section.description && (
            <p className="text-xs text-gray-400 truncate">{section.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">{section.fields.length} fields</span>
          {triggers.length > 0 && (
            <Badge variant="warning" className="text-xs gap-1 px-1.5">
              <Zap className="w-3 h-3" />{triggers.length}
            </Badge>
          )}
          <Button
            variant="ghost" size="icon" className="h-7 w-7 text-amber-500 hover:text-amber-700"
            onClick={() => setShowTriggers(v => !v)}
            title="Configure triggers"
          >
            <Zap className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={onDeleteSection}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Section description & help */}
      {!collapsed && (
        <div className="px-4 pt-3 pb-1 space-y-2">
          <Textarea
            value={section.description || ''}
            onChange={e => onUpdateSection({ description: e.target.value })}
            placeholder="Section description (shown to member)…"
            rows={1}
            className="text-xs resize-none border-dashed"
          />
          <Input
            value={section.helpText || ''}
            onChange={e => onUpdateSection({ helpText: e.target.value })}
            placeholder="Help text / instructions…"
            className="text-xs border-dashed"
          />
        </div>
      )}

      {/* ─── Triggers panel ─────────────────────────────────── */}
      {showTriggers && (
        <div className="border-t border-dashed border-amber-200 bg-amber-50 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-800">
                Triggers — fire when this section completes
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={addTrigger} className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100">
              <Plus className="w-3 h-3 mr-1" />Add Trigger
            </Button>
          </div>

          {triggers.length === 0 && (
            <p className="text-xs text-amber-600">
              No triggers configured. Add a trigger to run a credit search, quotation, or open banking check
              after the applicant completes this section. Results are stored in form context and can be
              referenced in show/hide conditions on any subsequent field or section.
            </p>
          )}

          {triggers.map(trigger => (
            <div key={trigger.id} className="bg-white rounded-lg border border-amber-200 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="text-xs font-medium text-gray-700">{trigger.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500" onClick={() => removeTrigger(trigger.id)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Trigger Name</Label>
                  <Input
                    value={trigger.name}
                    onChange={e => updateTrigger(trigger.id, { name: e.target.value })}
                    className="h-7 text-xs"
                    placeholder="e.g. Credit Check"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Context Key</Label>
                  <Input
                    value={trigger.contextKey}
                    onChange={e => updateTrigger(trigger.id, { contextKey: e.target.value })}
                    className="h-7 text-xs font-mono"
                    placeholder="e.g. credit_result"
                  />
                  <p className="text-[10px] text-gray-400">Reference in conditions as <code>{trigger.contextKey}.score</code></p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select
                  value={trigger.triggerType}
                  onValueChange={v => updateTrigger(trigger.id, { triggerType: v as TriggerType })}
                >
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map(t => (
                      <SelectItem key={t} value={t}>
                        <div>
                          <div className="font-medium">{TRIGGER_LABELS[t]}</div>
                          <div className="text-xs text-gray-400">{TRIGGER_DESCRIPTIONS[t]}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {trigger.triggerType === 'WEBHOOK' && (
                <div className="space-y-1">
                  <Label className="text-xs">Webhook URL</Label>
                  <Input
                    value={trigger.endpoint || ''}
                    onChange={e => updateTrigger(trigger.id, { endpoint: e.target.value })}
                    className="h-7 text-xs"
                    placeholder="https://…"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Loading message (shown to applicant)</Label>
                <Input
                  value={trigger.loadingMessage || ''}
                  onChange={e => updateTrigger(trigger.id, { loadingMessage: e.target.value })}
                  className="h-7 text-xs"
                  placeholder="e.g. Running a credit check…"
                />
              </div>

              {/* Context reference card */}
              <div className="bg-gray-50 rounded p-2 border text-[10px] text-gray-500 font-mono space-y-0.5">
                <p className="font-semibold text-gray-600 not-italic text-[10px]">Available context paths after this trigger:</p>
                {trigger.triggerType === 'CREDIT_SEARCH' && <>
                  <p>{trigger.contextKey}.score — numeric credit score</p>
                  <p>{trigger.contextKey}.decision — ACCEPT | DECLINE | REFER</p>
                  <p>{trigger.contextKey}.tier — A | B | C | D</p>
                  <p>{trigger.contextKey}.maxLoanAmount — maximum eligible amount</p>
                </>}
                {trigger.triggerType === 'QUOTATION' && <>
                  <p>{trigger.contextKey}.bestRate — best available rate (%)</p>
                  <p>{trigger.contextKey}.maxAmount — maximum loan amount</p>
                  <p>{trigger.contextKey}.offers[0].productId — first offer product ID</p>
                  <p>{trigger.contextKey}.offers[0].productName — product name</p>
                  <p>{trigger.contextKey}.offers[0].apr — APR (%)</p>
                </>}
                {trigger.triggerType === 'OPEN_BANKING' && <>
                  <p>{trigger.contextKey}.affordability.decision — PASS | FAIL</p>
                  <p>{trigger.contextKey}.affordability.monthlyIncome</p>
                  <p>{trigger.contextKey}.affordability.disposable</p>
                </>}
                {trigger.triggerType === 'WEBHOOK' && <>
                  <p>{trigger.contextKey}.* — any field from the webhook JSON response</p>
                </>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fields drop zone */}
      {!collapsed && (
        <div
          ref={droppableRef}
          className={cn(
            'p-4 min-h-[80px] transition-colors',
            isOver && 'bg-blue-50 ring-2 ring-blue-300 ring-inset rounded-lg'
          )}
        >
          {section.fields.length === 0 ? (
            <div className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
              isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
            )}>
              <Plus className="w-6 h-6 mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-400">Drag fields here from the left panel</p>
            </div>
          ) : (
            <SortableContext items={section.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-12 gap-3 pl-6">
                {section.fields.map(field => (
                  <SortableField
                    key={field.id}
                    field={field}
                    isSelected={selectedFieldId === field.id}
                    onSelect={() => onSelectField(field.id)}
                    onDelete={() => onDeleteField(field.id)}
                    onDuplicate={() => onDuplicateField(field.id)}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      )}
    </div>
  )
}
