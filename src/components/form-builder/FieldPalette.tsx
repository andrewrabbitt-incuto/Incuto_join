'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { FIELD_PALETTE, FIELD_CATEGORIES } from '@/lib/field-palette'
import type { FieldType } from '@/types'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaletteFieldProps {
  type: FieldType
  label: string
  icon: string
  description: string
}

function DraggablePaletteField({ type, label, icon, description }: PaletteFieldProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type: 'PALETTE_ITEM', fieldType: type },
  })

  const IconComponent = (Icons as unknown as Record<string, React.FC<React.SVGProps<SVGSVGElement>>>)[icon]

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-white cursor-grab hover:border-blue-400 hover:bg-blue-50 transition-colors select-none',
        isDragging && 'opacity-40 cursor-grabbing'
      )}
    >
      <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
        {IconComponent && <IconComponent className="w-4 h-4 text-blue-600" />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-800 truncate">{label}</p>
        <p className="text-xs text-gray-400 truncate">{description}</p>
      </div>
    </div>
  )
}

export function FieldPalette() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = FIELD_PALETTE.filter(f => {
    const matchesSearch = !search || f.label.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !activeCategory || f.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="w-64 border-r bg-gray-50 flex flex-col h-full">
      <div className="p-4 border-b bg-white">
        <h3 className="font-semibold text-sm mb-3">Field Types</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Search fields…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-white">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            'px-2 py-1 rounded text-xs font-medium transition-colors',
            !activeCategory ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
          )}
        >
          All
        </button>
        {FIELD_CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
            className={cn(
              'px-2 py-1 rounded text-xs font-medium transition-colors',
              activeCategory === cat.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            {cat.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Field list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {FIELD_CATEGORIES.filter(cat => !activeCategory || cat.key === activeCategory).map(cat => {
          const catFields = filtered.filter(f => f.category === cat.key)
          if (catFields.length === 0) return null
          return (
            <div key={cat.key}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-0.5">
                {cat.label}
              </p>
              <div className="space-y-1">
                {catFields.map(field => (
                  <DraggablePaletteField
                    key={field.type}
                    type={field.type}
                    label={field.label}
                    icon={field.icon}
                    description={field.description}
                  />
                ))}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-xs text-gray-400">
            No fields match your search
          </div>
        )}
      </div>
    </div>
  )
}
