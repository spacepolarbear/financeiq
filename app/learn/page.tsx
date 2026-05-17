//@ts-nocheck
'use client'

// app/learn/page.js
// ─────────────────────────────────────────────────────────────
// Penny Learn Page — Module Browser
// Shows all 12 modules with progress, and surfaces the next
// recommended lesson based on the user's learning path.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getProfile, getLessonProgress, getQuizAnswers } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import BottomNav from '../../components/BottomNav'

const MODULES = [
  { id: 1,  emoji: '💰', title: 'Budgeting & Cash Flow',   desc: 'The foundation of everything.',                    color: '#d4781a', bg: '#fdf8f0', border: '#f5d9a8', total: 12 },
  { id: 2,  emoji: '🏦', title: 'Banking',                  desc: 'Stop leaving money in the wrong accounts.',         color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', total: 10 },
  { id: 3,  emoji: '⛓️', title: 'Debt Management',          desc: 'Build a plan to get free.',                        color: '#16a34a', bg: '#f0fdf4', border: '#86efac', total: 11 },
  { id: 4,  emoji: '📊', title: 'Credit & Scores',          desc: 'Your financial reputation.',                       color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', total: 10 },
  { id: 5,  emoji: '📈', title: 'Investing',                desc: 'Make your money work while you sleep.',            color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', total: 16 },
  { id: 6,  emoji: '🛡️', title: 'Insurance',               desc: 'Protect everything you\'ve built.',                color: '#db2777', bg: '#fdf2f8', border: '#f9a8d4', total: 12 },
  { id: 7,  emoji: '🌅', title: 'Retirement',               desc: 'Earlier is always better.',                        color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', total: 12 },
  { id: 8,  emoji: '🧾', title: 'Taxes',                    desc: 'Keep more of what you earn.',                      color: '#b45309', bg: '#fffbeb', border: '#fcd34d', total: 11 },
  { id: 9,  emoji: '🏠', title: 'Housing & Real Estate',    desc: 'Rent or buy — know the real math.',                color: '#15803d', bg: '#f0fdf4', border: '#86efac', total: 11 },
  { id: 10, emoji: '💼', title: 'Career & Income',          desc: 'Maximize your biggest asset.',                     color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', total: 9  },
  { id: 11, emoji: '🎯', title: 'Major Life Events',        desc: 'Big moments need financial prep.',                 color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', total: 10 },
  { id: 12, emoji: '🧠', title: 'Psychology of Money',      desc: 'Your mindset drives every decision.',              color: '#6d28d9', bg: '#f5f3ff', border: '#c4b5fd', total: 9  },
]

// Routing logic — uses quiz answers to suggest priority order
function buildRecommendedOrder(quizAnswers) {
  const answers = {}
  ;(quizAnswers || []).forEach(qa => { answers[qa.question_key] = qa.answer_key })

  const challenge   = answers['challenge']?.[0]
  const debt        = answers['debt'] || []
  const goal        = answers['goal']?.[0]
  const employment  = answers['employment']?.[0]

  const priority = []

  // Always start with budgeting foundation
  priority.push(1)

  if (challenge === 'debt' || debt.includes('credit_card') || debt.includes('student_loans')) priority.push(3)
  if (challenge === 'not_saving' || goal === 'invest' || goal === 'fi') priority.push(5)
  if (goal === 'less_stress' || challenge === 'feel_behind') priority.push(12)
  if (challenge === 'retirement' || goal === 'fi') priority.push(7)
  if (challenge === 'big_purchase' || goal === 'buy_home') priority.push(9)
  if (debt.includes('credit_card') || !debt.length) priority.push(4)
  if (employment === 'freelance' || employment === 'both') priority.push(8)

  // Add remaining modules in default order
  const allIds = MODULES.map(m => m.id)
  const remaining = allIds.filter(id => !priority.includes(id))

  return [...new Set([...priority, ...remaining])]
}

export default function LearnPage() {
  const router = useRouter()
  const { isDark } = useTheme()

  const [user, setUser]           = useState(null)
  const [progress, setProgress]   = useState([])
  const [quizAnswers, setQuizAnswers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState('recommended') // 'recommended' | 'all'
  const [search, setSearch]       = useState('')

  const bg      = isDark ? '#0f0e0c' : 'var(--stone-50)'
  const surface = isDark ? '#1a1814' : '#ffffff'
  const border  = isDark ? '#2e2b26' : 'var(--stone-200)'
  const ink     = isDark ? '#f0ede8' : 'var(--stone-900)'
  const inkDim  = isDark ? '#a8a298' : 'var(--stone-500)'

  useEffect(() => {
    async function load() {
      const { user: currentUser } = await getCurrentUser()
      if (!currentUser) { router.push('/auth'); return }
      setUser(currentUser)

      const [progressRes, quizRes] = await Promise.all([
        getLessonProgress(currentUser.id),
        getQuizAnswers(currentUser.id),
      ])

      setProgress(progressRes.data || [])
      setQuizAnswers(quizRes.data || [])
      setLoading(false)
    }
    load()
  }, [router])

  function getModuleCompleted(moduleId) {
    return progress.filter(p =>
      p.lessons?.module_id === moduleId && p.status === 'completed'
    ).length
  }

  const recommendedOrder = buildRecommendedOrder(quizAnswers)

  const displayModules = (() => {
    let mods = view === 'recommended'
      ? recommendedOrder.map(id => MODULES.find(m => m.id === id)).filter(Boolean)
      : MODULES

    if (search.trim()) {
      const s = search.toLowerCase()
      mods = mods.filter(m =>
        m.title.toLowerCase().includes(s) ||
        m.desc.toLowerCase().includes(s)
      )
    }

    return mods
  })()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
        <div className="spinner" />
      </div>
    )
  }

  const totalCompleted = progress.filter(p => p.status === 'completed').length

  return (
    <div style={{ minHeight: '100vh', background: bg }}>

      {/* Header */}
      <div style={{
        background: surface,
        borderBottom: `1px solid ${border}`,
        padding: '20px 20px 0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: ink, letterSpacing: '-0.5px' }}>
              Learn 📚
            </h1>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--penny-500)',
              background: 'var(--penny-50)',
              border: '1px solid var(--penny-200)',
              borderRadius: '100px',
              padding: '3px 10px',
            }}>
              {totalCompleted} lessons done
            </span>
          </div>

          {/* Search */}
          <input
            className="input"
            placeholder="Search modules..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: '12px', fontSize: '14px' }}
          />

          {/* View toggle */}
          <div style={{ display: 'flex', gap: '0', marginBottom: '0' }}>
            {[
              { key: 'recommended', label: 'For You' },
              { key: 'all',         label: 'All Modules' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${view === tab.key ? 'var(--penny-500)' : 'transparent'}`,
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  fontWeight: view === tab.key ? 700 : 400,
                  color: view === tab.key ? 'var(--penny-500)' : inkDim,
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.12s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Module list */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 20px 0' }}>

        {view === 'recommended' && quizAnswers.length === 0 && (
          <div style={{
            background: surface,
            border: `1px solid ${border}`,
            borderRadius: '14px',
            padding: '18px',
            marginBottom: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '20px' }}>🎯</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: ink, marginBottom: '4px' }}>
                Personalize your path
              </div>
              <div style={{ fontSize: '13px', color: inkDim, lineHeight: 1.5, marginBottom: '10px' }}>
                Take the quick quiz to get a learning path built around your specific situation.
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => router.push('/onboarding')}
              >
                Take the quiz →
              </button>
            </div>
          </div>
        )}

        {displayModules.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: inkDim }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', color: ink }}>No modules found</div>
            <div style={{ fontSize: '13px' }}>Try a different search term</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayModules.map((mod, index) => {
            const completed = getModuleCompleted(mod.id)
            const pct = Math.round((completed / mod.total) * 100)
            const isStarted = completed > 0
            const isDone = pct === 100

            return (
              <button
                key={mod.id}
                onClick={() => router.push(`/module/${mod.id}`)}
                style={{
                  background: surface,
                  border: `1px solid ${border}`,
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.12s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = mod.border
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = border
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Priority badge for recommended view */}
                {view === 'recommended' && index < 3 && !isDone && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '12px',
                    background: 'var(--penny-50)',
                    border: '1px solid var(--penny-200)',
                    color: 'var(--penny-600)',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.5px',
                    fontWeight: 700,
                  }}>
                    {index === 0 ? 'START HERE' : 'NEXT UP'}
                  </div>
                )}

                {/* Module icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: isDark ? (isDone ? '#164030' : '#2e2b26') : (isDone ? mod.bg : '#f4f2ee'),
                  border: `1.5px solid ${isDark ? (isDone ? '#1e5040' : '#3a3730') : (isDone ? mod.border : '#e8e4dc')}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px',
                  flexShrink: 0,
                }}>
                  {isDone ? '✅' : mod.emoji}
                </div>

                {/* Module info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: ink, marginBottom: '3px', lineHeight: 1.3 }}>
                    {mod.title}
                  </div>
                  <div style={{ fontSize: '12.5px', color: inkDim, marginBottom: '10px', lineHeight: 1.4 }}>
                    {mod.desc}
                  </div>

                  {/* Progress row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '4px', background: isDark ? '#2e2b26' : '#f4f2ee', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        background: isDone ? '#16a34a' : (isStarted ? mod.color : '#e8e4dc'),
                        width: `${pct}%`,
                        borderRadius: '2px',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: isDone ? '#16a34a' : inkDim,
                      flexShrink: 0,
                      fontWeight: isDone ? 700 : 400,
                    }}>
                      {isDone ? 'Complete ✓' : `${completed}/${mod.total}`}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

      </div>

      <BottomNav activeTab="learn" />
    </div>
  )
}