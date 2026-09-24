'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { login, setToken } from '@/lib/api'

const DEMO_EMAIL = 'demo@nexushealth.com'
const DEMO_PASSWORD = 'AgentHire2026'

const slides = [
  { id: 'intro', type: 'graphic' },
  { id: 'capabilities', type: 'graphic' },
  {
    id: 'demo-build', type: 'chat',
    messages: [
      { role: 'user', text: 'We lost our best engineer on the sepsis project. Need to replace urgently.' },
      { role: 'ai', text: 'TEAM: Clinical AI Lab\nRequired: Python, PyTorch, FHIR R4, ICD-10, MLflow\nLevel: R3 Senior Researcher · 4–8 years\nPublications: Minimum 2 peer-reviewed\n\nIs there anything you want to change before I draft?', isContext: true },
    ],
  },
  {
    id: 'demo-org', type: 'chat',
    messages: [
      { role: 'user', text: 'Which teams at Nexus Health use Kafka?' },
      { role: 'ai', text: '• Claims AI — real-time fraud scoring (adopted 2022, mandatory)\n• Patient Data Platform — event streaming (adopted 2021, mandatory)\n• ML Platform — model serving (adopted 2023, preferred)' },
    ],
  },
  {
    id: 'demo-audit', type: 'chat',
    messages: [
      { role: 'user', text: 'Is our 2021 L3 Claims AI JD still accurate?' },
      { role: 'ai', text: 'STALE: XML deprecated 2022 · "5+ years" should be 4–8\nMISSING: Kafka (2022, mandatory) · FHIR R4 (mandatory 2023)\nACCURATE: Python, Java, PostgreSQL, HL7 v2 ✓\n\nWant me to draft an updated version?' },
    ],
  },
]

function ChatBubble({ msg }: { msg: { role: string; text: string; isContext?: boolean } }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end gap-2 mb-3">
        <div className="bg-violet-100 text-violet-900 rounded-xl rounded-tr-sm px-3 py-2 text-[11px] leading-relaxed max-w-[80%]">{msg.text}</div>
        <div className="w-6 h-6 rounded-full bg-violet-200 flex items-center justify-center text-[9px] font-semibold text-violet-700 flex-shrink-0 mt-0.5">HR</div>
      </div>
    )
  }
  return (
    <div className="flex gap-2 mb-3">
      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[9px] font-semibold text-emerald-700 flex-shrink-0 mt-0.5">AH</div>
      <div className="bg-white border border-gray-200 text-gray-700 rounded-xl rounded-tl-sm px-3 py-2 text-[11px] leading-relaxed max-w-[85%] whitespace-pre-line">{msg.text}</div>
    </div>
  )
}

function SlideIntro() {
  return (
    <div className="h-full flex flex-col justify-center px-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <span className="text-emerald-400 text-sm font-medium">AgentHire</span>
        </div>
        <h1 className="text-3xl font-semibold text-white leading-tight mb-3">Hire smarter.<br /><span className="text-emerald-400">Know your company.</span></h1>
        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">An AI-powered JD intelligence platform built for Nexus Health — grounded in live company knowledge.</p>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[{ value: '23', label: 'Teams' }, { value: '974', label: 'Historical JDs' }, { value: '165', label: 'Technologies' }].map(s => (
          <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-2xl font-semibold text-emerald-400 mb-0.5">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {['Healthcare AI', 'Clinical Research', 'Security', 'Legal', 'Operations'].map(d => (
          <span key={d} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">{d}</span>
        ))}
      </div>
    </div>
  )
}

