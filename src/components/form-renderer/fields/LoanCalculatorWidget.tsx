'use client'

import { useMemo } from 'react'
import type { FormFieldDef } from '@/types'

export interface LoanCalculatorValue {
  amount: number
  term: number
  monthlyPayment: number
  totalRepayable: number
  totalInterest: number
  apr: number
}

// Parse widget config from field.options (stored as { label: key, value: stringValue })
function parseConfig(field: FormFieldDef) {
  const opts = (field.options ?? []) as { label: string; value: string }[]
  const get = (key: string, def: number) => {
    const o = opts.find(o => o.label === key)
    return o ? parseFloat(o.value) : def
  }
  return {
    minAmount:     get('minAmount', 500),
    maxAmount:     get('maxAmount', 25000),
    stepAmount:    get('stepAmount', 500),
    minTerm:       get('minTerm', 6),
    maxTerm:       get('maxTerm', 60),
    stepTerm:      get('stepTerm', 6),
    apr:           get('apr', 12.9),
    defaultAmount: get('defaultAmount', 5000),
    defaultTerm:   get('defaultTerm', 24),
  }
}

function calcMonthly(amount: number, termMonths: number, apr: number) {
  if (termMonths === 0) return 0
  const r = apr / 100 / 12
  if (r === 0) return amount / termMonths
  return (amount * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)
}

interface Props {
  field: FormFieldDef
  value?: LoanCalculatorValue
  onChange: (v: LoanCalculatorValue) => void
  primaryColor: string
  error?: string
}

export function LoanCalculatorWidget({ field, value, onChange, primaryColor, error }: Props) {
  const cfg = useMemo(() => parseConfig(field), [field])

  const amount = value?.amount ?? cfg.defaultAmount
  const term   = value?.term   ?? cfg.defaultTerm

  const monthly = useMemo(() => calcMonthly(amount, term, cfg.apr), [amount, term, cfg.apr])
  const total   = useMemo(() => monthly * term, [monthly, term])
  const interest = useMemo(() => total - amount, [total, amount])

  const emit = (a: number, t: number) => {
    const m = calcMonthly(a, t, cfg.apr)
    onChange({ amount: a, term: t, monthlyPayment: Math.round(m * 100) / 100, totalRepayable: Math.round(m * t * 100) / 100, totalInterest: Math.round((m * t - a) * 100) / 100, apr: cfg.apr })
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(n)

  return (
    <div className="space-y-5 bg-gray-50 rounded-xl p-4 border border-gray-100">
      {/* Amount slider */}
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <label className="text-sm font-medium text-gray-700">Loan amount</label>
          <span className="text-xl font-bold" style={{ color: primaryColor }}>{fmt(amount)}</span>
        </div>
        <input
          type="range"
          min={cfg.minAmount}
          max={cfg.maxAmount}
          step={cfg.stepAmount}
          value={amount}
          onChange={e => emit(parseFloat(e.target.value), term)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: primaryColor }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>{fmt(cfg.minAmount)}</span>
          <span>{fmt(cfg.maxAmount)}</span>
        </div>
      </div>

      {/* Term slider */}
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <label className="text-sm font-medium text-gray-700">Repayment term</label>
          <span className="text-xl font-bold" style={{ color: primaryColor }}>{term} months</span>
        </div>
        <input
          type="range"
          min={cfg.minTerm}
          max={cfg.maxTerm}
          step={cfg.stepTerm}
          value={term}
          onChange={e => emit(amount, parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: primaryColor }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>{cfg.minTerm} months</span>
          <span>{cfg.maxTerm} months</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
          <p className="text-xs text-gray-500 mb-0.5">Monthly payment</p>
          <p className="font-bold text-lg" style={{ color: primaryColor }}>{fmt(monthly)}</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
          <p className="text-xs text-gray-500 mb-0.5">Total repayable</p>
          <p className="font-bold text-gray-800">{fmt(total)}</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
          <p className="text-xs text-gray-500 mb-0.5">Total interest</p>
          <p className="font-bold text-gray-800">{fmt(interest)}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Representative {cfg.apr}% APR. Example figures only — subject to status and affordability assessment.
      </p>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
