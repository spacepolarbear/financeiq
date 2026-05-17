// @ts-nocheck
'use client'

// components/LessonQuiz.js — v2
// ─────────────────────────────────────────────────────────────
// Penny Knowledge Check Component
//
// XP mechanic:
// - Correct first try: +15 XP (knowledge_check) | +20 XP (checkpoint) | +10 XP (review)
// - Wrong: 0 XP → explanation shown → options reshuffled → retry
// - Correct after retry: +5 XP (knowledge_check/checkpoint) | +3 XP (review)
// - Both correct and wrong answers show explanations
// - Cannot advance until correct — no skip
// - Answer options reshuffled on every retry
//
// Props:
//   questions  — array of question objects (see shape below)
//   mode       — 'knowledge_check' | 'checkpoint' | 'review'
//   lessonId   — uuid string (for Supabase logging)
//   onComplete — callback(totalXpEarned, results[])
//
// Question shape:
// {
//   id: 'q1',
//   text: 'Question text?',
//   options: [
//     { key: 'a', text: 'Option A' },
//     { key: 'b', text: 'Option B' },
//     { key: 'c', text: 'Option C' },
//   ],
//   correct: 'b',
//   explanation_correct: 'Reinforcing explanation shown on correct answer.',
//   explanation_wrong:   'Correcting explanation shown on wrong answer.',
// }
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { getCurrentUser, supabase } from '../lib/supabase'

// ─── XP values by mode ───────────────────────────────────────
const XP = {
  knowledge_check: { first: 15, retry: 5  },
  checkpoint:      { first: 20, retry: 5  },
  review:          { first: 10, retry: 3  },
}

// ─── Fisher-Yates shuffle ─────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Award XP (daily cap aware) ──────────────────────────────
async function awardXP(userId, amount, source, referenceId) {
  if (!userId || amount <= 0) return

  try {
    // Insert XP ledger entry
   const { error: xpError } = await supabase.from('xp_ledger').insert({
  user_id:      userId,
  amount,
  source,
  reference_id: null,
  earned_at:    new Date().toISOString(),
})
if (xpError) console.log('XP error:', JSON.stringify(xpError))

    // Fetch current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp_total, daily_xp_earned, daily_xp_reset_at, daily_xp_cap, current_level')
      .eq('id', userId)
      .single()

    if (!profile) return

    const now = new Date()
    const resetAt = profile.daily_xp_reset_at ? new Date(profile.daily_xp_reset_at) : null
    const windowExpired = !resetAt || (now - resetAt) > 24 * 60 * 60 * 1000
    const currentDailyXP = windowExpired ? 0 : (profile.daily_xp_earned || 0)
    const cap = profile.daily_xp_cap || 100
    const isUncapped = source === 'capstone_complete'

    if (!isUncapped && currentDailyXP >= cap) return // Daily cap hit

    const newXPTotal  = (profile.xp_total || 0) + amount
    const newDailyXP  = isUncapped ? currentDailyXP : Math.min(currentDailyXP + amount, cap)

    // Level calculation
    const THRESHOLDS  = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 12000]
    const NAMES       = ['Seedling','Aware','Planner','Informed','Focused','Budgeter','Investor','Sharp','Savvy','Penny Pro']
    let newLevel = 1
    for (let i = 1; i < THRESHOLDS.length; i++) {
      if (newXPTotal >= THRESHOLDS[i]) newLevel = i + 1
      else break
    }

    await supabase.from('profiles').update({
      xp_total:          newXPTotal,
      daily_xp_earned:   windowExpired ? amount : newDailyXP,
      daily_xp_reset_at: windowExpired ? now.toISOString() : profile.daily_xp_reset_at,
      current_level:     Math.min(newLevel, 10),
      level_name:        NAMES[Math.min(newLevel - 1, 9)],
      updated_at:        now.toISOString(),
    }).eq('id', userId)
  } catch (err) {
    console.error('XP award error:', err)
  }
}

