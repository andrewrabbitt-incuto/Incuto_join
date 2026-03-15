'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FormFieldDef } from '@/types'
import { cn } from '@/lib/utils'
import {
  GripVertical, Trash2, Copy, Settings2,
  Eye, EyeOff, Info, HelpCircle
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { FIELD_PALETTE } from '@/lib/field-palette'
import { Badge } from '@/components/ui/badge'

interface SortableFieldProps {
  field: FormFieldDef
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
}

const widthClasses: Record<string, string> = {
  FULL: 'col-span-12',
  HALF: 'col-span-6',
  THIRD: 'col-span-4',
  TWO_THIRDS: 'col-span-8',
}

function FieldPreview({ field }: { field: FormFieldDef }) {
  switch (field.fieldType) {
    case 'TEXT':
    case 'EMAIL':
    case 'PHONE':
    case 'NATIONAL_INSURANCE':
    case 'SORT_CODE':
    case 'ACCOUNT_NUMBER':
      return <div className="h-8 rounded border border-gray-200 bg-gray-50 px-2 flex items-center text-xs text-gray-400">{field.placeholder || 'Enter text…'}</div>
    case 'DATE':
      return <div className="h-8 rounded border border-gray-200 bg-gray-50 px-2 flex items-center text-xs text-gray-400">DD/MM/YYYY</div>
    case 'NUMBER':
    case 'LOAN_AMOUNT':
      return <div className="h-8 rounded border border-gray-200 bg-gray-50 px-2 flex items-center text-xs text-gray-400">0</div>
    case 'SELECT':
    case 'COMMON_BOND_SELECTOR':
    case 'LOAN_PURPOSE':
    case 'LOAN_TERM':
      return <div className="h-8 rounded border border-gray-200 bg-gray-50 px-2 flex items-center justify-between text-xs text-gray-400"><span>Select option</span><span>▾</span></div>
    case 'RADIO':
    case 'PRODUCT_SELECTOR':
    case 'MEMBER_TYPE_SELECTOR':
      return (
        <div className="space-y-1">
          {(field.options || [{ label: 'Option 1', value: '1' }, { label: 'Option 2', value: '2' }]).slice(0, 3).map(opt => (
            <div key={opt.value} className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
              {opt.label}
            </div>
          ))}
        </div>
      )
    case 'CHECKBOX':
    case 'CONSENT':
    case 'DECLARATION':
      return <div className="flex items-center gap-2 text-xs text-gray-500"><div className="w-3 h-3 rounded border-2 border-gray-300" />{field.label}</div>
    case 'TEXTAREA':
      return <div className="h-16 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-400">{field.placeholder || 'Enter text…'}</div>
    case 'HEADING':
      return <div className="text-base font-bold text-gray-700">{field.label}</div>
    case 'PARAGRAPH':
      return <div className="text-xs text-gray-500 leading-relaxed">{field.placeholder || 'Paragraph text…'}</div>
    case 'DIVIDER':
      return <hr className="border-gray-200" />
    case 'ADDRESS_LOOKUP':
      return (
        <div className="space-y-1">
          <div className="h-8 rounded border border-gray-200 bg-gray-50 px-2 flex items-center justify-between text-xs text-gray-400"><span>Enter postcode</span><span className="text-blue-400 text-[10px]">Find address</span></div>
        </div>
      )
    case 'FILE_UPLOAD':
    case 'ID_UPLOAD':
      return <div className="h-12 rounded border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">Click to upload or drag &amp; drop</div>
    case 'SIGNATURE':
      return <div className="h-16 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400 italic">Sign here</div>
    default:
      return <div className="h-8 rounded border border-gray-200 bg-gray-50" />
  }
}

export function SortableField({ field, isSelected, onSelect, onDelete, onDuplicate }: SortableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: { type: 'FIELD', field },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const paletteItem = FIELD_PALETTE.find(p => p.type === field.fieldType)
  const hasConditions = field.conditions && field.conditions.length > 0
  const isLayoutField = ['HEADING', 'PARAGRAPH', 'DIVIDER'].includes(field.fieldType)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        widthClasses[field.width] || 'col-span-12',
        'group relative',
        isDragging && 'opacity-40 z-50'
      )}
    >
      <div
        onClick={onSelect}
        className={cn(
          'relative rounded-lg border-2 p-3 cursor-pointer transition-all',
          isSelected
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-transparent hover:border-gray-300 bg-white hover:bg-gray-50',
          field.isSystemField && 'border-l-4 border-l-orange-400'
        )}
      >
        {/* Drag handle + controls */}
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="drag-handle p-1 rounded text-gray-400" {...listeners} {...attributes}>
            <GripVertical className="w-4 h-4" />
          </div>
        </div>

        <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
          {hasConditions && (
            <Badge variant="info" className="text-[9px] px-1 py-0 h-4">
              <EyeOff className="w-2 h-2 mr-0.5" /> conditional
            </Badge>
          )}
          {field.isSystemField && (
            <Badge variant="warning" className="text-[9px] px-1 py-0 h-4">required</Badge>
          )}
          <button onClick={e => { e.stopPropagation(); onDuplicate() }} className="p-1 rounded hover:bg-gray-200 text-gray-500">
            <Copy className="w-3 h-3" />
          </button>
          {!field.isSystemField && (
            <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 rounded hover:bg-red-100 text-gray-500 hover:text-red-600">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Label */}
        {!isLayoutField && field.fieldType !== 'DIVIDER' && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-xs font-medium text-gray-700">{field.label}</span>
            {field.required && <span className="text-red-500 text-xs">*</span>}
            {field.infoButton?.title && (
              <HelpCircle className="w-3 h-3 text-gray-400" />
            )}
          </div>
        )}
        {field.helpText && <p className="text-[10px] text-gray-400 mb-1.5">{field.helpText}</p>}

        {/* Preview */}
        <FieldPreview field={field} />
      </div>
    </div>
  )
}
