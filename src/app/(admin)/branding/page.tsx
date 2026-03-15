'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Loader2, Palette, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSession } from 'next-auth/react'

const FONTS = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Nunito', 'Raleway']

export default function BrandingPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [branding, setBranding] = useState({
    primaryColor: '#1E40AF',
    secondaryColor: '#DBEAFE',
    accentColor: '#3B82F6',
    logoUrl: '',
    faviconUrl: '',
    fontFamily: 'Inter',
    borderRadius: '8',
    customCss: '',
  })

  useEffect(() => {
    fetch('/api/tenants/branding')
      .then(r => r.json())
      .then(data => { if (data && !data.error) setBranding(prev => ({ ...prev, ...data })) })
      .catch(() => {})
  }, [])

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/tenants/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      })
      toast({ title: 'Branding saved!' })
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const preview = branding

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Branding</h1>
          <p className="text-gray-500">Customise how your forms look to members</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="space-y-6">
          <Tabs defaultValue="colours">
            <TabsList>
              <TabsTrigger value="colours">Colours</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="css">Custom CSS</TabsTrigger>
            </TabsList>

            <TabsContent value="colours" className="space-y-4 mt-4">
              {[
                { key: 'primaryColor', label: 'Primary Colour', description: 'Main brand colour for buttons and accents' },
                { key: 'secondaryColor', label: 'Secondary Colour', description: 'Background and card colours' },
                { key: 'accentColor', label: 'Accent Colour', description: 'Highlights and focus states' },
              ].map(item => (
                <div key={item.key} className="space-y-1.5">
                  <Label>{item.label}</Label>
                  <p className="text-xs text-gray-500">{item.description}</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding[item.key as keyof typeof branding]}
                      onChange={e => setBranding(b => ({ ...b, [item.key]: e.target.value }))}
                      className="w-12 h-10 rounded cursor-pointer border border-gray-200"
                    />
                    <Input
                      value={branding[item.key as keyof typeof branding]}
                      onChange={e => setBranding(b => ({ ...b, [item.key]: e.target.value }))}
                      className="font-mono flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="typography" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select value={branding.fontFamily} onValueChange={v => setBranding(b => ({ ...b, fontFamily: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Border Radius (px)</Label>
                <Input
                  type="number"
                  min={0}
                  max={32}
                  value={branding.borderRadius}
                  onChange={e => setBranding(b => ({ ...b, borderRadius: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="assets" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  placeholder="https://yourdomain.com/logo.png"
                  value={branding.logoUrl}
                  onChange={e => setBranding(b => ({ ...b, logoUrl: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Favicon URL</Label>
                <Input
                  placeholder="https://yourdomain.com/favicon.ico"
                  value={branding.faviconUrl}
                  onChange={e => setBranding(b => ({ ...b, faviconUrl: e.target.value }))}
                />
              </div>
              {branding.logoUrl && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Logo preview:</p>
                  <img src={branding.logoUrl} alt="Logo preview" className="h-12 object-contain" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="css" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Custom CSS</Label>
                <p className="text-xs text-gray-500">Advanced: Override styles on your join forms</p>
                <Textarea
                  value={branding.customCss}
                  onChange={e => setBranding(b => ({ ...b, customCss: e.target.value }))}
                  rows={12}
                  className="font-mono text-xs"
                  placeholder="/* Add custom CSS here */
.form-container {
  /* your styles */
}"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live preview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="w-4 h-4" /> Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-xl overflow-hidden bg-gray-50" style={{ fontFamily: preview.fontFamily }}>
                {/* Mini form preview */}
                <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
                  {preview.logoUrl ? (
                    <img src={preview.logoUrl} alt="Logo" className="h-8 object-contain" />
                  ) : (
                    <div className="h-8 w-24 rounded" style={{ backgroundColor: preview.primaryColor + '20' }}>
                      <span className="text-xs font-bold px-2 py-1 block" style={{ color: preview.primaryColor }}>Your Logo</span>
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-gray-700">Section Heading</div>
                    <div className="text-xs text-gray-400">Section description text here</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">First Name *</label>
                    <div className="h-8 rounded border border-gray-200 bg-white text-xs px-2 flex items-center text-gray-400" style={{ borderRadius: `${preview.borderRadius}px` }}>Enter text…</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Email Address *</label>
                    <div className="h-8 rounded border border-gray-200 bg-white text-xs px-2 flex items-center text-gray-400" style={{ borderRadius: `${preview.borderRadius}px` }}>email@example.com</div>
                  </div>
                  <button className="w-full py-2 rounded text-white text-sm font-medium" style={{ backgroundColor: preview.primaryColor, borderRadius: `${preview.borderRadius}px` }}>
                    Next →
                  </button>
                </div>
              </div>

              {/* Colour swatches */}
              <div className="mt-4 flex gap-3">
                {[preview.primaryColor, preview.secondaryColor, preview.accentColor].map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
                    <span className="text-xs text-gray-400">{c}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
