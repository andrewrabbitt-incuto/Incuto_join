'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface IncomeExpenditureValue {
  income: {
    employment: number
    selfEmployment: number
    benefits: number
    pension: number
    rentalIncome: number
    otherIncome: number
  }
  expenditure: {
    mortgageRent: number
    councilTax: number
    utilities: number
    food: number
    transport: number
    clothing: number
    communications: number
    health: number
    leisure: number
    childcare: number
    existingLoans: number
    otherExpenditure: number
  }
  // Calculated
  totalMonthlyIncome: number
  totalMonthlyExpenditure: number
  monthlyDisposable: number
}

const INCOME_FIELDS: { key: keyof IncomeExpenditureValue['income']; label: string }[] = [
  { key: 'employment',    label: 'Employment (net take-home)' },
  { key: 'selfEmployment', label: 'Self-employment' },
  { key: 'benefits',      label: 'Benefits / tax credits' },
  { key: 'pension',       label: 'Pension income' },
  { key: 'rentalIncome',  label: 'Rental income' },
  { key: 'otherIncome',   label: 'Other income' },
]

// ONS-aligned expenditure categories
const EXPENDITURE_FIELDS: { key: keyof IncomeExpenditureValue['expenditure']; label: string }[] = [
  { key: 'mortgageRent',      label: 'Mortgage / rent' },
  { key: 'councilTax',        label: 'Council tax' },
  { key: 'utilities',         label: 'Utilities (gas, electric, water)' },
  { key: 'food',              label: 'Food & non-alcoholic drinks' },
  { key: 'transport',         label: 'Transport (car, fuel, public)' },
  { key: 'clothing',          label: 'Clothing & footwear' },
  { key: 'communications',    label: 'Phone, broadband & TV' },
  { key: 'health',            label: 'Health & personal care' },
  { key: 'leisure',           label: 'Recreation & leisure' },
  { key: 'childcare',         label: 'Childcare & education' },
  { key: 'existingLoans',     label: 'Existing loan / credit repayments' },
  { key: 'otherExpenditure',  label: 'Other expenditure' },
]

const BLANK_INCOME: IncomeExpenditureValue['income'] = {
  employment: 0, selfEmployment: 0, benefits: 0,
  pension: 0, rentalIncome: 0, otherIncome: 0,
}
const BLANK_EXPENDITURE: IncomeExpenditureValue['expenditure'] = {
  mortgageRent: 0, councilTax: 0, utilities: 0, food: 0,
  transport: 0, clothing: 0, communications: 0, health: 0,
  leisure: 0, childcare: 0, existingLoans: 0, otherExpenditure: 0,
}

function toNum(v: unknown): number {
  const n = parseFloat(String(v))
  return isNaN(n) ? 0 : n
}

function sum(obj: Record<string, number>): number {
  return Object.values(obj).reduce((a, b) => a + b, 0)
}

interface Props {
  value?: IncomeExpenditureValue
  onChange: (v: IncomeExpenditureValue) => void
  primaryColor: string
  error?: string
}

function CurrencyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [raw, setRaw] = useState(value === 0 ? '' : String(value))

  useEffect(() => {
    if (value === 0 && raw !== '') return // keep user's raw input
    if (value !== toNum(raw)) setRaw(value === 0 ? '' : String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
      <Input
        type="number"
        min={0}
        step={1}
        value={raw}
        onChange={e => {
          setRaw(e.target.value)
          onChange(toNum(e.target.value))
        }}
        className="pl-6 h-8 text-sm"
        placeholder="0"
      />
    </div>
  )
}

export function IncomeExpenditureWidget({ value, onChange, primaryColor, error }: Props) {
  const [income, setIncome] = useState<IncomeExpenditureValue['income']>(
    value?.income ?? { ...BLANK_INCOME }
  )
  const [expenditure, setExpenditure] = useState<IncomeExpenditureValue['expenditure']>(
    value?.expenditure ?? { ...BLANK_EXPENDITURE }
  )

  const totalIncome = useMemo(() => sum(income as unknown as Record<string, number>), [income])
  const totalExpenditure = useMemo(() => sum(expenditure as unknown as Record<string, number>), [expenditure])
  const disposable = totalIncome - totalExpenditure

  useEffect(() => {
    onChange({
      income,
      expenditure,
      totalMonthlyIncome: Math.round(totalIncome * 100) / 100,
      totalMonthlyExpenditure: Math.round(totalExpenditure * 100) / 100,
      monthlyDisposable: Math.round(disposable * 100) / 100,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [income, expenditure])

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(n)

  const updateIncome = (key: keyof typeof income, v: number) =>
    setIncome(prev => ({ ...prev, [key]: v }))

  const updateExpenditure = (key: keyof typeof expenditure, v: number) =>
    setExpenditure(prev => ({ ...prev, [key]: v }))

  return (
    <div className="space-y-5">
      {/* Income section */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <h4 className="text-sm font-semibold text-green-800">Monthly income</h4>
        </div>
        <div className="p-4 space-y-3">
          {INCOME_FIELDS.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-2 gap-3 items-center">
              <label className="text-sm text-gray-600">{label}</label>
              <CurrencyInput value={income[key]} onChange={v => updateIncome(key, v)} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3 items-center pt-2 border-t border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Total monthly income</span>
            <span className="text-sm font-bold text-right" style={{ color: primaryColor }}>{fmt(totalIncome)}</span>
          </div>
        </div>
      </div>

      {/* Expenditure section */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-600" />
          <h4 className="text-sm font-semibold text-red-800">Monthly expenditure</h4>
        </div>
        <div className="p-4 space-y-3">
          {EXPENDITURE_FIELDS.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-2 gap-3 items-center">
              <label className="text-sm text-gray-600">{label}</label>
              <CurrencyInput value={expenditure[key]} onChange={v => updateExpenditure(key, v)} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3 items-center pt-2 border-t border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Total monthly expenditure</span>
            <span className="text-sm font-bold text-red-600 text-right">{fmt(totalExpenditure)}</span>
          </div>
        </div>
      </div>

      {/* Disposable income summary */}
      <div className={cn(
        'rounded-xl p-4 flex items-center justify-between',
        disposable >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200',
      )}>
        <div className="flex items-center gap-2">
          {disposable > 0
            ? <TrendingUp className="w-5 h-5 text-green-600" />
            : disposable < 0
              ? <TrendingDown className="w-5 h-5 text-red-600" />
              : <Minus className="w-5 h-5 text-gray-500" />}
          <span className="text-sm font-semibold text-gray-800">Monthly disposable income</span>
        </div>
        <span className={cn(
          'text-lg font-bold',
          disposable >= 0 ? 'text-green-700' : 'text-red-700',
        )}>
          {fmt(disposable)}
        </span>
      </div>

      <p className="text-xs text-gray-400">
        Based on ONS expenditure categories. Figures are monthly. All amounts should be stated after tax.
      </p>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
