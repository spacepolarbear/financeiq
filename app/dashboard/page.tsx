// @ts-nocheck 
'use client'
// app/dashboard/page.js
// ─────────────────────────────────────────────────────────────
// Penny Dashboard — Main App Shell
// Shows the user's learning path, streak, XP, and daily lesson.
// Protected route — redirects to /auth if not logged in.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser, getProfile, getStreak, getLessonProgress, signOut } from '../../lib/supabase'

// ─── Module data (matches our 12 modules) ───────────────────
const MODULES = [
  { id: 1,  emoji: '💰', title: 'Budgeting & Cash Flow',   color: '#d4781a', bg: '#fdf8f0', border: '#f5d9a8' },
  { id: 2,  emoji: '🏦', title: 'Banking',                  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 3,  emoji: '⛓️', title: 'Debt Management',          color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  { id: 4,  emoji: '📊', title: 'Credit & Credit Scores',   color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { id: 5,  emoji: '📈', title: 'Investing',                color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
  { id: 6,  emoji: '🛡️', title: 'Insurance',               color: '#db2777', bg: '#fdf2f8', border: '#f9a8d4' },
  { id: 7,  emoji: '🌅', title: 'Retirement Planning',      color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
  { id: 8,  emoji: '🧾', title: 'Taxes',                    color: '#b45309', bg: '#fffbeb', border: '#fcd34d' },
  { id: 9,  emoji: '🏠', title: 'Housing & Real Estate',    color: '#15803d', bg: '#f0fdf4', border: '#86efac' },
  { id: 10, emoji: '💼', title: 'Career & Income Growth',   color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  { id: 11, emoji: '🎯', title: 'Major Life Events',        color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 12, emoji: '🧠', title: 'Psychology of Money',      color: '#6d28d9', bg: '#f5f3ff', border: '#c4b5fd' },
]

// ─── XP to Level ────────────────────────────────────────────
function xpToLevel(xp) {
  if (xp < 100)  return { level: 1, next: 100,  progress: xp }
  if (xp < 250)  return { level: 2, next: 250,  progress: xp - 100 }
  if (xp < 500)  return { level: 3, next: 500,  progress: xp - 250 }
  if (xp < 1000) return { level: 4, next: 1000, progress: xp - 500 }
  if (xp < 2000) return { level: 5, next: 2000, progress: xp - 1000 }
  return { level: Math.floor(xp / 500), next: Math.ceil(xp / 500) * 500, progress: xp % 500 }
}

// ─── Component ───────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()

  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(null)
  const [streak, setStreak]       = useState(null)
  const [progress, setProgress]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [nextLesson, setNextLesson] = useState(null)
  // ─── Load user data ───
  useEffect(() => {
    async function loadData() {
  const { user: currentUser } = await getCurrentUser()

  if (!currentUser) {
    router.push('/auth')
    return
  }

  setUser(currentUser)

  // Load profile, streak, and progress in parallel
  const [profileRes, streakRes, progressRes, lessonsRes, completedRes] = await Promise.all([
    getProfile(currentUser.id),
    getStreak(currentUser.id),
    getLessonProgress(currentUser.id),
    supabase.from('lessons').select('*').order('module_id', { ascending: true }).order('sort_order', { ascending: true }),
    supabase.from('lesson_progress').select('lesson_id').eq('user_id', currentUser.id).eq('status', 'completed'),
  ])

  setProfile(profileRes.data)
  setStreak(streakRes.data)
  setProgress(progressRes.data || [])

  // Find next incomplete lesson
  const completedIds = new Set((completedRes.data || []).map(l => l.lesson_id))
const next = (lessonsRes.data || []).find(l => !completedIds.has(l.id))
console.log('All lessons:', lessonsRes.data?.length)
console.log('Completed IDs:', [...completedIds])
console.log('Next lesson:', next)
if (next) setNextLesson(next)

  setLoading(false)
}
    loadData()
  }, [router])

  // ─── Sign out ───
  async function handleSignOut() {
    await signOut()
    router.push('/auth')
  }

  // ─── Derived stats ───
  const displayName   = profile?.display_name || user?.user_metadata?.display_name || 'there'
  const xpTotal       = profile?.xp_total || 0
  const levelInfo     = xpToLevel(xpTotal)
  const currentStreak = streak?.current_streak || 0
  const completedCount = progress.filter(p => p.status === 'completed').length

  // ─── Loading state ───
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--stone-50)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{
          width: '48px', height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--penny-400), var(--penny-600))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-penny)',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '22px', color: 'white' }}>p</span>
        </div>
        <div className="spinner" />
      </div>
    )
  }

  // ─── Styles ───
  const S = {
    page: {
      minHeight: '100vh',
      background: 'var(--stone-50)',
      paddingBottom: '80px', // space for bottom nav
    },
    topBar: {
      background: 'white',
      borderBottom: '1px solid var(--stone-200)',
      padding: '0 20px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    },
    logo: {
      display: 'flex', alignItems: 'center', gap: '8px',
    },
    mark: {
      width: '30px', height: '30px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--penny-400), var(--penny-600))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'var(--shadow-penny)',
    },
    streakBadge: {
      display: 'flex', alignItems: 'center', gap: '4px',
      background: 'var(--penny-50)',
      border: '1px solid var(--penny-200)',
      borderRadius: '100px',
      padding: '4px 12px',
      fontSize: '13px',
      fontWeight: 700,
      color: 'var(--penny-600)',
      fontFamily: 'var(--font-mono)',
    },
    main: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '24px 20px',
    },
    greeting: {
      marginBottom: '24px',
    },
    greetingText: {
      fontFamily: 'var(--font-display)',
      fontSize: '26px',
      fontStyle: 'italic',
      color: 'var(--stone-900)',
      marginBottom: '4px',
    },
    greetingSub: {
      fontSize: '14px',
      color: 'var(--stone-500)',
      fontWeight: 300,
    },
    statsRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px',
      marginBottom: '24px',
    },
    statCard: {
      background: 'white',
      border: '1px solid var(--stone-200)',
      borderRadius: '14px',
      padding: '14px',
      textAlign: 'center',
    },
    statNum: {
      fontSize: '22px',
      fontWeight: 800,
      color: 'var(--penny-500)',
      lineHeight: 1,
      marginBottom: '4px',
    },
    statLabel: {
      fontSize: '11px',
      color: 'var(--stone-400)',
      fontFamily: 'var(--font-mono)',
      letterSpacing: '1px',
      textTransform: 'uppercase',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 700,
      color: 'var(--stone-900)',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    // Level progress
    levelCard: {
      background: 'white',
      border: '1px solid var(--stone-200)',
      borderRadius: '14px',
      padding: '16px',
      marginBottom: '24px',
    },
    levelRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '8px',
    },
    levelBadge: {
      background: 'var(--penny-50)',
      border: '1px solid var(--penny-200)',
      color: 'var(--penny-600)',
      borderRadius: '8px',
      padding: '4px 10px',
      fontSize: '13px',
      fontWeight: 700,
      fontFamily: 'var(--font-mono)',
    },
    xpText: {
      fontSize: '12px',
      color: 'var(--stone-400)',
      fontFamily: 'var(--font-mono)',
    },
    // Module cards
    moduleCard: {
      background: 'white',
      border: '1px solid var(--stone-200)',
      borderRadius: '14px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      marginBottom: '10px',
      cursor: 'pointer',
      transition: 'all 0.12s',
    },
    moduleIcon: (mod) => ({
      width: '44px', height: '44px',
      borderRadius: '12px',
      background: mod.bg,
      border: `1px solid ${mod.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '20px',
      flexShrink: 0,
    }),
    moduleTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: 'var(--stone-900)',
      marginBottom: '3px',
    },
    moduleProgress: {
      fontSize: '11.5px',
      color: 'var(--stone-400)',
      fontFamily: 'var(--font-mono)',
    },
    moduleArrow: {
      marginLeft: 'auto',
      color: 'var(--stone-300)',
      fontSize: '16px',
      flexShrink: 0,
    },
    // Bottom nav
    bottomNav: {
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: 'white',
      borderTop: '1px solid var(--stone-200)',
      display: 'flex',
      height: '64px',
      zIndex: 10,
    },
    navItem: (active) => ({
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '3px',
      cursor: 'pointer',
      border: 'none',
      background: 'transparent',
      padding: '8px 0',
      transition: 'all 0.12s',
    }),
    navIcon: (active) => ({
      fontSize: '20px',
      filter: active ? 'none' : 'grayscale(100%)',
      opacity: active ? 1 : 0.5,
    }),
    navLabel: (active) => ({
      fontSize: '10px',
      fontFamily: 'var(--font-mono)',
      letterSpacing: '0.5px',
      color: active ? 'var(--penny-500)' : 'var(--stone-400)',
      fontWeight: active ? 700 : 400,
    }),
  }

  return (
    <div style={S.page}>

      {/* Top Bar */}
      <div style={S.topBar}>
        <div style={S.logo}>
          <div style={S.mark}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '15px', color: 'white' }}>p</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '18px', color: 'var(--penny-600)' }}>penny</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={S.streakBadge}>
            <span className="streak-flame">🔥</span>
            {currentStreak}
          </div>
          <button
            onClick={handleSignOut}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--stone-400)', fontFamily: 'var(--font-body)' }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={S.main}>

        {/* Greeting */}
        <div style={S.greeting}>
          <div style={S.greetingText}>
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {displayName} 👋
          </div>
          <div style={S.greetingSub}>
            {currentStreak > 0
              ? `You're on a ${currentStreak}-day streak. Keep it going!`
              : "Ready to learn something new today?"}
          </div>
        </div>

        {/* Stats Row */}
        <div style={S.statsRow}>
          <div style={S.statCard}>
            <div style={S.statNum}>{currentStreak}<span className="streak-flame" style={{ fontSize: '16px' }}>🔥</span></div>
            <div style={S.statLabel}>Day Streak</div>
          </div>
          <div style={S.statCard}>
            <div style={S.statNum}>{xpTotal}</div>
            <div style={S.statLabel}>Total XP</div>
          </div>
          <div style={S.statCard}>
            <div style={S.statNum}>{completedCount}</div>
            <div style={S.statLabel}>Lessons Done</div>
          </div>
        </div>

        {/* Level Progress */}
        <div style={S.levelCard}>
          <div style={S.levelRow}>
            <span style={S.levelBadge}>Level {levelInfo.level}</span>
            <span style={S.xpText}>{levelInfo.progress} / {levelInfo.next - (levelInfo.level === 1 ? 0 : levelInfo.next - 150)} XP to next level</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, (levelInfo.progress / (levelInfo.next / levelInfo.level)) * 100)}%` }}
            />
          </div>
        </div>

       {/* Today's Focus */}
<div style={S.sectionTitle}>
  ⚡ Today's Focus
</div>
<div style={{
  background: 'linear-gradient(135deg, var(--penny-500), var(--penny-600))',
  borderRadius: '16px',
  padding: '20px',
  color: 'white',
  marginBottom: '28px',
  cursor: 'pointer',
}}
onClick={() => router.push(`/lesson/${nextLesson ? nextLesson.lesson_number.replace('.', '-') : '1-1'}`)}>
  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', opacity: 0.7, marginBottom: '8px', letterSpacing: '1px' }}>
    {nextLesson ? `LESSON ${nextLesson.lesson_number} · ${nextLesson.difficulty?.toUpperCase()} · ${nextLesson.estimated_minutes} MIN` : 'LESSON 1.1 · BEGINNER · 3 MIN'}
  </div>
  <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
    {nextLesson ? nextLesson.title : 'Why You Feel Broke Even When You\'re Working'}
  </div>
  <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '16px', lineHeight: 1.5 }}>
    {nextLesson ? `Module ${nextLesson.module_id} · ${nextLesson.difficulty} lesson` : 'The psychology of spending blind.'}
  </div>
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 600,
  }}>
    Start Lesson → <span style={{ fontSize: '12px', opacity: 0.8, fontFamily: 'var(--font-mono)' }}>+{nextLesson?.xp_reward || 10} XP</span>
  </div>
</div>

        {/* Learning Path */}
        <div style={S.sectionTitle}>
          📚 Your Learning Path
        </div>
        {MODULES.map((mod) => {
          const modProgress = progress.filter(p => p.lessons?.module_id === mod.id)
          const completed = modProgress.filter(p => p.status === 'completed').length
          const total = modProgress.length || 0

          return (
            <div
              key={mod.id}
              style={S.moduleCard}
              onClick={() => router.push(`/module/${mod.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = mod.border
                e.currentTarget.style.boxShadow = 'var(--shadow-card-md)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--stone-200)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={S.moduleIcon(mod)}>{mod.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.moduleTitle}>{mod.title}</div>
                <div style={S.moduleProgress}>
                  {total > 0 ? `${completed}/${total} lessons` : 'Not started'}
                </div>
                {total > 0 && (
                  <div className="progress-track" style={{ height: '4px', marginTop: '6px' }}>
                    <div
                      className="progress-fill"
                      style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                    />
                  </div>
                )}
              </div>
              <div style={S.moduleArrow}>›</div>
            </div>
          )
        })}

      </div>

      {/* Bottom Navigation */}
      <div style={S.bottomNav}>
        {[
            { key: 'home',     icon: '🏠', label: 'HOME',     route: '/dashboard' },
            { key: 'learn',    icon: '📚', label: 'LEARN',    route: '/learn' },
            { key: 'simulate', icon: '🎯', label: 'SIMULATE', route: '/simulate' },
            { key: 'progress', icon: '📊', label: 'PROGRESS', route: '/progress' },
            { key: 'profile',  icon: '👤', label: 'PROFILE',  route: '/profile' },
        ].map((tab) => (
          <button
            key={tab.key}
            style={S.navItem(activeTab === tab.key)}
            onClick={() => router.push(tab.route)}
          >
            <span style={S.navIcon(activeTab === tab.key)}>{tab.icon}</span>
            <span style={S.navLabel(activeTab === tab.key)}>{tab.label}</span>
          </button>
        ))}
      </div>

    </div>
  )
}