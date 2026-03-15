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
import { Plus, Megaphone, Copy, ExternalLink, Loader2, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Campaign {
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

export default function CampaignsPage() {
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    isActive: true,
  })

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(data => setCampaigns(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  async function createCampaign() {
    setSaving(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign),
      })
      const data = await res.json()
      setCampaigns(prev => [data, ...prev])
      setShowNew(false)
      toast({ title: 'Campaign created!' })
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  function copyTrackingUrl(code: string) {
    navigator.clipboard.writeText(`?campaign=${code}`)
    toast({ title: 'Tracking code copied!' })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-gray-500">Track performance of marketing campaigns</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-2" />New Campaign
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="font-semibold text-gray-600 mb-2">No campaigns yet</h3>
            <p className="text-gray-400 text-sm mb-4">Create campaigns to track applications from specific marketing channels</p>
            <Button onClick={() => setShowNew(true)}>Create your first campaign</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map(campaign => (
            <Card key={campaign.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                    {campaign.description && <p className="text-xs text-gray-400 mt-1">{campaign.description}</p>}
                  </div>
                  <Badge variant={campaign.isActive ? 'success' : 'secondary'}>
                    {campaign.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Tracking Code</span>
                    <button onClick={() => copyTrackingUrl(campaign.trackingCode)} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                      <Copy className="w-3 h-3" /> Copy URL
                    </button>
                  </div>
                  <code className="text-xs font-mono text-gray-700">{campaign.trackingCode}</code>
                </div>

                {(campaign.utmSource || campaign.utmMedium) && (
                  <div className="flex flex-wrap gap-1.5">
                    {campaign.utmSource && <Badge variant="info" className="text-xs">source: {campaign.utmSource}</Badge>}
                    {campaign.utmMedium && <Badge variant="secondary" className="text-xs">medium: {campaign.utmMedium}</Badge>}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <span>Created {formatDate(campaign.createdAt)}</span>
                  <span>{campaign._count?.applications || 0} applications</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New campaign dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Campaign Name *</Label>
              <Input value={newCampaign.name} onChange={e => setNewCampaign(c => ({ ...c, name: e.target.value }))} placeholder="e.g. Facebook January 2025" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={newCampaign.description} onChange={e => setNewCampaign(c => ({ ...c, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">UTM Source</Label>
                <Input value={newCampaign.utmSource} onChange={e => setNewCampaign(c => ({ ...c, utmSource: e.target.value }))} placeholder="facebook" className="h-8 text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">UTM Medium</Label>
                <Input value={newCampaign.utmMedium} onChange={e => setNewCampaign(c => ({ ...c, utmMedium: e.target.value }))} placeholder="social" className="h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">UTM Campaign</Label>
              <Input value={newCampaign.utmCampaign} onChange={e => setNewCampaign(c => ({ ...c, utmCampaign: e.target.value }))} placeholder="jan_2025_promo" className="h-8 text-xs" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={newCampaign.isActive} onCheckedChange={v => setNewCampaign(c => ({ ...c, isActive: v }))} />
            </div>
            <Button onClick={createCampaign} disabled={saving || !newCampaign.name} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
