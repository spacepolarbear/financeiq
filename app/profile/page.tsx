// @ts-nocheck
'use client'

// app/profile/page.js
// ─────────────────────────────────────────────────────────────
// Penny Profile Page
// Shows user info, stats, theme toggle, settings, and badges.
// Protected route.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getProfile, getStreak, supabase, signOut, updateProfile } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import BottomNav from '../../components/BottomNav'

// ─── All badge definitions ────────────────────────────────────
const ALL_BADGES = [
  { key: 'first_lesson',        emoji: '🌱', label: 'First Step',       desc: 'Completed your first lesson' },
  { key: '7_day_streak',        emoji: '🔥', label: 'Week Warrior',     desc: '7-day learning streak' },
  { key: '30_day_streak',       emoji: '⚡', label: 'On Fire',          desc: '30-day learning streak' },
  { key: 'module_complete',     emoji: '📚', label: 'Module Master',    desc: 'Completed a full module' },
  { key: 'quiz_perfect',        emoji: '🎯', label: 'Perfect Score',    desc: 'Got 100% on a quiz' },
  { key: 'simulation_great',    emoji: '🏆', label: 'Smart Mover',     desc: 'Made the best choice in a simulation' },
  { key: 'debt_free_mindset',   emoji: '⛓️', label: 'Breaking Free',   desc: 'Completed the Debt module' },
  { key: 'investor',            emoji: '📈', label: 'Investor',         desc: 'Completed the Investing module' },
  { key: 'budget_builder',      emoji: '💰', label: 'Budget Builder',   desc: 'Completed the Budgeting module' },
  { key: 'tax_savvy',           emoji: '🧾', label: 'Tax Savvy',        desc: 'Completed the Taxes module' },
  { key: 'insurance_pro',       emoji: '🛡️', label: 'Protected',       desc: 'Completed the Insurance module' },
  { key: 'retirement_ready',    emoji: '🌅', label: 'Future Ready',     desc: 'Completed the Retirement module' },
  { key: 'level_5',             emoji: '⭐', label: 'Level 5',          desc: 'Reached Level 5' },
  { key: 'level_10',            emoji: '💎', label: 'Level 10',         desc: 'Reached Level 10' },
  { key: 'early_adopter',       emoji: '🪙', label: 'Early Adopter',    desc: 'Joined Penny in the first year' },
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
  return { level, progress: xp - current, needed: next - current }
}