// ─── Log answer to Supabase ───────────────────────────────────
async function logAnswer(userId, lessonId, questionIndex, correctFirst, attempts, xpEarned) {
  if (!userId || !lessonId) return
  try {
    const { error: answerError } = await supabase.from('knowledge_check_answers').upsert({
      user_id:        userId,
      lesson_id:      lessonId,
      question_index: questionIndex,
      correct_first:  correctFirst,
      attempts,
      xp_earned:      xpEarned,
      answered_at:    new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id,question_index' })
    if (answerError) console.log('Answer error:', JSON.stringify(answerError))
  } catch (err) {
    console.error('Answer log error:', err)
  }
}

// ─────────────────────────────────────────────────────────────
// Single question card
// ─────────────────────────────────────────────────────────────
function QuestionCard({ question, questionIndex, totalQuestions, mode, lessonId, userId, onAnswered }) {
  const xpValues = XP[mode] || XP.knowledge_check

  const [options, setOptions]     = useState([])   // shuffled options
  const [selected, setSelected]   = useState(null)
  const [revealed, setRevealed]   = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [attempts, setAttempts]   = useState(0)
  const [xpEarned, setXpEarned]   = useState(0)

  // Shuffle on mount
  useEffect(() => {
    setOptions(shuffle(question.options))
  }, [question.id])

  function select(key) {
    if (revealed) return
    setSelected(key)
  }

  async function submit() {
    if (!selected || revealed) return

    const correct     = selected === question.correct
    const newAttempts = attempts + 1
    setAttempts(newAttempts)
    setIsCorrect(correct)
    setRevealed(true)

    if (correct) {
      const earned = newAttempts === 1 ? xpValues.first : xpValues.retry
      setXpEarned(prev => prev + earned)
      await Promise.all([
        awardXP(userId, earned, mode === 'checkpoint' ? 'quiz_perfect' : 'lesson_complete', lessonId),
        logAnswer(userId, lessonId, questionIndex, newAttempts === 1, newAttempts, earned),
      ])
    }
  }

  function retry() {
    setSelected(null)
    setRevealed(false)
    setIsCorrect(false)
    setOptions(shuffle(question.options))  // Reshuffle on every retry
  }

  function advance() {
    onAnswered({ questionId: question.id, correct: true, attempts, xpEarned })
  }

  // ─── Option key label (A, B, C based on shuffled position) ───
  function keyLabel(key) {
    const idx = options.findIndex(o => o.key === key)
    if (idx === -1) return ''
    return String.fromCharCode(65 + idx)
  }

  // ─── Per-option style ─────────────────────────────────────────
  function optionStyle(key) {
  const isSelected = selected === key
  const isAnswer   = key === question.correct
  const isWrong    = revealed && isSelected && !isCorrect

  if (revealed && isCorrect && isAnswer) return { bg: 'var(--forest-50)', border: 'var(--forest-400)', color: 'var(--forest-700)', weight: 700 }
  if (revealed && isWrong)  return { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', weight: 500 }
  if (revealed) return { bg: 'white', border: 'var(--stone-100)', color: 'var(--stone-600)', weight: 400 }
  if (isSelected) return { bg: 'var(--penny-50)', border: 'var(--penny-500)', color: 'var(--stone-900)', weight: 600 }
  return { bg: 'white', border: 'var(--stone-200)', color: 'var(--stone-600)', weight: 400 }
}

  function keyBadgeStyle(key) {
    const isSelected = selected === key
    const isAnswer   = key === question.correct
    const isWrong    = revealed && isSelected && !isCorrect

    if (revealed && isCorrect && isAnswer) return { bg: 'var(--forest-500)', color: 'white' }
    if (revealed && isWrong)  return { bg: '#fca5a5',           color: '#991b1b' }
    if (!revealed && isSelected) return { bg: 'var(--penny-200)', color: 'var(--penny-700)' }
    return { bg: 'var(--stone-100)', color: 'var(--stone-400)' }
  }

  return (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '14px',
    maxWidth: '540px',
    margin: '0 auto',
    padding: '24px 20px',
    width: '100%',
  }}>

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1, height: '4px', background: 'var(--stone-100)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(questionIndex / totalQuestions) * 100}%`,
            background: 'linear-gradient(90deg, var(--penny-400), var(--penny-500))',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone-400)', flexShrink: 0 }}>
          {questionIndex + 1}/{totalQuestions}
        </span>
      </div>

      {/* Question text */}
      <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--stone-900)', lineHeight: 1.4, letterSpacing: '-0.2px' }}>
        {question.text}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {options.map((opt) => {
          const s  = optionStyle(opt.key)
          const ks = keyBadgeStyle(opt.key)
          const isAnswer = opt.key === question.correct
          const isWrong  = revealed && opt.key === selected && !isCorrect

          return (
            <button
              key={opt.key}
              onClick={() => select(opt.key)}
              disabled={revealed}
              style={{
                background:  s.bg,
                border:      `1.5px solid ${s.border}`,
                borderRadius: '12px',
                padding:      '13px 16px',
                cursor:       revealed ? 'default' : 'pointer',
                display:      'flex',
                alignItems:   'center',
                gap:          '12px',
                width:        '100%',
                textAlign:    'left',
                transition:   'all 0.12s',
              }}
            >
              {/* Key badge */}
              <div style={{
                width: '28px', height: '28px',
                borderRadius: '50%',
                background: ks.bg,
                color: ks.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                flexShrink: 0,
                transition: 'all 0.12s',
              }}>
                {revealed && isAnswer ? '✓' : revealed && isWrong ? '✗' : keyLabel(opt.key)}
              </div>

              {/* Option text */}
              <span style={{ fontSize: '14px', color: s.color, fontWeight: s.weight, lineHeight: 1.4 }}>
                {opt.text}
              </span>
            </button>
          )
        })}
      </div>

      {/* Explanation feedback */}
      {revealed && (
        <div style={{
          background: isCorrect ? 'var(--forest-50)' : '#fef2f2',
          border:     `1px solid ${isCorrect ? 'var(--forest-200)' : '#fca5a5'}`,
          borderRadius: '12px',
          padding: '14px 16px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
          animation: 'fadeUp 0.2s ease forwards',
        }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>{isCorrect ? '🎯' : '💡'}</span>
          <div>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              color: isCorrect ? 'var(--forest-700)' : '#991b1b',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              {isCorrect
                ? attempts === 1 ? 'Exactly right' : 'There it is'
                : 'Not quite'
              }
              {isCorrect && (
                <span style={{
                  background: 'var(--forest-500)',
                  color: 'white',
                  borderRadius: '100px',
                  padding: '2px 9px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                }}>
                  +{attempts === 1 ? xpValues.first : xpValues.retry} XP
                </span>
              )}
            </div>
            <div style={{ fontSize: '13px', color: isCorrect ? 'var(--forest-700)' : '#7f1d1d', lineHeight: 1.6 }}>
              {isCorrect ? question.explanation_correct : question.explanation_wrong}
            </div>
          </div>
        </div>
      )}

      {/* Action button */}
      {!revealed ? (
        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%', opacity: selected ? 1 : 0.45 }}
          onClick={submit}
          disabled={!selected}
        >
          Check answer
        </button>
      ) : isCorrect ? (
        <button
          className="btn btn-success btn-lg"
          style={{ width: '100%' }}
          onClick={advance}
        >
          {questionIndex + 1 >= totalQuestions ? 'Done ✓' : 'Next →'}
        </button>
      ) : (
        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          onClick={retry}
        >
          Try again →
        </button>
      )}

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────
export default function LessonQuiz({ questions = [], mode = 'knowledge_check', lessonId, onComplete }) {
  const [index, setIndex]     = useState(0)
  const [results, setResults] = useState([])
  const [totalXP, setTotalXP] = useState(0)
  const [done, setDone]       = useState(false)
  const [userId, setUserId]   = useState(null)

 useEffect(() => {
  getCurrentUser().then(({ user }) => { 
    console.log('Quiz user:', user?.id)
    if (user) setUserId(user.id) 
  })
}, [])

  function handleAnswered(result) {
    const newResults = [...results, result]
    const newXP      = newResults.reduce((sum, r) => sum + (r.xpEarned || 0), 0)
    setResults(newResults)
    setTotalXP(newXP)

    if (index + 1 >= questions.length) {
      setDone(true)
      onComplete && onComplete(newXP, newResults)
    } else {
      setIndex(prev => prev + 1)
    }
  }

  if (!questions.length) return null

  // Completion summary
  if (done) {
    const firstTryCount = results.filter(r => r.attempts === 1).length
    const allPerfect    = firstTryCount === questions.length

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '14px', padding: '28px 20px', textAlign: 'center',
        animation: 'fadeUp 0.3s ease forwards',
      }}>
        <div style={{ fontSize: '52px' }}>
          {allPerfect ? '🎯' : firstTryCount > 0 ? '✅' : '💡'}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '22px',
          fontStyle: 'italic', color: 'var(--penny-600)',
        }}>
          {allPerfect ? 'Perfect round!' : 'Nice work!'}
        </div>
        <div style={{ fontSize: '13.5px', color: 'var(--stone-500)' }}>
          {firstTryCount} of {questions.length} correct on first try
        </div>
        <div style={{
          background: 'var(--penny-50)', border: '2px solid var(--penny-200)',
          borderRadius: '12px', padding: '12px 24px',
          fontFamily: 'var(--font-mono)', fontSize: '20px',
          fontWeight: 800, color: 'var(--penny-600)',
        }}>
          +{totalXP} XP
        </div>
      </div>
    )
  }

  return (
    <QuestionCard
      key={`q-${index}-${questions[index].id}`}
      question={questions[index]}
      questionIndex={index}
      totalQuestions={questions.length}
      mode={mode}
      lessonId={lessonId}
      userId={userId}
      onAnswered={handleAnswered}
    />
  )
}