// @ts-nocheck
'use client'

// app/module/[id]/page.js
// ─────────────────────────────────────────────────────────────
// Module overview page — shows all lessons in a module,
// the user's progress, and which lessons are locked/unlocked.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCurrentUser, getLessonProgress, supabase } from '../../../lib/supabase'

const MODULE_META = {
  1:  { emoji: '💰', title: 'Budgeting & Cash Flow',   color: '#d4781a', bg: '#fdf8f0', border: '#f5d9a8', desc: 'The foundation of everything. Control your money before it controls you.' },
  2:  { emoji: '🏦', title: 'Banking & Cash Management', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', desc: 'Where your money lives. Most people use the wrong accounts and lose money doing it.' },
  3:  { emoji: '⛓️', title: 'Debt Management',          color: '#16a34a', bg: '#f0fdf4', border: '#86efac', desc: 'Not all debt is bad. Learn what to pay off fast, what to hold, and how to get free.' },
  4:  { emoji: '📊', title: 'Credit & Credit Scores',   color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', desc: 'Your financial reputation. A good score saves you tens of thousands over a lifetime.' },
  5:  { emoji: '📈', title: 'Investing',                color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', desc: 'Making your money work while you sleep. The most powerful wealth-building tool.' },
  6:  { emoji: '🛡️', title: 'Insurance',               color: '#db2777', bg: '#fdf2f8', border: '#f9a8d4', desc: 'Protecting everything you\'ve built. One bad event without coverage can erase years of progress.' },
  7:  { emoji: '🌅', title: 'Retirement Planning',      color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', desc: 'The earlier you start, the easier it gets. Most people start too late — don\'t be most people.' },
  8:  { emoji: '🧾', title: 'Taxes',                    color: '#b45309', bg: '#fffbeb', border: '#fcd34d', desc: 'You can\'t avoid taxes but you can minimize them legally. Most people overpay.' },
  9:  { emoji: '🏠', title: 'Housing & Real Estate',    color: '#15803d', bg: '#f0fdf4', border: '#86efac', desc: 'Rent or buy? Your biggest monthly expense deserves serious thought.' },
  10: { emoji: '💼', title: 'Career & Income Growth',   color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', desc: 'Your income is your most powerful wealth tool. Learn how to maximize it.' },
  11: { emoji: '🎯', title: 'Major Life Events',        color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', desc: 'Big moments come with big financial decisions. Know what to do before they happen.' },
  12: { emoji: '🧠', title: 'Psychology of Money',      color: '#6d28d9', bg: '#f5f3ff', border: '#c4b5fd', desc: 'Knowing the rules isn\'t enough. Your mindset and habits drive every financial decision.' },
}

// Mock lessons — replace with real Supabase fetch
const MOCK_MODULE_LESSONS = {
  1: [
    { id: '1-1', lesson_number: '1.1', title: 'Why Most People Never Get Ahead', difficulty: 'beginner', estimated_minutes: 12, xp_reward: 10, is_essential: true },
    { id: '1-2', lesson_number: '1.2', title: 'Tracking Your Money for the First Time', difficulty: 'beginner', estimated_minutes: 15, xp_reward: 10, is_essential: true },
    { id: '1-3', lesson_number: '1.3', title: 'Fixed, Variable, and Discretionary Expenses', difficulty: 'beginner', estimated_minutes: 10, xp_reward: 10, is_essential: true },
    { id: '1-4', lesson_number: '1.4', title: 'The 50/30/20 Rule — A Starting Framework', difficulty: 'beginner', estimated_minutes: 12, xp_reward: 10, is_essential: true },
    { id: '1-5', lesson_number: '1.5', title: 'Building Your Emergency Fund', difficulty: 'beginner', estimated_minutes: 14, xp_reward: 10, is_essential: true },
    { id: '1-6', lesson_number: '1.6', title: 'Zero-Based Budgeting — Give Every Dollar a Job', difficulty: 'intermediate', estimated_minutes: 16, xp_reward: 15 },
    { id: '1-7', lesson_number: '1.7', title: 'Pay Yourself First — The Reverse Budget', difficulty: 'intermediate', estimated_minutes: 12, xp_reward: 15 },
    { id: '1-8', lesson_number: '1.8', title: 'Sinking Funds — Budget for the Future', difficulty: 'intermediate', estimated_minutes: 13, xp_reward: 15 },
    { id: '1-9', lesson_number: '1.9', title: 'Budgeting on Irregular Income', difficulty: 'intermediate', estimated_minutes: 15, xp_reward: 15 },
    { id: '1-10', lesson_number: '1.10', title: 'Lifestyle Inflation — The Silent Wealth Killer', difficulty: 'advanced', estimated_minutes: 14, xp_reward: 20 },
    { id: '1-11', lesson_number: '1.11', title: 'Budgeting as a Couple', difficulty: 'advanced', estimated_minutes: 16, xp_reward: 20 },
    { id: '1-12', lesson_number: '1.12', title: 'Your Annual Financial Review', difficulty: 'advanced', estimated_minutes: 18, xp_reward: 20 },
  ],
}

const DIFFICULTY_STYLES = {
  beginner:     { bg: 'var(--forest-50)', border: 'var(--forest-200)', color: 'var(--forest-600)' },
  intermediate: { bg: 'var(--penny-50)',  border: 'var(--penny-200)',  color: 'var(--penny-600)' },
  advanced:     { bg: '#fef2f2',          border: '#fca5a5',           color: '#991b1b' },
}

export default function ModulePage() {
  const router = useRouter()
  const params = useParams()
  const moduleId = parseInt(params.id)

  const [user, setUser]         = useState(null)
  const [lessons, setLessons]   = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading]   = useState(true)

  const meta = MODULE_META[moduleId] || MODULE_META[1]

  useEffect(() => {
    async function load() {
      const { user: currentUser } = await getCurrentUser()
      if (!currentUser) { router.push('/auth'); return }
      setUser(currentUser)

      // Try Supabase, fall back to mock
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('sort_order', { ascending: true })

      const lessonList = lessonData?.length > 0
        ? lessonData
        : MOCK_MODULE_LESSONS[moduleId] || MOCK_MODULE_LESSONS[1]

      setLessons(lessonList)

      const { data: progressData } = await getLessonProgress(currentUser.id)
      setProgress(progressData || [])
      setLoading(false)
    }
    load()
  }, [moduleId, router])

  function getLessonStatus(lessonId) {
    const p = progress.find(p => p.lesson_id === lessonId || p.lesson_id === lessonId.toString())
    return p?.status || 'not_started'
  }

  const completedCount = lessons.filter(l => getLessonStatus(l.id) === 'completed').length
  const totalXP = lessons.reduce((sum, l) => sum + (l.xp_reward || 10), 0)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--stone-50)' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--stone-50)', minHeight: '100vh', paddingBottom: '60px' }}>

      {/* Header */}
      <div style={{
        background: meta.bg,
        borderBottom: `2px solid ${meta.border}`,
        padding: '20px 20px 28px',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* Back button */}
          <button
            onClick={() => router.back()}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', color: meta.color, marginBottom: '20px', padding: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-body)' }}
          >
            ← Dashboard
          </button>

          {/* Module info */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{
              width: '56px', height: '56px',
              borderRadius: '16px',
              background: 'white',
              border: `1.5px solid ${meta.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              {meta.emoji}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: meta.color, opacity: 0.7, marginBottom: '4px' }}>
                Module {moduleId.toString().padStart(2, '0')}
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--stone-900)', letterSpacing: '-0.5px', marginBottom: '6px', lineHeight: 1.2 }}>
                {meta.title}
              </h1>
              <p style={{ fontSize: '13.5px', color: 'var(--stone-600)', lineHeight: 1.5, fontWeight: 300 }}>
                {meta.desc}
              </p>
            </div>
          </div>

          {/* Progress stats */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{
              background: 'white',
              border: `1px solid ${meta.border}`,
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: meta.color }}>{completedCount}/{lessons.length}</span>
              <span style={{ fontSize: '11px', color: 'var(--stone-500)', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>LESSONS</span>
            </div>
            <div style={{
              background: 'white',
              border: `1px solid ${meta.border}`,
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: meta.color }}>{totalXP} XP</span>
              <span style={{ fontSize: '11px', color: 'var(--stone-500)', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>AVAILABLE</span>
            </div>
            <div style={{
              background: 'white',
              border: `1px solid ${meta.border}`,
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: meta.color }}>
                {lessons.reduce((sum, l) => sum + (l.estimated_minutes || 0), 0)} min
              </span>
              <span style={{ fontSize: '11px', color: 'var(--stone-500)', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>TOTAL</span>
            </div>
          </div>

          {/* Progress bar */}
          {lessons.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(completedCount / lessons.length) * 100}%`,
                    background: `linear-gradient(90deg, ${meta.color}aa, ${meta.color})`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lessons list */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 20px' }}>

        {/* Find first incomplete lesson */}
        {(() => {
          const firstIncomplete = lessons.find(l => getLessonStatus(l.id) !== 'completed')
          if (firstIncomplete && completedCount < lessons.length) {
            return (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--stone-400)', marginBottom: '10px' }}>
                  Up Next
                </div>
                <button
                  onClick={() => router.push(`/lesson/${firstIncomplete.lesson_number.replace('.', '-')}`)}
                  style={{
                    width: '100%',
                    background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
                    border: 'none',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'center',
                    textAlign: 'left',
                    boxShadow: `0 4px 16px ${meta.color}30`,
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                  }}>
                    ▶
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', letterSpacing: '1px' }}>
                      {firstIncomplete.lesson_number} · {firstIncomplete.estimated_minutes} MIN
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>
                      {firstIncomplete.title}
                    </div>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    +{firstIncomplete.xp_reward} XP
                  </div>
                </button>
              </div>
            )
          }
          return null
        })()}

        {/* All lessons */}
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--stone-400)', marginBottom: '12px' }}>
          All Lessons
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {lessons.map((lesson, index) => {
            const status = getLessonStatus(lesson.id)
            const isCompleted = status === 'completed'
            const diffStyle = DIFFICULTY_STYLES[lesson.difficulty] || DIFFICULTY_STYLES.beginner

            return (
              <button
                key={lesson.id}
                onClick={() => router.push(`/lesson/${lesson.lesson_number.replace('.', '-')}`)}
                style={{
                  background: isCompleted ? 'var(--forest-50)' : 'white',
                  border: `1px solid ${isCompleted ? 'var(--forest-200)' : 'var(--stone-200)'}`,
                  borderRadius: '12px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  textAlign: 'left',
                  transition: 'all 0.12s',
                  width: '100%',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = meta.border
                  e.currentTarget.style.transform = 'translateX(2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = isCompleted ? 'var(--forest-200)' : 'var(--stone-200)'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                {/* Status indicator */}
                <div style={{
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  background: isCompleted ? 'var(--forest-500)' : 'var(--stone-100)',
                  border: `1.5px solid ${isCompleted ? 'var(--forest-400)' : 'var(--stone-200)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isCompleted ? '14px' : '11px',
                  fontFamily: 'var(--font-mono)',
                  color: isCompleted ? 'white' : 'var(--stone-400)',
                  flexShrink: 0,
                  fontWeight: 700,
                }}>
                  {isCompleted ? '✓' : (index + 1)}
                </div>

                {/* Lesson info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: isCompleted ? 'var(--forest-700)' : 'var(--stone-900)', lineHeight: 1.3 }}>
                      {lesson.title}
                    </span>
                    {lesson.is_essential && (
                      <span style={{ fontSize: '9px', background: 'var(--penny-50)', border: '1px solid var(--penny-200)', color: 'var(--penny-600)', borderRadius: '4px', padding: '1px 5px', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px', flexShrink: 0 }}>
                        CORE
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: diffStyle.bg,
                      border: `1px solid ${diffStyle.border}`,
                      color: diffStyle.color,
                      textTransform: 'capitalize',
                    }}>
                      {lesson.difficulty}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--stone-400)', fontFamily: 'var(--font-mono)' }}>
                      {lesson.estimated_minutes} min
                    </span>
                  </div>
                </div>

                {/* XP */}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: isCompleted ? 'var(--forest-500)' : 'var(--stone-300)',
                  flexShrink: 0,
                }}>
                  {isCompleted ? '✓' : `+${lesson.xp_reward}`} XP
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}