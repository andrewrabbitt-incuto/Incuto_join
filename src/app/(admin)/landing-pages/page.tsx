'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Plus, Globe, Copy, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface LandingPage {
  id: string
  name: string
  description?: string
  trackingCode: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  isActive: boolean
  startsAt?: string
  endsAt?: string
  createdAt: string
  _count?: { applications: number }
}

export default function LandingPagesPage() {
  const { toast } = useToast()
  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newPage, setNewPage] = useState({
    name: '',
    description: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    isActive: true,
  })

  useEffect(() => {
    fetch('/api/landing-pages')
      .then(r => r.json())
      .then(data => setLandingPages(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  async function createLandingPage() {
    setSaving(true)
    try {
      const res = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPage),
      })
      const data = await res.json()
      setLandingPages(prev => [data, ...prev])
      setShowNew(false)
      setNewPage({ name: '', description: '', utmSource: '', utmMedium: '', utmCampaign: '', isActive: true })
      toast({ title: 'Landing page created!' })
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  function copyTrackingCode(code: string) {
    navigator.clipboard.writeText(`?campaign=${code}`)
    toast({ title: 'Tracking code copied!' })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Landing Pages</h1>
          <p className="text-gray-500">
            Track applications from specific marketing channels by attaching a
            landing page tracking code to any form URL.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-2" />New Landing Page
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        </div>
      ) : landingPages.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="font-semibold text-gray-600 mb-2">No landing pages yet</h3>
            <p className="text-gray-400 text-sm mb-4">
              Create a landing page to track applications from a specific marketing channel.
              Append the tracking code to any form URL as <code className="bg-gray-100 px-1 rounded">?campaign=CODE</code>.
            </p>
            <Button onClick={() => setShowNew(true)}>Create your first landing page</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {landingPages.map(page => (
            <Card key={page.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{page.name}</CardTitle>
                    {page.description && (
                      <p className="text-xs text-gray-400 mt-1">{page.description}</p>
                    )}
                  </div>
                  <Badge variant={page.isActive ? 'success' : 'secondary'}>
                    {page.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Tracking Code</span>
                    <button
                      onClick={() => copyTrackingCode(page.trackingCode)}
                      className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <code className="text-xs font-mono text-gray-700">{page.trackingCode}</code>
                </div>

                {(page.utmSource || page.utmMedium) && (
                  <div className="flex flex-wrap gap-1.5">
                    {page.utmSource && (
                      <Badge variant="info" className="text-xs">source: {page.utmSource}</Badge>
                    )}
                    {page.utmMedium && (
                      <Badge variant="secondary" className="text-xs">medium: {page.utmMedium}</Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <span>Created {formatDate(page.createdAt)}</span>
                  <span>{page._count?.applications || 0} applications</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New landing page dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Landing Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newPage.name}
                onChange={e => setNewPage(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Facebook January 2025"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newPage.description}
                onChange={e => setNewPage(p => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">UTM Source</Label>
                <Input
                  value={newPage.utmSource}
                  onChange={e => setNewPage(p => ({ ...p, utmSource: e.target.value }))}
                  placeholder="facebook"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">UTM Medium</Label>
                <Input
                  value={newPage.utmMedium}
                  onChange={e => setNewPage(p => ({ ...p, utmMedium: e.target.value }))}
                  placeholder="social"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">UTM Campaign</Label>
              <Input
                value={newPage.utmCampaign}
                onChange={e => setNewPage(p => ({ ...p, utmCampaign: e.target.value }))}
                placeholder="jan_2025_promo"
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={newPage.isActive}
                onCheckedChange={v => setNewPage(p => ({ ...p, isActive: v }))}
              />
            </div>
            <Button
              onClick={createLandingPage}
              disabled={saving || !newPage.name}
              className="w-full"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Landing Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
