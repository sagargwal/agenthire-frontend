'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { login, setToken } from '@/lib/api'

// ── Slide data ────────────────────────────────────────────────────────────────

const slides = [
  {
    id: 'intro',
    type: 'graphic',
  },
  {
    id: 'capabilities',
    type: 'graphic',
  },
  {
    id: 'demo-build',
    type: 'chat',
    messages: [
      { role: 'user', text: 'We lost our best engineer on the sepsis project. Need to replace urgently.' },
      {
        role: 'ai',
        text: 'Here is what I will use to build this JD:\n\nTEAM: Clinical AI Lab — Clinical AI Research\nRequired: Python, PyTorch, FHIR R4, ICD-10, MLflow\nLevel: R3 Senior Researcher · 4–8 years\nPublications: Minimum 2 peer-reviewed (hard requirement)\nPrecedent: Last R3 posted 2023\n\nIs there anything you want to add or change before I draft?',
        isContext: true,
      },
    ],
  },
  {
    id: 'demo-org',
    type: 'chat',
    messages: [
      { role: 'user', text: 'Which teams at Nexus Health use Kafka?' },
      {
        role: 'ai',
        text: 'Teams using Kafka:\n\n• Claims AI — real-time fraud scoring pipeline (adopted 2022, mandatory)\n• Patient Data Platform — event streaming for patient data ingestion (adopted 2021, mandatory)\n• ML Platform — model serving infrastructure (adopted 2023, preferred)',
      },
    ],
  },
  {
    id: 'demo-audit',
    type: 'chat',
    messages: [
      { role: 'user', text: 'Is our 2021 L3 Claims AI JD still accurate?' },
      {
        role: 'ai',
        text: 'Comparing your 2021 JD against current team state:\n\nSTALE — needs update:\n  • XML listed as required → deprecated 2022\n  • Experience: "5+ years" → should be 4–8 years\n\nMISSING — not in your JD:\n  • Kafka → adopted 2022, now mandatory\n  • FHIR R4 → upgraded to mandatory 2023\n\nACCURATE:\n  • Python, Java, PostgreSQL, HL7 v2, REST APIs ✓\n\nWant me to draft an updated version?',
      },
    ],
  },
]

// ── Chat bubble component ─────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: { role: string; text: string; isContext?: boolean } }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end gap-2 mb-3">
        <div className="bg-violet-100 text-violet-900 rounded-xl rounded-tr-sm px-3 py-2 text-[11px] leading-relaxed max-w-[80%]">
          {msg.text}
        </div>
        <div className="w-6 h-6 rounded-full bg-violet-200 flex items-center justify-center text-[9px] font-semibold text-violet-700 flex-shrink-0 mt-0.5">
          HR
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-2 mb-3">
      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[9px] font-semibold text-emerald-700 flex-shrink-0 mt-0.5">
        AH
      </div>
      <div className={`rounded-xl rounded-tl-sm px-3 py-2 text-[11px] leading-relaxed max-w-[85%] whitespace-pre-line ${
        msg.isContext
          ? 'bg-white border border-gray-200 text-gray-700'
          : 'bg-white border border-gray-200 text-gray-700'
      }`}>
        {msg.text}
      </div>
    </div>
  )
}

// ── Slide renderers ───────────────────────────────────────────────────────────

