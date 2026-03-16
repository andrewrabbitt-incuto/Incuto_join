'use client'

import { useState, useCallback } from 'react'
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverEvent,
  PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay,
  closestCenter
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, arrayMove
} from '@dnd-kit/sortable'
import type { FormDef, FormSectionDef, FormFieldDef, FieldType } from '@/types'
import { FieldPalette } from './FieldPalette'
import { SectionEditor } from './SectionEditor'
import { FieldEditor } from './FieldEditor'
import { AIAssistant } from './AIAssistant'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Save, Eye, Globe, Settings, Plus, Loader2,
  ChevronLeft, LayoutTemplate
} from 'lucide-react'
import { v4 as uuid } from 'uuid'
import { FIELD_PALETTE } from '@/lib/field-palette'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface FormBuilderProps {
  form: FormDef
}

export function FormBuilder({ form: initialForm }: FormBuilderProps) {
  const [form, setForm] = useState<FormDef>(initialForm)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [activeTab, setActiveTab] = useState('builder')
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  // Get the selected field
  const selectedField = form.sections
    .flatMap(s => s.fields)
    .find(f => f.id === selectedFieldId) || null

  const allFields = form.sections.flatMap(s => s.fields)

  // Add a section
  const addSection = useCallback(() => {
    const newSection: FormSectionDef = {
      id: uuid(),
      formId: form.id,
      title: `Section ${form.sections.length + 1}`,
      order: form.sections.length,
      fields: [],
    }
    setForm(f => ({ ...f, sections: [...f.sections, newSection] }))
  }, [form])

  // Update a section
  const updateSection = useCallback((sectionId: string, updates: Partial<FormSectionDef>) => {
    setForm(f => ({
      ...f,
      sections: f.sections.map(s => s.id === sectionId ? { ...s, ...updates } : s)
    }))
  }, [])

  // Delete a section
  const deleteSection = useCallback((sectionId: string) => {
    setForm(f => ({ ...f, sections: f.sections.filter(s => s.id !== sectionId) }))
  }, [])

  // Update a field
  const updateField = useCallback((fieldId: string, updates: Partial<FormFieldDef>) => {
    setForm(f => ({
      ...f,
      sections: f.sections.map(s => ({
        ...s,
        fields: s.fields.map(field => field.id === fieldId ? { ...field, ...updates } : field)
      }))
    }))
  }, [])

  // Delete a field
  const deleteField = useCallback((fieldId: string) => {
    setForm(f => ({
      ...f,
      sections: f.sections.map(s => ({
        ...s,
        fields: s.fields.filter(field => field.id !== fieldId)
      }))
    }))
    if (selectedFieldId === fieldId) setSelectedFieldId(null)
  }, [selectedFieldId])

  // Duplicate a field
  const duplicateField = useCallback((fieldId: string) => {
    setForm(f => ({
      ...f,
      sections: f.sections.map(s => {
        const idx = s.fields.findIndex(field => field.id === fieldId)
        if (idx === -1) return s
        const original = s.fields[idx]
        const copy: FormFieldDef = {
          ...original,
          id: uuid(),
          fieldKey: `${original.fieldKey}_copy_${Date.now()}`,
          isSystemField: false,
          order: idx + 1,
        }
        const newFields = [...s.fields]
        newFields.splice(idx + 1, 0, copy)
        return { ...s, fields: newFields }
      })
    }))
  }, [])

  // Add a field from palette to a section
  const addFieldToSection = useCallback((fieldType: FieldType, sectionId: string) => {
    const paletteItem = FIELD_PALETTE.find(p => p.type === fieldType)
    if (!paletteItem) return

    const section = form.sections.find(s => s.id === sectionId)
    const newField: FormFieldDef = {
      id: uuid(),
      sectionId,
      fieldKey: `${fieldType.toLowerCase()}_${Date.now()}`,
      fieldType,
      label: paletteItem.defaultLabel,
      required: false,
      order: section?.fields.length || 0,
      width: 'FULL',
      isSystemField: paletteItem.isSystemField,
    }

    setForm(f => ({
      ...f,
      sections: f.sections.map(s =>
        s.id === sectionId
          ? { ...s, fields: [...s.fields, newField] }
          : s
      )
    }))
    setSelectedFieldId(newField.id)
  }, [form.sections])

  // Drag and drop handling
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    // Dragging from palette to section
    if (activeData?.type === 'PALETTE_ITEM') {
      const fieldType = activeData.fieldType as FieldType
      // Find target section
      let targetSectionId = ''
      if (overData?.type === 'SECTION') {
        targetSectionId = overData.sectionId
      } else if (overData?.type === 'FIELD') {
        targetSectionId = overData.field.sectionId
      } else {
        // Drop on section container
        const sectionId = String(over.id).replace('section-', '')
        const section = form.sections.find(s => s.id === sectionId)
        if (section) targetSectionId = sectionId
      }
      if (targetSectionId) {
        addFieldToSection(fieldType, targetSectionId)
      } else if (form.sections.length > 0) {
        addFieldToSection(fieldType, form.sections[form.sections.length - 1].id)
      }
      return
    }

    // Reordering fields within a section
    if (activeData?.type === 'FIELD' && overData?.type === 'FIELD') {
      const activeField = activeData.field as FormFieldDef
      const overField = overData.field as FormFieldDef

      if (activeField.sectionId === overField.sectionId) {
        setForm(f => ({
          ...f,
          sections: f.sections.map(s => {
            if (s.id !== activeField.sectionId) return s
            const oldIdx = s.fields.findIndex(f => f.id === activeField.id)
            const newIdx = s.fields.findIndex(f => f.id === overField.id)
            return { ...s, fields: arrayMove(s.fields, oldIdx, newIdx) }
          })
        }))
      }
    }
  }, [form.sections, addFieldToSection])

  // AI assistant action handler
  const handleAIAction = useCallback((action: { type: string; payload: unknown; label: string }) => {
    if (action.type === 'ADD_SECTION') {
      const payload = action.payload as Partial<FormSectionDef> & { fields?: Partial<FormFieldDef>[] }
      const newSection: FormSectionDef = {
        id: uuid(),
        formId: form.id,
        title: payload.title || 'New Section',
        description: payload.description,
        order: form.sections.length,
        fields: [],
      }
      const newFields: FormFieldDef[] = (payload.fields || []).map((f, i) => ({
        id: uuid(),
        sectionId: newSection.id,
        fieldKey: f.fieldKey || `field_${Date.now()}_${i}`,
        fieldType: f.fieldType || 'TEXT',
        label: f.label || 'Field',
        required: f.required ?? false,
        order: i,
        width: f.width || 'FULL',
        options: f.options,
        incutoFieldKey: f.incutoFieldKey,
        isSystemField: f.isSystemField,
      }))
      newSection.fields = newFields

      setForm(f => ({ ...f, sections: [...f.sections, newSection] }))
      toast({ title: 'Section added!', description: `"${newSection.title}" was added to your form.` })
    }
  }, [form, toast])

  // Save form
  async function saveForm() {
    setSaving(true)
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: form.sections }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Saved!', variant: 'default' })
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Publish form
  async function publishForm() {
    setPublishing(true)
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      })
      if (!res.ok) throw new Error()
      setForm(f => ({ ...f, status: 'PUBLISHED' }))
      toast({ title: 'Form published!', description: `Available at /form/${form.slug}`, variant: 'default' })
    } catch {
      toast({ title: 'Publish failed', variant: 'destructive' })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href="/forms">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold truncate max-w-xs">{form.name}</h1>
            <Badge variant={form.status === 'PUBLISHED' ? 'success' : 'secondary'} className="text-xs">
              {form.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-400">/form/{form.slug}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-8">
            <TabsTrigger value="builder" className="text-xs h-6 px-3">Builder</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs h-6 px-3">Settings</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs h-6 px-3">Preview</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveForm} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Save
          </Button>
          {form.status !== 'PUBLISHED' ? (
            <Button size="sm" onClick={publishForm} disabled={publishing}>
              {publishing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Globe className="w-4 h-4 mr-1" />}
              Publish
            </Button>
          ) : (
            <Link href={`/form/${form.slug}`} target="_blank">
              <Button size="sm" variant="outline">
                <Eye className="w-4 h-4 mr-1" /> View Live
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Builder */}
      {activeTab === 'builder' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Field palette */}
            <FieldPalette />

            {/* Center: Canvas */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto">
                {form.sections.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                    <LayoutTemplate className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-500 mb-2">Start building your form</h3>
                    <p className="text-gray-400 mb-4">Add a section to begin, then drag fields from the left panel</p>
                    <Button onClick={addSection}>
                      <Plus className="w-4 h-4 mr-2" />Add First Section
                    </Button>
                  </div>
                ) : (
                  <>
                    <SortableContext items={form.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                      {form.sections.map(section => (
                        <SectionEditor
                          key={section.id}
                          section={section}
                          selectedFieldId={selectedFieldId}
                          onSelectField={setSelectedFieldId}
                          onUpdateSection={updates => updateSection(section.id, updates)}
                          onDeleteSection={() => deleteSection(section.id)}
                          onUpdateField={updateField}
                          onDeleteField={deleteField}
                          onDuplicateField={duplicateField}
                        />
                      ))}
                    </SortableContext>
                    <Button variant="outline" onClick={addSection} className="w-full mt-2 border-dashed">
                      <Plus className="w-4 h-4 mr-2" />Add Section
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Right: Field editor */}
            {selectedField && (
              <FieldEditor
                field={selectedField}
                allFields={allFields}
                onChange={updates => updateField(selectedField.id, updates)}
                onClose={() => setSelectedFieldId(null)}
              />
            )}
          </div>
        </DndContext>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Form Settings</h2>
            <p className="text-gray-500 text-sm">Configure form settings, branding and integrations…</p>
            <div className="mt-4 grid gap-4">
              <Link href="/branding">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />Branding &amp; Theme
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Preview tab */}
      {activeTab === 'preview' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border p-8">
              <h2 className="text-xl font-bold mb-6">{form.name}</h2>
              {form.sections.map(section => (
                <div key={section.id} className="mb-8">
                  <h3 className="text-lg font-semibold mb-1">{section.title}</h3>
                  {section.description && <p className="text-sm text-gray-500 mb-4">{section.description}</p>}
                  <div className="grid grid-cols-12 gap-4">
                    {section.fields.map(field => (
                      <div key={field.id} className={field.width === 'HALF' ? 'col-span-6' : 'col-span-12'}>
                        <label className="text-sm font-medium text-gray-700">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                        {field.helpText && <p className="text-xs text-gray-400 mt-0.5">{field.helpText}</p>}
                        <div className="mt-1 h-10 rounded-md border border-gray-300 bg-gray-50" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant */}
      <AIAssistant formId={form.id} onApplyAction={handleAIAction} />
    </div>
  )
}
