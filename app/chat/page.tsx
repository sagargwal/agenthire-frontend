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
  const [userName, setUserName] = useState('HR')
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
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
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
    if (err.message === 'unauthorized') {
      router.push('/login')
      return
    }
    const isLimit = err.message.startsWith('token_limit:')
    const detail = isLimit
      ? err.message.replace('token_limit:', '')
      : 'Something went wrong. Please try again.'
    if (sessionId) {
      const errMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `⚠️ ${detail}`,
      }
      setSessions(prev => prev.map(s =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, errMsg] }
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
        const userMsg: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: text,
        }
        setSessions(prev => [
          { id: tempId, title: text.slice(0, 40), messages: [userMsg] },
          ...prev,
        ])
        setActiveSession(tempId)
        const data = await createSession(text)
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          paused: data.paused,
          sessionId: data.session_id,
        }
        setSessions(prev => prev.map(s =>
          s.id === tempId
            ? { ...s, id: data.session_id, messages: [...s.messages, assistantMsg] }
            : s
        ))
        setActiveSession(data.session_id)
      } else {
        const userMsg: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: text,
        }
        setSessions(prev => prev.map(s =>
          s.id === activeSession
            ? { ...s, messages: [...s.messages, userMsg] }
            : s
        ))
        const data = await sendMessage(activeSession, text)
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          paused: data.paused,
          sessionId: data.session_id,
        }
        setSessions(prev => prev.map(s =>
          s.id === activeSession
            ? { ...s, messages: [...s.messages, assistantMsg] }
            : s
        ))
      }
    } catch (err: unknown) {
      if (pendingId) {
        const failedId = pendingId
        setSessions(prev => prev.filter(s => s.id !== failedId))
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
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
      }
      setSessions(prev => prev.map(s =>
        s.id === activeSession
          ? { ...s, messages: [...s.messages, userMsg] }
          : s
      ))
      const data = await sendMessage(activeSession, text)
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        paused: data.paused,
      }
      setSessions(prev => prev.map(s =>
        s.id === activeSession
          ? { ...s, messages: [...s.messages, assistantMsg] }
          : s
      ))
    } catch (err: unknown) {
      reportError(err, activeSession)
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  async function handleApprove() {
    if (!activeSession || loading) return
    await handleSendWithText('Approved')
  }

  function handleNewSession() {
    setActiveSession(null)
    setInput('')
    setSidebarOpen(false)
  }

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  function formatMessage(content: string) {
    if (content.includes('════')) {
      const parts = content.split(/════+/)
      const intro = parts[0].trim()
      const jd = parts[1]?.trim()
      return { type: 'jd', intro, jd }
    }
    return { type: 'text', content }
  }

  const currentSession = getActiveSession()

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">

      {/* ── Backdrop — closes sidebar on outside click (both mobile and desktop) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar — overlays content when open, hidden when closed ── */}
      <div className={`
        fixed left-0 top-0 h-full z-30
        w-56 bg-white border-r border-gray-100 flex flex-col
        transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
      `}>
        {/* Logo + close button */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-gray-900">AgentHire</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* New session */}
        <div className="p-3">
          <button
            onClick={handleNewSession}
            className="w-full text-left px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            + New JD
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {sessions.length > 0 && (
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-1">
              Recent
            </p>
          )}
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => { setActiveSession(session.id); setSidebarOpen(false) }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors truncate ${
                activeSession === session.id
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {session.title}
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-gray-400 px-1 mt-2">No recent sessions</p>
          )}
        </div>

        {/* Sign out */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── Main chat area — always full width ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger — always visible */}
            <button
              onClick={() => setSidebarOpen(prev => !prev)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="text-sm text-gray-500 truncate max-w-[200px] sm:max-w-xs">
              {currentSession ? currentSession.title : 'New conversation'}
            </span>
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0">Nexus Health</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

          {/* Empty state */}
          {!currentSession && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <h2 className="text-base font-medium text-gray-900 mb-2">
                What can I help with?
              </h2>
              <p className="text-sm text-gray-400 max-w-sm mb-6">
                I have deep knowledge of Nexus Health — every team, tech stack, level definition,
                and hiring history. Ask me anything about the company or start a JD.
              </p>

              {/* Suggestion cards */}
              <div className="w-full max-w-sm grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'Build a JD', example: 'I need an L4 for the Claims AI team', icon: '📝' },
                  { label: 'Find a team', example: 'We lost someone on the sepsis project', icon: '🔍' },
                  { label: 'Query company', example: 'Which teams use Kafka?', icon: '🏢' },
                  { label: 'Audit a JD', example: 'Is our 2021 L3 Claims AI JD still accurate?', icon: '✅' },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => setInput(item.example)}
                    className="text-left px-3 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-lg mb-1">{item.icon}</div>
                    <div className="text-xs font-semibold text-gray-700 mb-1 leading-tight">{item.label}</div>
                    <div className="text-[11px] text-gray-400 leading-snug line-clamp-2">{item.example}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {currentSession?.messages.map((msg) => {
            const formatted = formatMessage(msg.content)
            return (
              <div key={msg.id} className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                  msg.role === 'assistant' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-100 text-violet-700'
                }`}>
                  {msg.role === 'assistant' ? 'AH' : getInitials(userName)}
                </div>

                <div className={`max-w-[88%] sm:max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                  {formatted.type === 'jd' ? (
                    <>
                      {formatted.intro && (
                        <p className="text-sm text-gray-600">{formatted.intro}</p>
                      )}
                      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 text-sm w-full">
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                          <span className="font-medium text-gray-900 text-xs sm:text-sm">Job Description Draft</span>
                          <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100">Draft</span>
                        </div>
                        <div className="text-gray-600 text-xs leading-relaxed max-h-60 overflow-y-auto prose prose-xs prose-gray max-w-none">
                          <ReactMarkdown>{formatted.jd || ''}</ReactMarkdown>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
                          <button onClick={handleApprove} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors">
                            Approve and publish
                          </button>
                          <button onClick={() => setInput('Please change ')} className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition-colors">
                            Request changes
                          </button>
                          <button onClick={() => navigator.clipboard.writeText(formatted.jd || '')} className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition-colors">
                            Copy
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-violet-100 text-violet-900 whitespace-pre-wrap'
                        : 'bg-white border border-gray-200 text-gray-700'
                    }`}>
                      {msg.role === 'user' ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                    </div>
                  )}

                  {msg.paused && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 sm:px-4 py-3">
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
            <div className="flex gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-50 flex items-center justify-center text-[10px] sm:text-xs font-medium text-emerald-700 flex-shrink-0">AH</div>
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

        {/* Input bar */}
        <div className="bg-white border-t border-gray-100 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex gap-2 sm:gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Describe the role you want to hire for…"
              rows={1}
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none bg-gray-50 text-gray-900 placeholder-gray-400"
              style={{ minHeight: '44px', maxHeight: '240px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          {sendError && <p className="text-xs text-red-500 mt-2">{sendError}</p>}
          <p className="text-xs text-gray-400 mt-1.5">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}