export default function ProfilePage() {
  const router = useRouter()
  const { theme, toggleTheme, isDark } = useTheme()

  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(null)
  const [streak, setStreak]       = useState(null)
  const [earnedBadges, setEarnedBadges] = useState([])
  const [loading, setLoading]     = useState(true)
  const [editingName, setEditingName]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [saveMsg, setSaveMsg]     = useState(null)

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

      const [profileRes, streakRes, badgesRes] = await Promise.all([
        getProfile(currentUser.id),
        import('../../lib/supabase').then(m => m.getStreak(currentUser.id)),
        supabase.from('user_badges').select('*').eq('user_id', currentUser.id),
      ])

      setProfile(profileRes.data)
      setStreak(streakRes.data)
      setEarnedBadges(badgesRes.data?.map(b => b.badge_key) || [])
      setNewName(profileRes.data?.display_name || '')
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSaveName() {
    if (!newName.trim() || !user) return
    setSaving(true)
    await updateProfile(user.id, { display_name: newName.trim() })
    setProfile(prev => ({ ...prev, display_name: newName.trim() }))
    setSaving(false)
    setEditingName(false)
    setSaveMsg('Name updated!')
    setTimeout(() => setSaveMsg(null), 2000)
  }

  async function handleSignOut() {
    await signOut()
    router.push('/auth')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
        <div className="spinner" />
      </div>
    )
  }

  const displayName  = profile?.display_name || user?.email?.split('@')[0] || 'there'
  const xpTotal      = profile?.xp_total || 0
  const levelInfo    = xpToLevel(xpTotal)
  const currentStreak = streak?.current_streak || 0
  const longestStreak = streak?.longest_streak || 0
  const isPremium    = profile?.subscription_tier === 'premium'

  const S = {
    page: { minHeight: '100vh', background: bg, paddingBottom: '20px' },
    section: { marginBottom: '24px', padding: '0 20px' },
    sectionLabel: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      letterSpacing: '2px',
      textTransform: 'uppercase',
      color: inkDim,
      marginBottom: '10px',
    },
    card: {
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: '16px',
      overflow: 'hidden',
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 18px',
      borderBottom: `1px solid ${border}`,
      cursor: 'pointer',
    },
    rowLast: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 18px',
    },
    rowLabel: { fontSize: '14px', fontWeight: 500, color: ink },
    rowValue: { fontSize: '13.5px', color: inkDim, fontFamily: 'var(--font-mono)' },
    toggle: (active) => ({
      width: '44px', height: '24px',
      borderRadius: '12px',
      background: active ? 'var(--penny-500)' : (isDark ? '#44403a' : 'var(--stone-200)'),
      position: 'relative',
      cursor: 'pointer',
      transition: 'background 0.2s',
      border: 'none',
      flexShrink: 0,
    }),
    toggleDot: (active) => ({
      position: 'absolute',
      top: '3px',
      left: active ? '23px' : '3px',
      width: '18px', height: '18px',
      borderRadius: '50%',
      background: 'white',
      transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }),
  }

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{
        background: surface,
        borderBottom: `1px solid ${border}`,
        padding: '20px 20px 24px',
        marginBottom: '24px',
      }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>

          {/* Avatar */}
          <div style={{
            width: '72px', height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--penny-400), var(--penny-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 0 0 3px var(--penny-100), var(--shadow-penny)',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '32px', color: 'white' }}>
              {displayName[0]?.toUpperCase() || 'P'}
            </span>
          </div>

          {/* Name */}
          {editingName ? (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
              <input
                className="input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={{ maxWidth: '200px', textAlign: 'center', fontSize: '16px', fontWeight: 700 }}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                autoFocus
              />
              <button className="btn btn-primary btn-sm" onClick={handleSaveName} disabled={saving}>
                {saving ? '...' : 'Save'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingName(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <div
              style={{ cursor: 'pointer', marginBottom: '4px' }}
              onClick={() => setEditingName(true)}
            >
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: ink, letterSpacing: '-0.5px' }}>
                {displayName} <span style={{ fontSize: '14px', color: 'var(--penny-500)' }}>✎</span>
              </h1>
            </div>
          )}

          {saveMsg && (
            <div style={{ fontSize: '12px', color: 'var(--forest-500)', fontWeight: 600, marginBottom: '4px' }}>
              {saveMsg}
            </div>
          )}

          <div style={{ fontSize: '13px', color: inkDim, marginBottom: '16px' }}>
            {user?.email}
          </div>

          {/* Tier badge */}
          {isPremium ? (
            <span className="badge badge-copper" style={{ fontSize: '12px', padding: '5px 14px' }}>
              ⭐ Premium
            </span>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => router.push('/upgrade')}
            >
              Upgrade to Premium →
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Stats */}
        <div style={S.section}>
          <div style={S.sectionLabel}>Your Stats</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
            {[
              { label: 'Level', value: levelInfo.level, emoji: '⭐' },
              { label: 'Total XP', value: xpTotal.toLocaleString(), emoji: '✨' },
              { label: 'Streak', value: `${currentStreak}🔥`, emoji: '' },
              { label: 'Best Streak', value: `${longestStreak} days`, emoji: '' },
              { label: 'Lessons Done', value: profile?.lessons_completed || 0, emoji: '' },
              { label: 'Modules Done', value: profile?.modules_completed || 0, emoji: '' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: surface,
                border: `1px solid ${border}`,
                borderRadius: '12px',
                padding: '14px 10px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--penny-500)', lineHeight: 1, marginBottom: '4px' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '10px', color: inkDim, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Level progress bar */}
          <div style={{
            background: surface,
            border: `1px solid ${border}`,
            borderRadius: '12px',
            padding: '14px 16px',
            marginTop: '10px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ fontWeight: 700, color: ink }}>Level {levelInfo.level}</span>
              <span style={{ color: inkDim, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                {levelInfo.progress}/{levelInfo.needed} XP
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (levelInfo.progress / levelInfo.needed) * 100)}%` }}
              />
            </div>
            <div style={{ fontSize: '11px', color: inkDim, marginTop: '6px', textAlign: 'center' }}>
              {levelInfo.needed - levelInfo.progress} XP until Level {levelInfo.level + 1}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div style={S.section}>
          <div style={S.sectionLabel}>Badges — {earnedBadges.length}/{ALL_BADGES.length}</div>
          <div style={{
            background: surface,
            border: `1px solid ${border}`,
            borderRadius: '16px',
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '12px',
          }}>
            {ALL_BADGES.map((badge) => {
              const earned = earnedBadges.includes(badge.key)
              return (
                <div
                  key={badge.key}
                  title={`${badge.label}: ${badge.desc}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: earned ? 1 : 0.25,
                    filter: earned ? 'none' : 'grayscale(100%)',
                    cursor: 'default',
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: '12px',
                    background: earned ? 'var(--penny-50)' : (isDark ? '#2e2b26' : 'var(--stone-100)'),
                    border: `1.5px solid ${earned ? 'var(--penny-300)' : border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px',
                  }}>
                    {badge.emoji}
                  </div>
                  <span style={{ fontSize: '9px', color: inkDim, textAlign: 'center', fontFamily: 'var(--font-mono)', letterSpacing: '0.3px', lineHeight: 1.3 }}>
                    {badge.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Settings */}
        <div style={S.section}>
          <div style={S.sectionLabel}>Settings</div>
          <div style={S.card}>

            {/* Dark mode toggle */}
            <div style={S.row} onClick={toggleTheme}>
              <div>
                <div style={S.rowLabel}>Dark Mode</div>
                <div style={{ fontSize: '12px', color: inkDim, marginTop: '1px' }}>
                  {isDark ? 'Currently dark' : 'Currently light'}
                </div>
              </div>
              <button style={S.toggle(isDark)} onClick={(e) => { e.stopPropagation(); toggleTheme() }}>
                <div style={S.toggleDot(isDark)} />
              </button>
            </div>

            {/* Notifications */}
            <div style={S.row}>
              <div>
                <div style={S.rowLabel}>Daily Reminder</div>
                <div style={{ fontSize: '12px', color: inkDim, marginTop: '1px' }}>Streak reminder at 8pm</div>
              </div>
              <span style={S.rowValue}>→</span>
            </div>

            {/* Quiz answers */}
            <div style={{ ...S.row, cursor: 'pointer' }} onClick={() => router.push('/onboarding')}>
              <div>
                <div style={S.rowLabel}>Update My Profile Quiz</div>
                <div style={{ fontSize: '12px', color: inkDim, marginTop: '1px' }}>Re-take the personalization quiz</div>
              </div>
              <span style={S.rowValue}>→</span>
            </div>

            {/* Subscription */}
            <div style={{ ...S.rowLast, cursor: 'pointer' }} onClick={() => router.push('/upgrade')}>
              <div>
                <div style={S.rowLabel}>
                  {isPremium ? 'Manage Subscription' : 'Upgrade to Premium'}
                </div>
                <div style={{ fontSize: '12px', color: inkDim, marginTop: '1px' }}>
                  {isPremium ? 'Cancel or update billing' : 'Unlock all lessons and simulations'}
                </div>
              </div>
              <span style={{ ...S.rowValue, color: 'var(--penny-500)' }}>→</span>
            </div>

          </div>
        </div>

        {/* Account */}
        <div style={S.section}>
          <div style={S.sectionLabel}>Account</div>
          <div style={S.card}>
            <div style={S.row}>
              <div style={S.rowLabel}>Email</div>
              <div style={S.rowValue}>{user?.email}</div>
            </div>
            <div style={S.row}>
              <div style={S.rowLabel}>Member since</div>
              <div style={S.rowValue}>
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : '—'}
              </div>
            </div>
            <div style={S.rowLast}>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#dc2626',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  padding: 0,
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '0 20px 20px' }}>
          <p style={{ fontSize: '12px', color: inkDim, lineHeight: 1.6 }}>
            Penny v1.0 · Built to actually help people with money.<br />
            No ads. No affiliate links. No hidden agenda.
          </p>
        </div>

      </div>

      <BottomNav activeTab="profile" />
    </div>
  )
}