'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Loader2, Settings, Shield, Bot, Webhook } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    name: '',
    incutoApiUrl: '',
    incutoApiKey: '',
    incutoTenantId: '',
    idCheckEnabled: true,
    vouchsafeEnabled: true,
    aiChatbotEnabled: true,
    vouchsafeApiUrl: '',
    vouchsafeApiKey: '',
  })

  useEffect(() => {
    fetch('/api/tenants/settings')
      .then(r => r.json())
      .then(data => { if (!data.error) setSettings(prev => ({ ...prev, ...data })) })
      .catch(() => {})
  }, [])

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/tenants/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      toast({ title: 'Settings saved!' })
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-500">Configure your credit union settings and integrations</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="incuto">Incuto API</TabsTrigger>
          <TabsTrigger value="id-check">ID Check</TabsTrigger>
          <TabsTrigger value="ai">AI Features</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Settings className="w-4 h-4" /> Organisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Credit Union Name</Label>
                <Input value={settings.name} onChange={e => setSettings(s => ({ ...s, name: e.target.value }))} />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <strong>Tenant Identifier:</strong> {session?.user?.tenantSlug}
                <br />
                <span className="text-xs">This is used in the login URL and cannot be changed.</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incuto" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Webhook className="w-4 h-4" /> Incuto API Configuration</CardTitle>
              <CardDescription>Connect to the Incuto back-office system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API URL</Label>
                <Input value={settings.incutoApiUrl} onChange={e => setSettings(s => ({ ...s, incutoApiUrl: e.target.value }))} placeholder="https://api.incuto.com" />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input type="password" value={settings.incutoApiKey} onChange={e => setSettings(s => ({ ...s, incutoApiKey: e.target.value }))} placeholder="Your Incuto API key" />
              </div>
              <div className="space-y-2">
                <Label>Tenant ID</Label>
                <Input value={settings.incutoTenantId} onChange={e => setSettings(s => ({ ...s, incutoTenantId: e.target.value }))} placeholder="Your Incuto tenant ID" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="id-check" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> Identity Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable ID Check</Label>
                  <p className="text-xs text-gray-500">Run automated identity checks via Incuto API</p>
                </div>
                <Switch checked={settings.idCheckEnabled} onCheckedChange={v => setSettings(s => ({ ...s, idCheckEnabled: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Vouchsafe Fallback</Label>
                  <p className="text-xs text-gray-500">If ID check fails, offer Vouchsafe document journey</p>
                </div>
                <Switch checked={settings.vouchsafeEnabled} onCheckedChange={v => setSettings(s => ({ ...s, vouchsafeEnabled: v }))} />
              </div>
              {settings.vouchsafeEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>Vouchsafe API URL</Label>
                    <Input value={settings.vouchsafeApiUrl} onChange={e => setSettings(s => ({ ...s, vouchsafeApiUrl: e.target.value }))} placeholder="https://api.vouchsafe.co.uk" />
                  </div>
                  <div className="space-y-2">
                    <Label>Vouchsafe API Key</Label>
                    <Input type="password" value={settings.vouchsafeApiKey} onChange={e => setSettings(s => ({ ...s, vouchsafeApiKey: e.target.value }))} placeholder="Your Vouchsafe key" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Bot className="w-4 h-4" /> AI Features</CardTitle>
              <CardDescription>Configure AI capabilities for your forms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>AI Form Builder Assistant</Label>
                  <p className="text-xs text-gray-500">Show AI assistant in the form builder</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Member-Facing Chatbot</Label>
                  <p className="text-xs text-gray-500">Allow chatbot on member join forms</p>
                </div>
                <Switch checked={settings.aiChatbotEnabled} onCheckedChange={v => setSettings(s => ({ ...s, aiChatbotEnabled: v }))} />
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                AI features require a valid Anthropic API key in your environment configuration.
                In demo mode, pre-built responses are used.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
