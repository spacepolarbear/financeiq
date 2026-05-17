'use client'

// app/simulate/page.js
// ─────────────────────────────────────────────────────────────
// Penny Simulations Hub
// Shows all available life scenario simulations.
// Free users can access basic sims; premium unlocks advanced.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getProfile } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import BottomNav from '../../components/BottomNav'

const SIMULATIONS = [
  {
    key:       'survive_college_debt',
    emoji:     '🎓',
    title:     'Survive College with Debt',
    desc:      'Student loans, a tight budget, and your first real financial decisions. Can you graduate without drowning?',
    difficulty:'beginner',
    duration:  '8 min',
    xp:        30,
    premium:   false,
    tags:      ['debt', 'budgeting', 'student loans'],
    color:     '#2563eb',
    bg:        '#eff6ff',
    border:    '#bfdbfe',
  },
  {
    key:       'first_apartment',
    emoji:     '🏠',
    title:     'First Apartment',
    desc:      'Security deposits, utilities, renter\'s insurance, and a landlord who doesn\'t respond. Welcome to adulting.',
    difficulty:'beginner',
    duration:  '7 min',
    xp:        25,
    premium:   false,
    tags:      ['housing', 'budgeting', 'insurance'],
    color:     '#16a34a',
    bg:        '#f0fdf4',
    border:    '#86efac',
  },
  {
    key:       'paycheck_decisions',
    emoji:     '💵',
    title:     'Paycheck Decisions',
    desc:      'You got paid $1,200. Rent is due in 5 days. Your friends want to go out. What do you do first?',
    difficulty:'beginner',
    duration:  '5 min',
    xp:        20,
    premium:   false,
    tags:      ['budgeting', 'spending'],
    color:     'var(--penny-600)',
    bg:        'var(--penny-50)',
    border:    'var(--penny-200)',
  },
  {
    key:       'job_loss',
    emoji:     '💼',
    title:     'Job Loss Survival',
    desc:      'Your income stops tomorrow. COBRA, unemployment, emergency fund — how long can you last and what do you do first?',
    difficulty:'intermediate',
    duration:  '10 min',
    xp:        40,
    premium:   false,
    tags:      ['emergency fund', 'insurance', 'budgeting'],
    color:     '#b45309',
    bg:        '#fffbeb',
    border:    '#fcd34d',
  },
  {
    key:       'credit_card_trap',
    emoji:     '💳',
    title:     'Escaping Credit Card Debt',
    desc:      '$8,400 across three cards at 22–26% APR. Avalanche or snowball? Consolidate or not? Your moves, your outcome.',
    difficulty:'intermediate',
    duration:  '10 min',
    xp:        40,
    premium:   false,
    tags:      ['debt', 'credit', 'payoff strategy'],
    color:     '#dc2626',
    bg:        '#fef2f2',
    border:    '#fca5a5',
  },
  {
    key:       'broke_after_breakup',
    emoji:     '💔',
    title:     'Broke After a Breakup',
    desc:      'You split with a partner, split the apartment, and now face rent alone on one income. Rebuild without falling apart.',
    difficulty:'intermediate',
    duration:  '9 min',
    xp:        35,
    premium:   true,
    tags:      ['budgeting', 'housing', 'life events'],
    color:     '#7c3aed',
    bg:        '#f5f3ff',
    border:    '#c4b5fd',
  },
  {
    key:       'buying_first_car',
    emoji:     '🚗',
    title:     'Buying Your First Car',
    desc:      'New vs. used. Loan vs. cash. Dealership vs. private seller. Every decision has a cost — make the right ones.',
    difficulty:'intermediate',
    duration:  '9 min',
    xp:        35,
    premium:   true,
    tags:      ['debt', 'negotiation', 'major purchase'],
    color:     '#0f766e',
    bg:        '#f0fdfa',
    border:    '#99f6e4',
  },
  {
    key:       'investing_recession',
    emoji:     '📉',
    title:     'Investing Through a Recession',
    desc:      'Markets drop 30% in 6 weeks. Do you panic sell? Hold? Buy more? Each choice plays out over a simulated 5 years.',
    difficulty:'advanced',
    duration:  '12 min',
    xp:        50,
    premium:   true,
    tags:      ['investing', 'psychology', 'market volatility'],
    color:     '#7c3aed',
    bg:        '#f5f3ff',
    border:    '#c4b5fd',
  },
  {
    key:       'raising_kids_budget',
    emoji:     '👨‍👩‍👧',
    title:     'Raising Kids on a Budget',
    desc:      'Childcare, school supplies, unexpected medical bills, college savings — and you still need to retire someday.',
    difficulty:'advanced',
    duration:  '12 min',
    xp:        50,
    premium:   true,
    tags:      ['family', 'budgeting', 'life events', 'investing'],
    color:     '#1d4ed8',
    bg:        '#eff6ff',
    border:    '#bfdbfe',
  },
  {
    key:       'emergency_fund_build',
    emoji:     '🆘',
    title:     'Building an Emergency Fund',
    desc:      'Starting from zero, unexpected expenses keep hitting. How do you build a cushion when every month is tight?',
    difficulty:'beginner',
    duration:  '7 min',
    xp:        25,
    premium:   false,
    tags:      ['emergency fund', 'budgeting', 'saving'],
    color:     '#16a34a',
    bg:        '#f0fdf4',
    border:    '#86efac',
  },
]