function SlideCapabilities() {
  const caps = [
    { title: 'Draft JDs instantly', desc: 'Describe the role — agent finds team, stack, and level automatically.' },
    { title: 'Query company data', desc: 'Ask which teams use Kafka or who collaborates with Epic.' },
    { title: 'Audit stale JDs', desc: 'Compares old JDs against current team state and flags outdated requirements.' },
    { title: 'HITL approval flow', desc: 'Review what the agent found before it drafts anything.' },
    { title: 'Post to careers page', desc: 'Finalized JDs publish directly to the careers page.' },
    { title: 'Sanitized output', desc: 'Internal names and client details abstracted automatically.' },
  ]
  return (
    <div className="h-full flex flex-col justify-center px-10">
      <div className="mb-6">
        <p className="text-emerald-400 text-xs font-medium tracking-widest uppercase mb-2">What you can do</p>
        <h2 className="text-2xl font-semibold text-white">Six things. One conversation.</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {caps.map(cap => (
          <div key={cap.title} className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-white text-xs font-medium mb-1">{cap.title}</div>
            <div className="text-gray-500 text-[10px] leading-relaxed">{cap.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideChat({ slide }: { slide: typeof slides[0] }) {
  const titles: Record<string, { label: string; title: string }> = {
    'demo-build': { label: 'Use case 1', title: 'Build a JD from a situation' },
    'demo-org':   { label: 'Use case 2', title: 'Query company knowledge' },
    'demo-audit': { label: 'Use case 3', title: 'Audit a stale job description' },
  }
  const meta = titles[slide.id]
  const messages = (slide as any).messages || []
  return (
    <div className="h-full flex flex-col justify-center px-10">
      <div className="mb-4">
        <p className="text-emerald-400 text-xs font-medium tracking-widest uppercase mb-1">{meta.label}</p>
        <h2 className="text-xl font-semibold text-white">{meta.title}</h2>
      </div>
      <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-gray-950">
          <div className="w-2 h-2 rounded-full bg-emerald-500"/>
          <span className="text-xs text-gray-400 font-medium">AgentHire</span>
          <span className="ml-auto text-xs text-gray-600">Nexus Health</span>
        </div>
        <div className="p-4">
          {messages.map((msg: any, i: number) => <ChatBubble key={i} msg={msg} />)}
        </div>
        <div className="px-4 pb-4">
          <div className="bg-gray-800 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-gray-600 text-[10px] flex-1">Describe the role you want to hire for…</span>
            <div className="w-5 h-5 rounded-lg bg-emerald-600 flex items-center justify-center">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  // ── Pre-fill demo credentials ──
  const [email, setEmail] = useState(DEMO_EMAIL)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [])
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [])

  useEffect(() => {
    const t = setInterval(next, 7000)
    return () => clearInterval(t)
  }, [next])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      setToken(data.access_token)
      router.push('/chat')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const slide = slides[current]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#0f1117' }}>

      {/* ── LEFT: Presentation — hidden on mobile ── */}
      <div className="hidden lg:flex flex-col w-[58%] border-r border-white/10 relative overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <div key={slide.id} className="h-full animate-fade">
            {slide.id === 'intro' && <SlideIntro />}
            {slide.id === 'capabilities' && <SlideCapabilities />}
            {slide.type === 'chat' && <SlideChat slide={slide} />}
          </div>
        </div>
        <div className="flex items-center justify-between px-10 py-5 border-t border-white/10">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${i === current ? 'w-6 h-2 bg-emerald-500' : 'w-2 h-2 bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={prev} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={next} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Login form — full screen on mobile ── */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 min-h-screen lg:min-h-0">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <span className="text-white text-sm font-medium">AgentHire</span>
          </div>

          <h1 className="text-2xl font-semibold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to your Nexus Health workspace</p>

          {/* ── Demo banner ── */}
          <div className="mb-5 p-3 rounded-xl border border-emerald-900/60 bg-emerald-950/40 flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p className="text-xs text-emerald-400 font-medium mb-0.5">Demo credentials pre-filled</p>
              <p className="text-[11px] text-emerald-700">Just click Sign in to explore the demo</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Work email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(16,185,129,0.3)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(16,185,129,0.3)'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(16,185,129,0.3)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(16,185,129,0.3)'}
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-5">
            Have an invite code?{' '}
            <a href="/signup" className="text-emerald-500 hover:text-emerald-400">Create account</a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade { animation: fade 0.5s ease forwards; }
      `}</style>
    </div>
  )
}