'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// ISO 3166-1 alpha-2 country list (abbreviated — full list in production)
const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IE', name: 'Ireland' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'HU', name: 'Hungary' },
  { code: 'RO', name: 'Romania' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'IN', name: 'India' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'OTHER', name: 'Other' },
].sort((a, b) => a.name.localeCompare(b.name))

export interface TaxResidencyValue {
  ukOnly: boolean
  countries: { country: string; tin: string; tinUnavailable: boolean }[]
}

interface Props {
  value?: TaxResidencyValue
  onChange: (v: TaxResidencyValue) => void
  primaryColor: string
  error?: string
  required?: boolean
}

const EMPTY: TaxResidencyValue = { ukOnly: true, countries: [] }

export function TaxResidencyField({ value, onChange, primaryColor, error, required }: Props) {
  const [state, setState] = useState<TaxResidencyValue>(value ?? EMPTY)

  useEffect(() => {
    onChange(state)
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  const setUkOnly = (ukOnly: boolean) => {
    const next = { ...state, ukOnly, countries: ukOnly ? [] : state.countries.length ? state.countries : [{ country: '', tin: '', tinUnavailable: false }] }
    setState(next)
  }

  const addCountry = () => {
    setState(s => ({ ...s, countries: [...s.countries, { country: '', tin: '', tinUnavailable: false }] }))
  }

  const removeCountry = (i: number) => {
    setState(s => ({ ...s, countries: s.countries.filter((_, idx) => idx !== i) }))
  }

  const updateCountry = (i: number, patch: Partial<TaxResidencyValue['countries'][number]>) => {
    setState(s => ({ ...s, countries: s.countries.map((c, idx) => idx === i ? { ...c, ...patch } : c) }))
  }

  return (
    <div className="space-y-4">
      {/* UK-only question */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">
          Are you tax resident in the UK only?
          {required && <span className="text-red-500 ml-1">*</span>}
        </p>
        <div className="flex gap-3">
          {(['yes', 'no'] as const).map(opt => (
            <label key={opt} className={cn(
              'flex items-center gap-2.5 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium',
              (opt === 'yes') === state.ukOnly
                ? 'border-current text-white'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white',
            )} style={(opt === 'yes') === state.ukOnly ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}>
              <input
                type="radio"
                name="uk_only"
                className="sr-only"
                checked={(opt === 'yes') === state.ukOnly}
                onChange={() => setUkOnly(opt === 'yes')}
              />
              {opt === 'yes' ? 'Yes, UK only' : 'No, I have other tax residencies'}
            </label>
          ))}
        </div>
      </div>

      {/* Additional countries */}
      {!state.ukOnly && (
        <div className="space-y-3 pl-1">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-600 font-medium">Other countries of tax residence</p>
          </div>

          {state.countries.map((entry, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Country {i + 1}</span>
                <button type="button" onClick={() => removeCountry(i)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs mb-1">Country</Label>
                  <select
                    value={entry.country}
                    onChange={e => updateCountry(i, { country: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                  >
                    <option value="">Select country…</option>
                    {COUNTRIES.filter(c => c.code !== 'GB').map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs mb-1">TIN / Tax Ref (if available)</Label>
                  <Input
                    value={entry.tin}
                    onChange={e => updateCountry(i, { tin: e.target.value })}
                    placeholder="e.g. 123-45-6789"
                    disabled={entry.tinUnavailable}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={entry.tinUnavailable}
                  onChange={e => updateCountry(i, { tinUnavailable: e.target.checked, tin: e.target.checked ? '' : entry.tin })}
                  className="rounded"
                />
                TIN not available / not issued by this country
              </label>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addCountry} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add country
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      <p className="text-xs text-gray-400 bg-blue-50 rounded-lg p-2.5">
        Under the Common Reporting Standard (CRS), we are required to collect information about your tax residency. This information may be reported to HMRC.
      </p>
    </div>
  )
}