const DIFFICULTY_STYLES = {
  beginner:     { label: 'Beginner',     bg: '#f0fdf4', color: '#16a34a' },
  intermediate: { label: 'Intermediate', bg: '#fffbeb', color: '#b45309' },
  advanced:     { label: 'Advanced',     bg: '#fef2f2', color: '#dc2626' },
}

export default function SimulatePage() {
  const router = useRouter()
  const { isDark } = useTheme()

  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

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
      const { data } = await getProfile(currentUser.id)
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [router])

  const isPremium = profile?.subscription_tier === 'premium'

  const FILTERS = ['all', 'free', 'beginner', 'intermediate', 'advanced']

  const filtered = SIMULATIONS.filter(sim => {
    if (filter === 'free') return !sim.premium
    if (filter === 'beginner')     return sim.difficulty === 'beginner'
    if (filter === 'intermediate') return sim.difficulty === 'intermediate'
    if (filter === 'advanced')     return sim.difficulty === 'advanced'
    return true
  })

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: bg }}>

      {/* Header */}
      <div style={{
        background: surface,
        borderBottom: `1px solid ${border}`,
        padding: '20px 20px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: ink, letterSpacing: '-0.5px', marginBottom: '4px' }}>
            Simulations 🎯
          </h1>
          <p style={{ fontSize: '13px', color: inkDim, marginBottom: '14px' }}>
            Real financial decisions. Zero real consequences.
          </p>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '100px',
                  border: `1.5px solid ${filter === f ? 'var(--penny-400)' : border}`,
                  background: filter === f ? 'var(--penny-50)' : 'transparent',
                  color: filter === f ? 'var(--penny-600)' : inkDim,
                  fontSize: '12px',
                  fontWeight: filter === f ? 700 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'capitalize',
                  letterSpacing: '0.3px',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sims grid */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 20px 0' }}>

        {/* Premium banner for free users */}
        {!isPremium && (
          <div style={{
            background: 'linear-gradient(135deg, var(--penny-500), var(--penny-600))',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '3px' }}>
                🔓 Unlock all {SIMULATIONS.filter(s => s.premium).length} premium simulations
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Upgrade to Penny Premium for full access
              </div>
            </div>
            <button
              className="btn btn-sm"
              style={{ background: 'white', color: 'var(--penny-600)', fontWeight: 700, flexShrink: 0 }}
              onClick={() => router.push('/upgrade')}
            >
              Upgrade →
            </button>
          </div>
        )}

        {/* Simulation cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((sim) => {
            const locked = sim.premium && !isPremium
            const diffStyle = DIFFICULTY_STYLES[sim.difficulty]

            return (
              <button
                key={sim.key}
                onClick={() => !locked && router.push(`/simulate/${sim.key}`)}
                style={{
                  background: surface,
                  border: `1px solid ${border}`,
                  borderRadius: '16px',
                  padding: '18px',
                  cursor: locked ? 'default' : 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  opacity: locked ? 0.7 : 1,
                  transition: 'all 0.12s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  if (!locked) {
                    e.currentTarget.style.borderColor = sim.border
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = border
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Left color bar */}
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: '4px',
                  background: sim.color,
                  borderRadius: '16px 0 0 16px',
                }} />

                <div style={{ paddingLeft: '12px' }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '28px', lineHeight: 1, flexShrink: 0 }}>{sim.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: ink, lineHeight: 1.3 }}>
                          {sim.title}
                        </span>
                        {locked && (
                          <span style={{
                            fontSize: '10px',
                            background: 'var(--penny-50)',
                            border: '1px solid var(--penny-200)',
                            color: 'var(--penny-600)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.5px',
                          }}>
                            ⭐ PREMIUM
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: inkDim, lineHeight: 1.5, margin: 0 }}>
                        {sim.desc}
                      </p>
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: diffStyle.bg,
                      color: diffStyle.color,
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {diffStyle.label}
                    </span>
                    <span style={{ fontSize: '11px', color: inkDim, fontFamily: 'var(--font-mono)' }}>
                      ⏱ {sim.duration}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--penny-500)', fontFamily: 'var(--font-mono)', fontWeight: 700, marginLeft: 'auto' }}>
                      +{sim.xp} XP
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <BottomNav activeTab="simulate" />
    </div>
  )
}