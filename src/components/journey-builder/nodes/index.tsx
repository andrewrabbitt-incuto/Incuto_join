'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { FileText, ShieldCheck, Search, GitBranch, CheckCircle2, XCircle, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JourneyStepDef } from '@/types'

// React Flow requires node data to extend Record<string, unknown>.
// We cast data to JourneyStepDef inside each component.

// ─── Base wrapper ────────────────────────────────────────────────────────────

function NodeWrapper({
  children,
  className,
  selected,
}: {
  children: React.ReactNode
  className?: string
  selected?: boolean
}) {
  return (
    <div className={cn(
      'rounded-xl border-2 shadow-sm min-w-[180px] transition-all',
      selected ? 'ring-2 ring-offset-2 ring-blue-400' : '',
      className,
    )}>
      {children}
    </div>
  )
}

// ─── START ───────────────────────────────────────────────────────────────────

export function StartNode({ selected }: NodeProps) {
  return (
    <NodeWrapper className="bg-green-50 border-green-400" selected={!!selected}>
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
          <Play className="w-4 h-4 text-white fill-white" />
        </div>
        <span className="font-semibold text-green-800 text-sm">Start</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-green-500 !w-3 !h-3" />
    </NodeWrapper>
  )
}

// ─── FORM ────────────────────────────────────────────────────────────────────

export function FormNode({ data: rawData, selected }: NodeProps) {
  const data = rawData as unknown as JourneyStepDef
  return (
    <NodeWrapper className="bg-blue-50 border-blue-400" selected={!!selected}>
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-3 !h-3" />
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Form</span>
        </div>
        <div className="text-sm font-semibold text-gray-800 mt-0.5">{data.title}</div>
        {data.form && (
          <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[150px]">{data.form.name}</div>
        )}
        {!data.form && (
          <div className="text-xs text-blue-400 mt-0.5 italic">Click to select a form</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-3 !h-3" />
    </NodeWrapper>
  )
}

// ─── ID_CHECK ────────────────────────────────────────────────────────────────

export function IdCheckNode({ data: rawData, selected }: NodeProps) {
  const data = rawData as unknown as JourneyStepDef
  return (
    <NodeWrapper className="bg-purple-50 border-purple-400" selected={!!selected}>
      <Handle type="target" position={Position.Top} className="!bg-purple-400 !w-3 !h-3" />
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-purple-500 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">ID Check</span>
        </div>
        <div className="text-sm font-semibold text-gray-800">{data.title}</div>
      </div>
      <div className="flex justify-between px-6 pb-1 text-xs text-gray-400">
        <span>Pass</span>
        <span>Fail</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="pass"
        style={{ left: '30%' }}
        className="!bg-green-500 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="fail"
        style={{ left: '70%' }}
        className="!bg-red-500 !w-3 !h-3"
      />
    </NodeWrapper>
  )
}

// ─── CREDIT_CHECK ────────────────────────────────────────────────────────────

export function CreditCheckNode({ data: rawData, selected }: NodeProps) {
  const data = rawData as unknown as JourneyStepDef
  return (
    <NodeWrapper className="bg-orange-50 border-orange-400" selected={!!selected}>
      <Handle type="target" position={Position.Top} className="!bg-orange-400 !w-3 !h-3" />
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <Search className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-medium text-orange-600 uppercase tracking-wide">Credit Search</span>
        </div>
        <div className="text-sm font-semibold text-gray-800">{data.title}</div>
      </div>
      <div className="flex justify-between px-6 pb-1 text-xs text-gray-400">
        <span>Pass</span>
        <span>Fail</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="pass"
        style={{ left: '30%' }}
        className="!bg-green-500 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="fail"
        style={{ left: '70%' }}
        className="!bg-red-500 !w-3 !h-3"
      />
    </NodeWrapper>
  )
}

// ─── CONDITION ───────────────────────────────────────────────────────────────

export function ConditionNode({ data: rawData, selected }: NodeProps) {
  const data = rawData as unknown as JourneyStepDef
  return (
    <NodeWrapper className="bg-yellow-50 border-yellow-400" selected={!!selected}>
      <Handle type="target" position={Position.Top} className="!bg-yellow-400 !w-3 !h-3" />
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-yellow-500 flex items-center justify-center">
            <GitBranch className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Condition</span>
        </div>
        <div className="text-sm font-semibold text-gray-800">{data.title}</div>
        <div className="text-xs text-yellow-600 mt-0.5 italic">Drag edges from handles below</div>
      </div>
      <div className="flex justify-between px-6 pb-1 text-xs text-gray-400">
        <span>True</span>
        <span>False</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '30%' }}
        className="!bg-green-500 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '70%' }}
        className="!bg-red-500 !w-3 !h-3"
      />
    </NodeWrapper>
  )
}

// ─── END ─────────────────────────────────────────────────────────────────────

export function EndNode({ data: rawData, selected }: NodeProps) {
  const data = rawData as unknown as JourneyStepDef
  const isRejected = data.config?.endType === 'REJECTED'
  return (
    <NodeWrapper
      className={cn(
        'border-2',
        isRejected ? 'bg-red-50 border-red-400' : 'bg-emerald-50 border-emerald-400',
      )}
      selected={!!selected}
    >
      <Handle type="target" position={Position.Top} className={cn('!w-3 !h-3', isRejected ? '!bg-red-400' : '!bg-emerald-400')} />
      <div className="flex items-center gap-2 px-4 py-3">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', isRejected ? 'bg-red-500' : 'bg-emerald-500')}>
          {isRejected
            ? <XCircle className="w-4 h-4 text-white" />
            : <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>
        <div>
          <div className={cn('font-semibold text-sm', isRejected ? 'text-red-800' : 'text-emerald-800')}>
            {data.title}
          </div>
          <div className="text-xs text-gray-500">
            {isRejected ? 'Rejected' : 'Success'}
          </div>
        </div>
      </div>
    </NodeWrapper>
  )
}
