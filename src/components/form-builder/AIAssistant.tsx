'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bot, Send, X, Sparkles, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  actions?: AIAction[]
}

interface AIAction {
  type: 'ADD_SECTION' | 'ADD_FIELD' | 'ADD_FIELDS' | 'SET_BRANDING' | 'UPDATE_SETTINGS'
  payload: unknown
  label: string
}

interface AIAssistantProps {
  formId: string
  onApplyAction: (action: AIAction) => void
}

const SUGGESTIONS = [
  "Add a personal details section",
  "Add loan application fields",
  "Add KYC/ID verification section",
  "Set up common bond question",
  "Add corporate member fields",
  "Add marketing consent field",
]

export function AIAssistant({ formId, onApplyAction }: AIAssistantProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your form building assistant. I can help you add sections, fields, set up logic, and more. What would you like to add to your form?",
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const msg = text || input.trim()
    if (!msg || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          formId,
          history: messages.slice(-6),
        }),
      })

      if (!res.ok) throw new Error('AI request failed')
      const data = await res.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        actions: data.actions,
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't process that request. Please try again.",
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-xl flex items-center justify-center hover:shadow-2xl transition-all hover:scale-105 z-50"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">AI Form Assistant</p>
                <p className="text-xs opacity-80">Powered by Claude</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                )}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  {/* Action buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.actions.map((action, aIdx) => (
                        <Button
                          key={aIdx}
                          size="sm"
                          variant="outline"
                          className="w-full text-xs h-7 bg-white hover:bg-blue-50 text-blue-700 border-blue-200"
                          onClick={() => onApplyAction(action)}
                        >
                          <Sparkles className="w-3 h-3 mr-1.5" />
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-400 mb-2">Suggestions:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.slice(0, 3).map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full px-2.5 py-1 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <form onSubmit={e => { e.preventDefault(); sendMessage() }} className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask the AI assistant…"
                className="flex-1 h-9 text-sm"
                disabled={loading}
              />
              <Button type="submit" size="sm" disabled={loading || !input.trim()} className="h-9 px-3">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
