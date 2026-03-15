'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatbotConfig } from '@/types'

interface ChatBotProps {
  config: ChatbotConfig
  formSlug: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function ChatBot({ config, formSlug }: ChatBotProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: config.greeting || "Hi! I'm here to help you with your application. What questions do you have?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, formSlug, history: messages.slice(-6) }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  const primaryColor = config.primaryColor || '#2563EB'

  return (
    <div className={cn('fixed z-50', config.position === 'bottom-left' ? 'bottom-6 left-6' : 'bottom-6 right-6')}>
      {/* Chat window */}
      {open && (
        <div className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 p-4" style={{ backgroundColor: primaryColor }}>
            {config.avatarUrl ? (
              <img src={config.avatarUrl} alt="Bot" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{config.name || 'Help Assistant'}</p>
              <p className="text-white/70 text-xs">Online now</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                  msg.role === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                )} style={msg.role === 'user' ? { backgroundColor: primaryColor } : {}}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <form onSubmit={e => { e.preventDefault(); send() }} className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 h-9 text-sm"
                disabled={loading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={loading || !input.trim()}
                className="h-9 px-3"
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center hover:shadow-2xl transition-all hover:scale-105"
        style={{ backgroundColor: primaryColor }}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  )
}
