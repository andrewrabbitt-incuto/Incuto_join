'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  BackgroundVariant,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nanoid } from 'nanoid'
import {
  Save, Plus, Play, FileText, ShieldCheck, Search, GitBranch,
  CheckCircle2, XCircle, Loader2, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  StartNode, FormNode, IdCheckNode, CreditCheckNode, ConditionNode, EndNode,
} from './nodes'
import type { JourneyDef, JourneyStepDef, JourneyEdgeDef, StepType } from '@/types'

// ─── React Flow node type registry ───────────────────────────────────────────

const nodeTypes: NodeTypes = {
  START: StartNode,
  FORM: FormNode,
  ID_CHECK: IdCheckNode,
  CREDIT_CHECK: CreditCheckNode,
  CONDITION: ConditionNode,
  END: EndNode,
}

// ─── Step palette definition ─────────────────────────────────────────────────

const PALETTE_ITEMS: { type: StepType; label: string; icon: React.ElementType; color: string; description: string }[] = [
  { type: 'FORM',         label: 'Form',         icon: FileText,     color: 'bg-blue-500',   description: 'Collect data with an existing form' },
  { type: 'ID_CHECK',     label: 'ID Check',     icon: ShieldCheck,  color: 'bg-purple-500', description: 'Verify applicant identity' },
  { type: 'CREDIT_CHECK', label: 'Credit Search',icon: Search,       color: 'bg-orange-500', description: 'Run a credit search' },
  { type: 'CONDITION',    label: 'Condition',    icon: GitBranch,    color: 'bg-yellow-500', description: 'Branch based on collected data' },
  { type: 'END',          label: 'End (Success)',icon: CheckCircle2, color: 'bg-emerald-500',description: 'Successful journey completion' },
  { type: 'END',          label: 'End (Rejected)',icon: XCircle,     color: 'bg-red-500',    description: 'Rejected / declined outcome' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stepToNode(step: JourneyStepDef): Node<JourneyStepDef> {
  return {
    id: step.id,
    type: step.type,
    position: { x: step.positionX, y: step.positionY },
    data: step,
  }
}

function edgeToRfEdge(edge: JourneyEdgeDef): Edge {
  return {
    id: edge.id,
    source: edge.sourceStepId,
    target: edge.targetStepId,
    sourceHandle: edge.condition?.field ?? null,
    label: edge.label ?? undefined,
    animated: false,
    style: { strokeWidth: 2 },
    labelStyle: { fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: '#f3f4f6', fillOpacity: 0.9 },
    data: edge,
  }
}

// ─── Node properties panel ───────────────────────────────────────────────────

function NodePropertiesPanel({
  node,
  availableForms,
  onChange,
  onDelete,
}: {
  node: Node<JourneyStepDef>
  availableForms: { id: string; name: string; slug: string }[]
  onChange: (id: string, patch: Partial<JourneyStepDef>) => void
  onDelete: (id: string) => void
}) {
  const data = node.data as JourneyStepDef

  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 text-sm">Step Properties</h3>
        {data.type !== 'START' && (
          <button
            onClick={() => onDelete(node.id)}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="step-title" className="text-xs">Label</Label>
          <Input
            id="step-title"
            value={data.title}
            onChange={e => onChange(node.id, { title: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        {/* Form step: choose form */}
        {data.type === 'FORM' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Form</Label>
            <Select
              value={data.formId ?? ''}
              onValueChange={val => {
                const form = availableForms.find(f => f.id === val)
                onChange(node.id, { formId: val, form })
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select a form…" />
              </SelectTrigger>
              <SelectContent>
                {availableForms.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ID_CHECK / CREDIT_CHECK: loading message */}
        {(data.type === 'ID_CHECK' || data.type === 'CREDIT_CHECK') && (
          <div className="space-y-1.5">
            <Label className="text-xs">Loading message</Label>
            <Input
              value={data.config?.loadingMessage ?? ''}
              onChange={e => onChange(node.id, { config: { ...data.config, loadingMessage: e.target.value } })}
              placeholder="Verifying your identity…"
              className="h-8 text-sm"
            />
          </div>
        )}

        {/* END step: type + message */}
        {data.type === 'END' && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Outcome</Label>
              <Select
                value={data.config?.endType ?? 'SUCCESS'}
                onValueChange={val =>
                  onChange(node.id, { config: { ...data.config, endType: val as 'SUCCESS' | 'REJECTED' } })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Completion message</Label>
              <textarea
                value={data.config?.message ?? ''}
                onChange={e => onChange(node.id, { config: { ...data.config, message: e.target.value } })}
                placeholder="Thank you — your application is complete."
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Edge properties panel ────────────────────────────────────────────────────

function EdgePropertiesPanel({
  edge,
  onChange,
}: {
  edge: Edge
  onChange: (id: string, patch: Partial<JourneyEdgeDef>) => void
}) {
  const data = (edge.data ?? {}) as unknown as JourneyEdgeDef

  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 text-sm">Connection Properties</h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Path label (optional)</Label>
          <Input
            value={data.label ?? ''}
            onChange={e => onChange(edge.id, { label: e.target.value })}
            placeholder="e.g. Approved, Rejected…"
            className="h-8 text-sm"
          />
        </div>
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <p className="font-medium text-gray-700 mb-1">Conditions</p>
          <p>Leave empty for the default path (taken when no other condition matches).</p>
          <p className="mt-2">Condition-based routing is configured via the condition editor below the canvas in a future update. For now, use the node&apos;s named handles (Pass / Fail / True / False) to create distinct paths.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main JourneyBuilder ─────────────────────────────────────────────────────

interface Props {
  journey: JourneyDef
  availableForms: { id: string; name: string; slug: string }[]
}

export function JourneyBuilder({ journey, availableForms }: Props) {
  const [journeyName, setJourneyName] = useState(journey.name)
  const [journeyStatus, setJourneyStatus] = useState(journey.status)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<JourneyStepDef>>(
    journey.steps.map(stepToNode)
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    journey.edges.map(edgeToRfEdge)
  )

  const [selectedNode, setSelectedNode] = useState<Node<JourneyStepDef> | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)

  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // Keep selected node data in sync as nodes state changes
  useEffect(() => {
    if (selectedNode) {
      const updated = nodes.find(n => n.id === selectedNode.id)
      if (updated) setSelectedNode(updated as Node<JourneyStepDef>)
    }
  }, [nodes]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Edge connect ─────────────────────────────────────────────────────────
  const onConnect = useCallback((connection: Connection) => {
    const edgeId = `edge-${nanoid(8)}`
    const newEdge: JourneyEdgeDef = {
      id: edgeId,
      sourceStepId: connection.source!,
      targetStepId: connection.target!,
      order: 0,
    }
    setEdges(eds =>
      addEdge({
        ...connection,
        id: edgeId,
        animated: false,
        style: { strokeWidth: 2 },
        data: newEdge,
      }, eds)
    )
  }, [setEdges])

  // ── Drop from palette ─────────────────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/reactflow-type') as StepType
    const label = e.dataTransfer.getData('application/reactflow-label')
    const isRejected = e.dataTransfer.getData('application/reactflow-rejected') === 'true'
    if (!type || !reactFlowWrapper.current) return

    const rect = reactFlowWrapper.current.getBoundingClientRect()
    const position = { x: e.clientX - rect.left - 90, y: e.clientY - rect.top - 30 }

    const stepId = `step-${nanoid(8)}`
    const newStep: JourneyStepDef = {
      id: stepId,
      type,
      title: label,
      positionX: position.x,
      positionY: position.y,
      config: type === 'END' ? { endType: isRejected ? 'REJECTED' : 'SUCCESS' } : undefined,
    }
    setNodes(nds => [...nds, stepToNode(newStep)])
  }, [setNodes])

  // ── Node prop updates ─────────────────────────────────────────────────────
  const updateNodeData = useCallback((id: string, patch: Partial<JourneyStepDef>) => {
    setNodes(nds =>
      nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)
    )
  }, [setNodes])

  const deleteNode = useCallback((id: string) => {
    setNodes(nds => nds.filter(n => n.id !== id))
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
    setSelectedNode(null)
  }, [setNodes, setEdges])

  // ── Edge prop updates ─────────────────────────────────────────────────────
  const updateEdgeData = useCallback((id: string, patch: Partial<JourneyEdgeDef>) => {
    setEdges(eds =>
      eds.map(e => {
        if (e.id !== id) return e
        const newData = { ...(e.data as unknown as JourneyEdgeDef), ...patch }
        return {
          ...e,
          label: newData.label ?? e.label,
          data: newData,
        }
      })
    )
  }, [setEdges])

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async (publish = false) => {
    setSaving(true)
    const steps: JourneyStepDef[] = nodes.map(n => ({
      ...(n.data as JourneyStepDef),
      positionX: n.position.x,
      positionY: n.position.y,
    }))
    const edgesPayload: JourneyEdgeDef[] = edges.map(e => ({
      id: e.id,
      sourceStepId: e.source,
      targetStepId: e.target,
      condition: (e.data as unknown as JourneyEdgeDef)?.condition,
      label: e.label as string | undefined,
      order: (e.data as unknown as JourneyEdgeDef)?.order ?? 0,
    }))

    await fetch(`/api/journeys/${journey.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: journeyName,
        status: publish ? 'PUBLISHED' : journeyStatus,
        steps,
        edges: edgesPayload,
      }),
    })
    if (publish) setJourneyStatus('PUBLISHED')
    setSavedAt(new Date())
    setSaving(false)
  }

  return (
    <div className="flex h-full">
      {/* ── Left: step palette ───────────────────────────────────────────── */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Step</p>
          <p className="text-xs text-gray-400 mt-0.5">Drag onto canvas</p>
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {PALETTE_ITEMS.map((item, i) => (
            <div
              key={i}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('application/reactflow-type', item.type)
                e.dataTransfer.setData('application/reactflow-label', item.label)
                e.dataTransfer.setData('application/reactflow-rejected', item.label.includes('Rejected') ? 'true' : 'false')
                e.dataTransfer.effectAllowed = 'move'
              }}
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-100 bg-gray-50 cursor-grab hover:bg-gray-100 hover:border-gray-200 active:cursor-grabbing select-none"
            >
              <div className={`w-6 h-6 rounded-md ${item.color} flex items-center justify-center shrink-0`}>
                <item.icon className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-700 leading-none">{item.label}</div>
                <div className="text-xs text-gray-400 mt-0.5 leading-tight">{item.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-gray-100 text-xs text-gray-400 space-y-1">
          <p className="font-medium text-gray-500">Tips</p>
          <p>• Drag items to canvas to add</p>
          <p>• Connect nodes by dragging from a handle to another node</p>
          <p>• Click a node or edge to edit its properties</p>
        </div>
      </div>

      {/* ── Centre: React Flow canvas ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center gap-3 px-4">
          <Input
            value={journeyName}
            onChange={e => setJourneyName(e.target.value)}
            className="h-8 w-64 text-sm font-medium"
          />
          <div className="ml-auto flex items-center gap-2">
            {savedAt && (
              <span className="text-xs text-gray-400">
                Saved {savedAt.toLocaleTimeString()}
              </span>
            )}
            {journeyStatus === 'PUBLISHED' && (
              <a
                href={`/journey/${journey.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Globe className="w-3 h-3" />
                View live
              </a>
            )}
            <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </Button>
            {journeyStatus !== 'PUBLISHED' && (
              <Button size="sm" onClick={() => handleSave(true)} disabled={saving}>
                <Play className="w-3.5 h-3.5" />
                Publish
              </Button>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div ref={reactFlowWrapper} className="flex-1" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
              setSelectedNode(node as unknown as Node<JourneyStepDef>)
              setSelectedEdge(null)
            }}
            onEdgeClick={(_, edge) => {
              setSelectedEdge(edge)
              setSelectedNode(null)
            }}
            onPaneClick={() => {
              setSelectedNode(null)
              setSelectedEdge(null)
            }}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            deleteKeyCode="Delete"
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
            <Controls />
            <MiniMap nodeColor={n => {
              const t = n.type
              if (t === 'START') return '#22c55e'
              if (t === 'FORM') return '#3b82f6'
              if (t === 'ID_CHECK') return '#a855f7'
              if (t === 'CREDIT_CHECK') return '#f97316'
              if (t === 'CONDITION') return '#eab308'
              return '#ef4444'
            }} />
            <Panel position="top-right" className="text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-md shadow-sm">
              {journeyStatus === 'PUBLISHED'
                ? <span className="text-emerald-600 font-medium">● Published</span>
                : <span className="text-amber-600 font-medium">● Draft</span>}
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* ── Right: properties panel ───────────────────────────────────────── */}
      {selectedNode && (
        <NodePropertiesPanel
          node={selectedNode}
          availableForms={availableForms}
          onChange={updateNodeData}
          onDelete={deleteNode}
        />
      )}
      {selectedEdge && !selectedNode && (
        <EdgePropertiesPanel edge={selectedEdge} onChange={updateEdgeData} />
      )}
      {!selectedNode && !selectedEdge && (
        <div className="w-72 bg-white border-l border-gray-200 flex items-center justify-center">
          <div className="text-center px-6 text-gray-400">
            <Plus className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Select a step or connection to edit its properties</p>
          </div>
        </div>
      )}
    </div>
  )
}
