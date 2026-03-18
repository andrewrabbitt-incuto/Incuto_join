'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface AddressEntry {
  line1: string
  line2?: string
  city: string
  county?: string
  postcode: string
  country: string
  movedIn: string   // ISO date string YYYY-MM
  movedOut?: string // ISO date string YYYY-MM, undefined = current
  isCurrent: boolean
}

export type AddressHistoryValue = { addresses: AddressEntry[] }

interface Props {
  value?: AddressHistoryValue
  onChange: (v: AddressHistoryValue) => void
  primaryColor: string
  error?: string
  required?: boolean
  /** Minimum years of history required (default 3) */
  yearsRequired?: number
}

function blankAddress(): AddressEntry {
  return { line1: '', city: '', postcode: '', country: 'GB', movedIn: '', isCurrent: false }
}

function monthsDiff(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  return (ty - fy) * 12 + (tm - fm)
}

function totalHistoryMonths(addresses: AddressEntry[]): number {
  const now = new Date()
  const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return addresses.reduce((sum, a) => {
    if (!a.movedIn) return sum
    const end = a.isCurrent ? nowStr : (a.movedOut ?? nowStr)
    return sum + Math.max(0, monthsDiff(a.movedIn, end))
  }, 0)
}

export function AddressHistoryWidget({ value, onChange, primaryColor, error, required, yearsRequired = 3 }: Props) {
  const [addresses, setAddresses] = useState<AddressEntry[]>(
    value?.addresses?.length ? value.addresses : [{ ...blankAddress(), isCurrent: true }]
  )

  useEffect(() => {
    onChange({ addresses })
  }, [addresses]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (i: number, patch: Partial<AddressEntry>) => {
    setAddresses(a => a.map((addr, idx) => idx === i ? { ...addr, ...patch } : addr))
  }

  const setCurrentAddress = (i: number) => {
    setAddresses(a => a.map((addr, idx) => ({
      ...addr,
      isCurrent: idx === i,
      movedOut: idx === i ? undefined : addr.movedOut,
    })))
  }

  const addPrevious = () => {
    setAddresses(a => [...a, { ...blankAddress(), isCurrent: false }])
  }

  const remove = (i: number) => {
    setAddresses(a => {
      const next = a.filter((_, idx) => idx !== i)
      // Ensure at least one current address
      if (next.length && !next.some(a => a.isCurrent)) next[0].isCurrent = true
      return next
    })
  }

  const totalMonths = totalHistoryMonths(addresses)
  const requiredMonths = yearsRequired * 12
  const coverageOk = totalMonths >= requiredMonths

  return (
    <div className="space-y-4">
      {/* Coverage indicator */}
      <div className={cn(
        'flex items-center gap-2 text-sm px-3 py-2 rounded-lg',
        coverageOk ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700',
      )}>
        {coverageOk
          ? <CheckCircle2 className="w-4 h-4 shrink-0" />
          : <AlertCircle className="w-4 h-4 shrink-0" />}
        <span>
          {coverageOk
            ? `${yearsRequired}-year history covered`
            : `Please provide at least ${yearsRequired} years of address history (${Math.ceil((requiredMonths - totalMonths) / 12 * 10) / 10} years still needed)`}
        </span>
      </div>

      {/* Address cards */}
      {addresses.map((addr, i) => (
        <div key={i} className={cn('rounded-xl border-2 p-4 space-y-3', addr.isCurrent ? 'border-current' : 'border-gray-200 bg-gray-50')} style={addr.isCurrent ? { borderColor: primaryColor } : {}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {addr.isCurrent ? 'Current address' : `Previous address ${i}`}
              </span>
              {addr.isCurrent && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: primaryColor }}>Current</span>
              )}
            </div>
            <div className="flex gap-2">
              {!addr.isCurrent && (
                <button type="button" onClick={() => setCurrentAddress(i)} className="text-xs text-blue-600 hover:underline">
                  Mark as current
                </button>
              )}
              {addresses.length > 1 && (
                <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-xs">Address line 1</Label>
              <Input value={addr.line1} onChange={e => update(i, { line1: e.target.value })} placeholder="House number and street" className="h-8 text-sm mt-0.5" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Address line 2 (optional)</Label>
              <Input value={addr.line2 ?? ''} onChange={e => update(i, { line2: e.target.value })} placeholder="Flat, apartment, etc." className="h-8 text-sm mt-0.5" />
            </div>
            <div>
              <Label className="text-xs">Town / City</Label>
              <Input value={addr.city} onChange={e => update(i, { city: e.target.value })} className="h-8 text-sm mt-0.5" />
            </div>
            <div>
              <Label className="text-xs">Postcode</Label>
              <Input value={addr.postcode} onChange={e => update(i, { postcode: e.target.value.toUpperCase() })} placeholder="SW1A 1AA" className="h-8 text-sm mt-0.5" />
            </div>
            <div>
              <Label className="text-xs">Moved in</Label>
              <Input type="month" value={addr.movedIn} onChange={e => update(i, { movedIn: e.target.value })} className="h-8 text-sm mt-0.5" />
            </div>
            {!addr.isCurrent && (
              <div>
                <Label className="text-xs">Moved out</Label>
                <Input type="month" value={addr.movedOut ?? ''} onChange={e => update(i, { movedOut: e.target.value })} className="h-8 text-sm mt-0.5" />
              </div>
            )}
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addPrevious} className="gap-1.5">
        <Plus className="w-3.5 h-3.5" />
        Add previous address
      </Button>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
