'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, KeyRound, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type SessionState =
  | { status: 'loading' }
  | { status: 'verify'; email: string; journeyName: string }
  | { status: 'verified'; journeySlug: string; currentStepId: string | null }
  | { status: 'expired' }
  | { status: 'error'; message: string }

export default function ResumePage() {
  const { slug, token } = useParams() as { slug: string; token: string }
  const router = useRouter()
  const [state, setState] = useState<SessionState>({ status: 'loading' })
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [otpError, setOtpError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/journey-sessions/${token}`)
        if (res.status === 410) { setState({ status: 'expired' }); return }
        if (!res.ok) { setState({ status: 'error', message: 'Invalid or expired link.' }); return }
        const data = await res.json()
        if (data.verified) {
          setState({ status: 'verified', journeySlug: data.journey.slug, currentStepId: data.currentStepId })
        } else {
          setState({ status: 'verify', email: data.email, journeyName: data.journey.name })
        }
      } catch {
        setState({ status: 'error', message: 'Failed to load session.' })
      }
    }
    load()
  }, [token])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!otp.trim()) return
    setVerifying(true)
    setOtpError('')
    try {
      const res = await fetch(`/api/journey-sessions/${token}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otp.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setOtpError(data.error ?? 'Incorrect code')
        return
      }
      if (data.verified && state.status === 'verify') {
        // Fetch session again to get current step
        const sessionRes = await fetch(`/api/journey-sessions/${token}`)
        const session = await sessionRes.json()
        setState({ status: 'verified', journeySlug: session.journey.slug, currentStepId: session.currentStepId })
      }
    } finally {
      setVerifying(false)
    }
  }

  function continueJourney() {
    if (state.status !== 'verified') return
    router.push(`/journey/${state.journeySlug}?resumeToken=${token}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        {state.status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-500 text-sm">Loading your session…</p>
          </div>
        )}

        {state.status === 'expired' && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <XCircle className="w-10 h-10 text-red-400" />
            <h2 className="font-semibold text-gray-800">Link expired</h2>
            <p className="text-sm text-gray-500">This resume link has expired. Please restart your application or contact the credit union for assistance.</p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <XCircle className="w-10 h-10 text-red-400" />
            <h2 className="font-semibold text-gray-800">Something went wrong</h2>
            <p className="text-sm text-gray-500">{state.message}</p>
          </div>
        )}

        {state.status === 'verify' && (
          <>
            <div className="flex flex-col items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Verify your identity</h2>
              <p className="text-sm text-gray-500 text-center">
                We sent a 6-digit code to <strong>{state.email}</strong>.<br />
                Enter it below to continue your application.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl font-mono tracking-widest h-12"
                  autoFocus
                />
                {otpError && <p className="text-xs text-red-500">{otpError}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={verifying || otp.length !== 6}>
                {verifying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying…</> : 'Verify & continue'}
              </Button>
            </form>
          </>
        )}

        {state.status === 'verified' && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <h2 className="text-xl font-bold text-gray-800">Identity verified</h2>
            <p className="text-sm text-gray-500">
              You can now continue from where you left off.
            </p>
            <Button onClick={continueJourney} className="mt-2 gap-2">
              Continue application <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
