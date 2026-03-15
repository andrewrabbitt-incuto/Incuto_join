'use client'

import { useState } from 'react'
import {
  SortableContext, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { FormSectionDef, FormFieldDef } from '@/types'
import { SortableField } from './SortableField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  GripVertical, ChevronDown, ChevronUp, Trash2,
  Plus, Settings2, HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { v4 as uuid } from 'uuid'

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

  const { setNodeRef: droppableRef, isOver } = useDroppable({
    id: `section-${section.id}`,
    data: { type: 'SECTION', sectionId: section.id },
  })

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
