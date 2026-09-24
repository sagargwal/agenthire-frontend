'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSession, sendMessage, getToken, logout } from '@/lib/api'
import ReactMarkdown from 'react-markdown'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  paused?: boolean
  sessionId?: string
}

type Session = {
  id: string
  title: string
  messages: Message[]
}

export default function ChatPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userName] = useState('HR')
  const [sendError, setSendError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!getToken()) router.push('/login')
  }, [router])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [input])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sessions, activeSession])

  function getActiveSession() {
    return sessions.find(s => s.id === activeSession)
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function reportError(err: unknown, sessionId: string | null) {
    if (!(err instanceof Error)) return
    if (err.message === 'unauthorized') { router.push('/login'); return }
    const isLimit = err.message.startsWith('token_limit:')
    const detail = isLimit ? err.message.replace('token_limit:', '') : 'Something went wrong. Please try again.'
    if (sessionId) {
      setSessions(prev => prev.map(s => s.id === sessionId
        ? { ...s, messages: [...s.messages, { id: Date.now().toString(), role: 'assistant', content: `⚠️ ${detail}` }] }
        : s
      ))
    } else {
      setSendError(detail)
    }
  }

  async function handleSend() {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setSendError('')
    setLoading(true)
    let pendingId: string | null = null
    try {
      if (!activeSession) {
        const tempId = `pending-${Date.now()}`
        pendingId = tempId
        setSessions(prev => [{ id: tempId, title: text.slice(0, 40), messages: [{ id: Date.now().toString(), role: 'user', content: text }] }, ...prev])
        setActiveSession(tempId)
        const data = await createSession(text)
        setSessions(prev => prev.map(s => s.id === tempId
          ? { ...s, id: data.session_id, messages: [...s.messages, { id: (Date.now()+1).toString(), role: 'assistant', content: data.reply, paused: data.paused, sessionId: data.session_id }] }
          : s
        ))
        setActiveSession(data.session_id)
      } else {
        setSessions(prev => prev.map(s => s.id === activeSession
          ? { ...s, messages: [...s.messages, { id: Date.now().toString(), role: 'user', content: text }] }
          : s
        ))
        const data = await sendMessage(activeSession, text)
        setSessions(prev => prev.map(s => s.id === activeSession
          ? { ...s, messages: [...s.messages, { id: (Date.now()+1).toString(), role: 'assistant', content: data.reply, paused: data.paused }] }
          : s
        ))
      }
    } catch (err: unknown) {
      if (pendingId) {
        setSessions(prev => prev.filter(s => s.id !== pendingId))
        setActiveSession(null)
        setInput(text)
        reportError(err, null)
      } else {
        reportError(err, activeSession)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSendWithText(text: string) {
    if (!activeSession || loading) return
    setLoading(true)
    try {
      setSessions(prev => prev.map(s => s.id === activeSession
        ? { ...s, messages: [...s.messages, { id: Date.now().toString(), role: 'user', content: text }] }
        : s
      ))
      const data = await sendMessage(activeSession, text)
      setSessions(prev => prev.map(s => s.id === activeSession
        ? { ...s, messages: [...s.messages, { id: (Date.now()+1).toString(), role: 'assistant', content: data.reply, paused: data.paused }] }
        : s
      ))
    } catch (err) {
      reportError(err, activeSession)
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  function formatMessage(content: string) {
    if (content.includes('════')) {
      const parts = content.split(/════+/)
      return { type: 'jd', intro: parts[0].trim(), jd: parts[1]?.trim() }
    }
    return { type: 'text', content }
  }

  const currentSession = getActiveSession()

  return (
    // ── Root: full viewport, no scroll ──
    <div className="flex flex-col bg-gray-50 font-sans" style={{ height: "100dvh", overflow: "hidden" }}>

      {/* ── Top bar — always visible, never scrolls away ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-3 sm:px-4 py-2.5 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">

          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
            aria-label="Toggle history"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* AgentHire brand */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-gray-800">AgentHire</span>
          </div>

          {/* Conversation title */}
          <span className="text-sm text-gray-400 truncate hidden sm:block">
            {currentSession ? `· ${currentSession.title}` : '· New conversation'}
          </span>
        </div>

        {/* Right side: sign out + company name */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className="text-xs text-gray-400 hidden sm:block">Nexus Health</span>
          <button
            onClick={async () => { await logout(); router.push('/login') }}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Sign out
          </button>
          <button
            onClick={() => { setActiveSession(null); setInput('') }}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
          >
            + New conversation
          </button>
        </div>
      </div>

      {/* ── Body: sidebar + messages ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Sidebar backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/20 z-20" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <div className={`
          fixed top-0 left-0 h-full z-30 w-56 bg-white border-r border-gray-100 flex flex-col pt-14
          transition-transform duration-200 ease-in-out shadow-xl
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">History</span>
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {sessions.length === 0 && (
              <p className="text-xs text-gray-400 px-2 pt-2">No sessions yet</p>
            )}
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => { setActiveSession(session.id); setSidebarOpen(false) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                  activeSession === session.id ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {session.title}
              </button>
            ))}
          </div>
        </div>

        {/* ── Messages area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4">

            {/* Empty state */}
            {!currentSession && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <h2 className="text-base font-medium text-gray-900 mb-2">What can I help with?</h2>
                <p className="text-sm text-gray-400 max-w-xs mb-6">
                  Deep knowledge of Nexus Health — teams, tech stacks, levels, and hiring history.
                </p>
                {/* 2x2 suggestion cards */}
                <div className="w-full max-w-xs grid grid-cols-2 gap-2">
                  {[
                    { label: 'Build a JD', example: 'I need an L4 for the Claims AI team', icon: '📝' },
                    { label: 'Find a team', example: 'We lost someone on the sepsis project', icon: '🔍' },
                    { label: 'Query company', example: 'Which teams use Kafka?', icon: '🏢' },
                    { label: 'Audit a JD', example: 'Is our 2021 L3 Claims AI JD still accurate?', icon: '✅' },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => setInput(item.example)}
                      className="text-left px-3 py-3 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors"
                    >
                      <div className="text-base mb-1">{item.icon}</div>
                      <div className="text-xs font-semibold text-gray-700 mb-0.5 leading-tight">{item.label}</div>
                      <div className="text-[10px] text-gray-400 leading-snug line-clamp-2">{item.example}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {currentSession?.messages.map(msg => {
              const formatted = formatMessage(msg.content)
              return (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 mt-0.5 ${
                    msg.role === 'assistant' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-100 text-violet-700'
                  }`}>
                    {msg.role === 'assistant' ? 'AH' : getInitials(userName)}
                  </div>
                  <div className={`max-w-[88%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {formatted.type === 'jd' ? (
                      <>
                        {formatted.intro && <p className="text-sm text-gray-600">{formatted.intro}</p>}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 w-full">
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                            <span className="font-medium text-gray-900 text-xs">Job Description Draft</span>
                            <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100">Draft</span>
                          </div>
                          <div className="text-gray-600 text-xs leading-relaxed max-h-56 overflow-y-auto prose prose-xs prose-gray max-w-none">
                            <ReactMarkdown>{formatted.jd || ''}</ReactMarkdown>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-gray-100">
                            <button onClick={() => handleSendWithText('Approved')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors">Approve and publish</button>
                            <button onClick={() => setInput('Please change ')} className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition-colors">Request changes</button>
                            <button onClick={() => navigator.clipboard.writeText(formatted.jd || '')} className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition-colors">Copy</button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className={`px-3 py-2.5 rounded-xl text-sm leading-relaxed ${
                        msg.role === 'user' ? 'bg-violet-100 text-violet-900 whitespace-pre-wrap' : 'bg-white border border-gray-200 text-gray-700'
                      }`}>
                        {msg.role === 'user' ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                      </div>
                    )}
                    {msg.paused && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                        <p className="text-xs text-amber-700 font-medium mb-2">Waiting for your approval to proceed</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleSendWithText('Approved')} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700">Approve</button>
                          <button onClick={() => setInput('Please change ')} className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50">Request changes</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-[10px] font-medium text-emerald-700 flex-shrink-0">AH</div>
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input bar — sticky at bottom ── */}
          <div className="flex-shrink-0 bg-white border-t border-gray-100 px-3 sm:px-4 py-3">
            <div className="flex gap-2 items-end max-w-3xl mx-auto">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Describe the role you want to hire for…"
                rows={1}
                className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-emerald-400 resize-none bg-gray-50 text-gray-900 placeholder-gray-400"
                style={{ minHeight: '42px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            {sendError && <p className="text-xs text-red-500 mt-1.5 max-w-3xl mx-auto">{sendError}</p>}
            
          </div>
        </div>
      </div>
    </div>
  )
}