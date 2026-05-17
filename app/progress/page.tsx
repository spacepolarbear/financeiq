'use client'

// app/progress/page.js
// ─────────────────────────────────────────────────────────────
// Penny Progress Page
// Full overview of a user's learning journey:
// — Level and XP
// — Module completion map
// — Streak history
// — Badges earned
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getProfile, getStreak, getLessonProgress, supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import BottomNav from '../../components/BottomNav'

const MODULES = [
  { id: 1,  emoji: '💰', title: 'Budgeting',      total: 12, color: '#d4781a', bg: '#fdf8f0', border: '#f5d9a8' },
  { id: 2,  emoji: '🏦', title: 'Banking',         total: 10, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 3,  emoji: '⛓️', title: 'Debt',            total: 11, color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  { id: 4,  emoji: '📊', title: 'Credit',          total: 10, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { id: 5,  emoji: '📈', title: 'Investing',       total: 16, color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
  { id: 6,  emoji: '🛡️', title: 'Insurance',      total: 12, color: '#db2777', bg: '#fdf2f8', border: '#f9a8d4' },
  { id: 7,  emoji: '🌅', title: 'Retirement',      total: 12, color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
  { id: 8,  emoji: '🧾', title: 'Taxes',           total: 11, color: '#b45309', bg: '#fffbeb', border: '#fcd34d' },
  { id: 9,  emoji: '🏠', title: 'Housing',         total: 11, color: '#15803d', bg: '#f0fdf4', border: '#86efac' },
  { id: 10, emoji: '💼', title: 'Career',          total: 9,  color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  { id: 11, emoji: '🎯', title: 'Life Events',     total: 10, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 12, emoji: '🧠', title: 'Psychology',      total: 9,  color: '#6d28d9', bg: '#f5f3ff', border: '#c4b5fd' },
]

function xpToLevel(xp) {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000]
  let level = 1
  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1
    else break
  }
  const current = thresholds[Math.min(level - 1, thresholds.length - 1)]
  const next    = thresholds[Math.min(level, thresholds.length - 1)]
  return { level, progress: xp - current, needed: next - current, percent: Math.min(100, ((xp - current) / (next - current)) * 100) }
}

// Generate last 7 days of activity for the heatmap
function getLast7Days(progress) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const lessonsOnDay = (progress || []).filter(p => {
      if (!p.completed_at) return false
      return p.completed_at.split('T')[0] === dateStr
    }).length

    days.push({
      date: dateStr,
      count: lessonsOnDay,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: i === 0,
    })
  }
  return days
}

export default function ProgressPage() {
  const router = useRouter()
  const { isDark } = useTheme()

  const [user, setUser]         = useState(null)
  const [profile, setProfile]   = useState(null)
  const [streak, setStreak]     = useState(null)
  const [progress, setProgress] = useState([])
  const [badges, setBadges]     = useState([])
  const [loading, setLoading]   = useState(true)

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

      const [profileRes, streakRes, progressRes, badgesRes] = await Promise.all([
        getProfile(currentUser.id),
        getStreak(currentUser.id),
        getLessonProgress(currentUser.id),
        supabase.from('user_badges').select('*').eq('user_id', currentUser.id),
      ])

      setProfile(profileRes.data)
      setStreak(streakRes.data)
      setProgress(progressRes.data || [])
      setBadges(badgesRes.data || [])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
        <div className="spinner" />
      </div>
    )
  }

  const xpTotal    = profile?.xp_total || 0
  const levelInfo  = xpToLevel(xpTotal)
  const currentStreak = streak?.current_streak || 0
  const longestStreak = streak?.longest_streak || 0
  const completedLessons = progress.filter(p => p.status === 'completed').length
  const totalLessons = MODULES.reduce((sum, m) => sum + m.total, 0)
  const activityDays = getLast7Days(progress)

  // Module completion stats
  function getModuleCompleted(moduleId) {
    return progress.filter(p =>
      p.lessons?.module_id === moduleId && p.status === 'completed'
    ).length
  }

  const sectionLabel = {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: inkDim,
    marginBottom: '10px',
  }

  return (
    <div style={{ minHeight: '100vh', background: bg }}>

      {/* Header */}
      <div style={{
        background: surface,
        borderBottom: `1px solid ${border}`,
        padding: '20px 20px 16px',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: ink, letterSpacing: '-0.5px', marginBottom: '2px' }}>
            Your Progress 📊
          </h1>
          <p style={{ fontSize: '13px', color: inkDim }}>
            Every lesson. Every XP. Every win.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 20px 0' }}>

        {/* Level card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--penny-500), var(--penny-700))',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '20px',
          color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', opacity: 0.7, letterSpacing: '1px', marginBottom: '4px' }}>
                CURRENT LEVEL
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, lineHeight: 1 }}>
                {levelInfo.level}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', opacity: 0.7, letterSpacing: '1px', marginBottom: '4px' }}>
                TOTAL XP
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1 }}>
                {xpTotal.toLocaleString()}
              </div>
            </div>
          </div>

          {/* XP progress to next level */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.8, marginBottom: '6px' }}>
              <span>Level {levelInfo.level}</span>
              <span>{levelInfo.needed - levelInfo.progress} XP to Level {levelInfo.level + 1}</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: 'white',
                borderRadius: '3px',
                width: `${levelInfo.percent}%`,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
          {[
            { label: 'Streak', value: `${currentStreak}🔥` },
            { label: 'Best',   value: `${longestStreak}d` },
            { label: 'Done',   value: completedLessons },
            { label: 'Badges', value: badges.length },
          ].map((s, i) => (
            <div key={i} style={{
              background: surface,
              border: `1px solid ${border}`,
              borderRadius: '12px',
              padding: '12px 8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--penny-500)', lineHeight: 1, marginBottom: '3px' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '9px', color: inkDim, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* 7-day activity */}
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionLabel}>Last 7 Days</div>
          <div style={{
            background: surface,
            border: `1px solid ${border}`,
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            gap: '8px',
            justifyContent: 'space-between',
          }}>
            {activityDays.map((day, i) => {
              const intensity = day.count === 0 ? 0 : day.count === 1 ? 1 : day.count <= 3 ? 2 : 3
              const colors = ['var(--stone-100)', 'var(--penny-100)', 'var(--penny-300)', 'var(--penny-500)']
              const darkColors = ['#2e2b26', '#4a300e', '#6b4010', '#d4781a']
              const color = isDark ? darkColors[intensity] : colors[intensity]

              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '6px',
                    background: color,
                    border: day.isToday ? '2px solid var(--penny-500)' : 'none',
                    transition: 'background 0.2s',
                  }} />
                  <span style={{ fontSize: '9px', color: inkDim, fontFamily: 'var(--font-mono)' }}>
                    {day.label}
                  </span>
                  {day.count > 0 && (
                    <span style={{ fontSize: '9px', color: 'var(--penny-500)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {day.count}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Overall lesson completion */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ ...sectionLabel, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Overall Completion</span>
            <span style={{ color: 'var(--penny-500)', fontSize: '12px' }}>
              {completedLessons}/{totalLessons} lessons
            </span>
          </div>
          <div style={{
            background: surface,
            border: `1px solid ${border}`,
            borderRadius: '14px',
            padding: '16px',
          }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ fontWeight: 700, color: ink }}>
                  {Math.round((completedLessons / totalLessons) * 100)}% complete
                </span>
                <span style={{ color: inkDim }}>
                  {totalLessons - completedLessons} remaining
                </span>
              </div>
              <div className="progress-track" style={{ height: '10px' }}>
                <div className="progress-fill" style={{ width: `${(completedLessons / totalLessons) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Module breakdown */}
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionLabel}>Module Progress</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MODULES.map((mod) => {
              const completed = getModuleCompleted(mod.id)
              const pct = Math.round((completed / mod.total) * 100)

              return (
                <button
                  key={mod.id}
                  onClick={() => router.push(`/module/${mod.id}`)}
                  style={{
                    background: surface,
                    border: `1px solid ${border}`,
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = mod.border }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = border }}
                >
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: '10px',
                    background: mod.bg,
                    border: `1px solid ${mod.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}>
                    {mod.emoji}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: ink }}>{mod.title}</span>
                      <span style={{ fontSize: '11px', color: inkDim, fontFamily: 'var(--font-mono)', flexShrink: 0, marginLeft: '8px' }}>
                        {completed}/{mod.total}
                      </span>
                    </div>
                    <div style={{ height: '4px', background: isDark ? '#2e2b26' : 'var(--stone-100)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        borderRadius: '2px',
                        background: pct === 100 ? 'var(--forest-500)' : mod.color,
                        width: `${pct}%`,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>

                  {pct === 100 && (
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>✅</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Recent badges */}
        {badges.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={sectionLabel}>Recent Badges</div>
            <div style={{
              background: surface,
              border: `1px solid ${border}`,
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              {badges.slice(0, 6).map((badge, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '48px', height: '48px',
                    borderRadius: '12px',
                    background: 'var(--penny-50)',
                    border: '1.5px solid var(--penny-200)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px',
                  }}>
                    {badge.badge_emoji || '🏅'}
                  </div>
                  <span style={{ fontSize: '9px', color: inkDim, fontFamily: 'var(--font-mono)', textAlign: 'center', maxWidth: '52px' }}>
                    {badge.badge_key?.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
              {badges.length > 6 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '48px', height: '48px',
                  borderRadius: '12px',
                  background: isDark ? '#2e2b26' : 'var(--stone-100)',
                  border: `1px solid ${border}`,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: inkDim,
                }}>
                  +{badges.length - 6}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <BottomNav activeTab="progress" />
    </div>
  )
}