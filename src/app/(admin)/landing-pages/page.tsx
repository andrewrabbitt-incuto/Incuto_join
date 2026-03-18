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
import { Plus, Globe, Copy, Loader2, ExternalLink, BarChart2, Edit2 } from 'lucide-react'
import { formatDate, slugify } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface LandingPage {
  id: string
  name: string
  description?: string
  slug?: string
  trackingCode: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  isActive: boolean
  published: boolean
  startsAt?: string
  endsAt?: string
  createdAt: string
  _count?: { applications: number; analyticsEvents: number }
}

export default function LandingPagesPage() {
  const { toast } = useToast()
  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newPage, setNewPage] = useState({
    name: '',
    slug: '',
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

  const handleNameChange = (name: string) => {
    setNewPage(p => ({ ...p, name, slug: slugify(name) }))
  }

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
      setNewPage({ name: '', slug: '', description: '', utmSource: '', utmMedium: '', utmCampaign: '', isActive: true })
      toast({ title: 'Landing page created!', description: 'Open the editor to build your page.' })
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  function copyTrackingUrl(page: LandingPage) {
    const url = page.slug ? `/lp/${page.slug}` : `?campaign=${page.trackingCode}`
    navigator.clipboard.writeText(url)
    toast({ title: 'URL copied!' })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Landing Pages</h1>
          <p className="text-gray-500">
            Build branded landing pages and track conversion performance across channels.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/analytics">
            <Button variant="outline">
              <BarChart2 className="w-4 h-4 mr-2" />Analytics
            </Button>
          </Link>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4 mr-2" />New Landing Page
          </Button>
        </div>
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
              Create a branded landing page with a hero section, features, and rates, then publish it to a URL.
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
                  <div className="flex gap-1.5">
                    <Badge variant={page.published ? 'success' : 'secondary'}>
                      {page.published ? 'Published' : 'Draft'}
                    </Badge>
                    {!page.isActive && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {page.slug && (
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-600">/lp/{page.slug}</span>
                    <div className="flex gap-2">
                      <button onClick={() => copyTrackingUrl(page)} className="text-xs text-blue-500 hover:text-blue-700">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {page.published && (
                        <a href={`/lp/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-700">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {(page.utmSource || page.utmMedium) && (
                  <div className="flex flex-wrap gap-1.5">
                    {page.utmSource && <Badge variant="info" className="text-xs">source: {page.utmSource}</Badge>}
                    {page.utmMedium && <Badge variant="secondary" className="text-xs">medium: {page.utmMedium}</Badge>}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Created {formatDate(page.createdAt)}</span>
                  <span>{page._count?.analyticsEvents ?? 0} events · {page._count?.applications ?? 0} apps</span>
                </div>

                <Link href={`/landing-pages/${page.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-1">
                    <Edit2 className="w-3.5 h-3.5 mr-2" />Open Editor
                  </Button>
                </Link>
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
              <Label>Page Name *</Label>
              <Input
                value={newPage.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Facebook January Campaign"
              />
            </div>
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">/lp/</span>
                <Input
                  value={newPage.slug}
                  onChange={e => setNewPage(p => ({ ...p, slug: e.target.value }))}
                  placeholder="facebook-jan"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newPage.description}
                onChange={e => setNewPage(p => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">UTM Source</Label>
                <Input value={newPage.utmSource} onChange={e => setNewPage(p => ({ ...p, utmSource: e.target.value }))} placeholder="facebook" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">UTM Medium</Label>
                <Input value={newPage.utmMedium} onChange={e => setNewPage(p => ({ ...p, utmMedium: e.target.value }))} placeholder="social" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">UTM Campaign</Label>
                <Input value={newPage.utmCampaign} onChange={e => setNewPage(p => ({ ...p, utmCampaign: e.target.value }))} placeholder="jan_2025" className="h-8 text-xs" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={newPage.isActive} onCheckedChange={v => setNewPage(p => ({ ...p, isActive: v }))} />
            </div>
            <Button onClick={createLandingPage} disabled={saving || !newPage.name} className="w-full">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create &amp; Open Editor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
