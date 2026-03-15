'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Globe, Loader2, Trash2, MapPin, Briefcase, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CommonBond {
  id: string
  name: string
  type: string
  description?: string
  values: string[]
  isActive: boolean
  createdAt: string
}

const TYPE_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  GEOGRAPHICAL: MapPin,
  POSTCODE: MapPin,
  EMPLOYMENT: Briefcase,
  COMMUNITY: Users,
  ASSOCIATION: Users,
}

export default function CommonBondsPage() {
  const { toast } = useToast()
  const [bonds, setBonds] = useState<CommonBond[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newBond, setNewBond] = useState({
    name: '',
    type: 'GEOGRAPHICAL',
    description: '',
    values: '',
  })

  useEffect(() => {
    fetch('/api/common-bonds')
      .then(r => r.json())
      .then(data => setBonds(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  async function create() {
    setSaving(true)
    try {
      const res = await fetch('/api/common-bonds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBond,
          values: newBond.values.split('\n').map(v => v.trim()).filter(Boolean),
        }),
      })
      const data = await res.json()
      setBonds(prev => [data, ...prev])
      setShowNew(false)
      setNewBond({ name: '', type: 'GEOGRAPHICAL', description: '', values: '' })
      toast({ title: 'Common bond created!' })
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function deleteBond(id: string) {
    await fetch(`/api/common-bonds/${id}`, { method: 'DELETE' })
    setBonds(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Common Bonds</h1>
          <p className="text-gray-500">Define eligibility criteria for your credit union</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-2" />Add Common Bond
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
      ) : bonds.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="font-semibold text-gray-600 mb-2">No common bonds defined</h3>
            <p className="text-gray-400 text-sm mb-4">Add common bonds to define who can join your credit union</p>
            <Button onClick={() => setShowNew(true)}>Add your first common bond</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {bonds.map(bond => {
            const Icon = TYPE_ICONS[bond.type] || Globe
            return (
              <Card key={bond.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{bond.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs mt-1">{bond.type}</Badge>
                      </div>
                    </div>
                    <button onClick={() => deleteBond(bond.id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {bond.description && <p className="text-xs text-gray-500 mb-3">{bond.description}</p>}
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 font-medium">Values ({bond.values.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {bond.values.slice(0, 6).map((v, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                      ))}
                      {bond.values.length > 6 && (
                        <Badge variant="outline" className="text-xs">+{bond.values.length - 6} more</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Common Bond</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={newBond.name} onChange={e => setNewBond(b => ({ ...b, name: e.target.value }))} placeholder="e.g. Greater Manchester Area" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newBond.type} onValueChange={v => setNewBond(b => ({ ...b, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GEOGRAPHICAL">Geographical</SelectItem>
                  <SelectItem value="POSTCODE">Postcode</SelectItem>
                  <SelectItem value="EMPLOYMENT">Employment Sector</SelectItem>
                  <SelectItem value="COMMUNITY">Community</SelectItem>
                  <SelectItem value="ASSOCIATION">Association</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={newBond.description} onChange={e => setNewBond(b => ({ ...b, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Values (one per line)</Label>
              <p className="text-xs text-gray-500">Enter postcodes, areas, employers, etc. — one per line</p>
              <Textarea
                value={newBond.values}
                onChange={e => setNewBond(b => ({ ...b, values: e.target.value }))}
                rows={5}
                placeholder="M1&#10;M2&#10;M14&#10;Salford&#10;..."
              />
            </div>
            <Button onClick={create} disabled={saving || !newBond.name} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Add Common Bond
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