function SlideIntro() {
  return (
    <div className="h-full flex flex-col justify-center px-12">
      {/* Big visual element */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <span className="text-emerald-400 text-sm font-medium tracking-wide">AgentHire</span>
        </div>

        <h1 className="text-4xl font-semibold text-white leading-tight mb-4">
          Hire smarter.<br />
          <span className="text-emerald-400">Know your company.</span>
        </h1>

        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
          AgentHire is an AI-powered JD intelligence platform built for Nexus Health — a healthcare technology company serving hospitals, payers, and health systems across the US.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { value: '23', label: 'Teams' },
          { value: '974', label: 'Historical JDs' },
          { value: '5', label: 'Departments' },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-semibold text-emerald-400 mb-1">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Company domains */}
      <div className="mt-6 flex flex-wrap gap-2">
        {['Healthcare AI', 'Clinical Research', 'Security', 'Legal', 'Operations'].map(d => (
          <span key={d} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
            {d}
          </span>
        ))}
      </div>
    </div>
  )
}

function SlideCapabilities() {
  const caps = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      ),
      title: 'Draft JDs instantly',
      desc: 'Describe the role — agent finds team context, tech stack, and level definitions automatically.',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
      title: 'Query company data',
      desc: 'Ask which teams use Kafka, which were founded after 2020, or who collaborates with Epic.',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      title: 'Audit stale JDs',
      desc: 'Upload an old JD — agent compares it against current team state and flags outdated requirements.',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      title: 'HITL approval flow',
      desc: 'Review what the agent found before it drafts. Approve, request changes, or override anything.',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      ),
      title: 'Post to careers page',
      desc: 'Finalized JDs publish directly to the Nexus Health careers page — one click from chat.',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      ),
      title: 'Sanitized output',
      desc: 'Internal project names and client details are automatically abstracted before the JD goes public.',
    },
  ]

  return (
    <div className="h-full flex flex-col justify-center px-12">
      <div className="mb-8">
        <p className="text-emerald-400 text-xs font-medium tracking-widest uppercase mb-2">What you can do</p>
        <h2 className="text-3xl font-semibold text-white">Six things.<br />One conversation.</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {caps.map(cap => (
          <div key={cap.title} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3">
            <div className="text-emerald-400 flex-shrink-0 mt-0.5">{cap.icon}</div>
            <div>
              <div className="text-white text-xs font-medium mb-1">{cap.title}</div>
              <div className="text-gray-500 text-[10px] leading-relaxed">{cap.desc}</div>
            </div>
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
    <div className="h-full flex flex-col justify-center px-12">
      <div className="mb-5">
        <p className="text-emerald-400 text-xs font-medium tracking-widest uppercase mb-1">{meta.label}</p>
        <h2 className="text-xl font-semibold text-white">{meta.title}</h2>
      </div>

      {/* Chat window mockup */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-gray-950">
          <div className="w-2 h-2 rounded-full bg-emerald-500"/>
          <span className="text-xs text-gray-400 font-medium">AgentHire</span>
          <span className="ml-auto text-xs text-gray-600">Nexus Health</span>
        </div>
        {/* Messages */}
        <div className="p-4">
          {messages.map((msg: any, i: number) => (
            <ChatBubble key={i} msg={msg} />
          ))}
        </div>
        {/* Input bar */}
        <div className="px-4 pb-4">
          <div className="bg-gray-800 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-gray-600 text-[10px] flex-1">Describe the role you want to hire for…</span>
            <div className="w-5 h-5 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
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

// ── Main login page ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [])
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [])

  // auto-advance every 7 seconds
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
    <div className="min-h-screen flex" style={{ background: '#0f1117' }}>

      {/* ── LEFT: Presentation ── */}
      <div className="hidden lg:flex flex-col w-[60%] relative overflow-hidden border-r border-white/10">

        {/* Slide content */}
        <div className="flex-1 overflow-hidden">
          <div key={slide.id} className="h-full animate-fade">
            {slide.type === 'graphic' && slide.id === 'intro' && <SlideIntro />}
            {slide.type === 'graphic' && slide.id === 'capabilities' && <SlideCapabilities />}
            {slide.type === 'chat' && <SlideChat slide={slide} />}
          </div>
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between px-12 py-6 border-t border-white/10">
          {/* Dots */}
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${
                  i === current
                    ? 'w-6 h-2 bg-emerald-500'
                    : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex gap-2">
            <button
              onClick={prev}
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button
              onClick={next}
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Login form ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Logo — visible on mobile too */}
          <div className="flex items-center gap-2 mb-10">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <span className="text-white text-sm font-medium">AgentHire</span>
          </div>

          <h1 className="text-2xl font-semibold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-8">Sign in to your Nexus Health workspace</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Work email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="priya@nexushealth.com"
                required
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none text-white placeholder-gray-600"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 rounded-lg border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-xs text-gray-500 mb-1 font-medium">Try the demo</p>
            <p className="text-xs text-gray-600">demo@nexushealth.com</p>
            <p className="text-xs text-gray-600">AgentHire2026</p>
          </div>

          <p className="text-center text-xs text-gray-600 mt-6">
            Have an invite code?{' '}
            <a href="/signup" className="text-emerald-500 hover:text-emerald-400">
              Create account
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade {
          animation: fade 0.5s ease forwards;
        }
      `}</style>
    </div>
  )
}
