// @ts-nocheck
'use client'

// app/onboarding/page.js
// ─────────────────────────────────────────────────────────────
// Penny Onboarding Quiz — 6 Questions
// Collects user profile data to personalize the learning path.
// Saves each answer to Supabase as the user progresses.
// After completion, redirects to /dashboard.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, saveQuizAnswer, updateProfile } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'


// ─── Quiz Data ───────────────────────────────────────────────
const QUESTIONS = [
  {
    number: 1,
    key: 'life_stage',
    type: 'single',
    pennyText: "Hey! I'm Penny. First things first — which of these sounds most like where you're at in life?",
    pennySubtext: "No wrong answers. Just pick the one that fits best.",
    options: [
      { key: 'student',            emoji: '🎓', label: 'Student life',        sub: 'In school, part-time work, figuring out money for the first time' },
      { key: 'just_starting',      emoji: '🚀', label: 'Just starting out',   sub: 'First real job, early career, building the foundation' },
      { key: 'getting_established',emoji: '📈', label: 'Getting established', sub: 'A few years in, earning more, ready to level up' },
      { key: 'family_stage',       emoji: '👨‍👩‍👧', label: 'Family stage',       sub: 'Partner, kids, or both — managing bigger responsibilities' },
      { key: 'looking_ahead',      emoji: '🌅', label: 'Looking ahead',       sub: 'Mid-to-late career, thinking seriously about retirement' },
      { key: 'in_transition',      emoji: '🔄', label: 'In transition',       sub: 'Career change, divorce, job loss, or a big life shift' },
    ],
  },
  {
    number: 2,
    key: 'confidence',
    type: 'single',
    pennyText: "Be honest with me — how do you feel about money stuff right now?",
    pennySubtext: "This helps me figure out where to start you. No judgment, I promise.",
    options: [
      { key: 'pretty_lost',         emoji: '😰', label: 'Pretty lost',          sub: 'Money stresses me out and I avoid thinking about it' },
      { key: 'getting_by',          emoji: '😐', label: 'Getting by',           sub: 'I manage okay but don\'t really have a plan' },
      { key: 'decent_foundation',   emoji: '🙂', label: 'Decent foundation',    sub: 'I budget and save, but want to do more' },
      { key: 'pretty_confident',    emoji: '💪', label: 'Pretty confident',     sub: 'I\'m investing and have solid habits — just want to optimize' },
    ],
  },
  {
    number: 3,
    key: 'challenge',
    type: 'single',
    pennyText: "What's the money thing that keeps you up at night?",
    pennySubtext: "Pick the one that feels most urgent right now. We'll get to the rest too.",
    options: [
      { key: 'overspending',     emoji: '💸', label: 'I spend more than I want to',      sub: 'Money disappears and I\'m not sure where it goes' },
      { key: 'debt',             emoji: '⛓️', label: 'Debt is hanging over me',          sub: 'Student loans, credit cards, or both' },
      { key: 'not_saving',       emoji: '📉', label: 'I\'m not investing / saving enough', sub: 'I know I should be doing more but I\'m not' },
      { key: 'big_purchase',     emoji: '🏠', label: 'Big purchase coming up',           sub: 'Saving for a house, car, or other major goal' },
      { key: 'retirement',       emoji: '🌅', label: 'Retirement feels far away but scary', sub: 'I know I need a plan but don\'t have one' },
      { key: 'feel_behind',      emoji: '😤', label: 'I just feel behind',               sub: 'Like everyone else has it figured out and I don\'t' },
    ],
  },
  {
    number: 4,
    key: 'debt',
    type: 'multi',
    pennyText: "Quick one — what kinds of debt are you dealing with right now?",
    pennySubtext: "Select all that apply. If you have none, that's great — pick that option!",
    options: [
      { key: 'student_loans',  emoji: '🎓', label: 'Student loans',   sub: 'Federal, private, or both' },
      { key: 'credit_card',    emoji: '💳', label: 'Credit card debt', sub: 'Carrying a balance month to month' },
      { key: 'car_loan',       emoji: '🚗', label: 'Car loan',         sub: 'Auto financing' },
      { key: 'medical_debt',   emoji: '🏥', label: 'Medical debt',     sub: 'Unpaid medical bills' },
      { key: 'mortgage',       emoji: '🏠', label: 'Mortgage',         sub: 'Home loan' },
      { key: 'no_debt',        emoji: '✅', label: 'No debt!',         sub: 'Completely debt free' },
    ],
  },
  {
    number: 5,
    key: 'employment',
    type: 'single',
    pennyText: "How do you make your money? This helps me make sure the tax and income stuff actually applies to you.",
    pennySubtext: "Pick whichever fits best — you can always update this later.",
    options: [
      { key: 'w2_employee',       emoji: '🏢', label: 'Regular job (W-2)',         sub: 'Salary or hourly, employer takes out taxes' },
      { key: 'freelance',         emoji: '🎨', label: 'Freelance / Self-employed', sub: 'Clients, gigs, or running my own thing' },
      { key: 'both',              emoji: '🔀', label: 'Both — job + side hustle',  sub: 'W-2 plus some 1099 income' },
      { key: 'student_part_time', emoji: '🎓', label: 'Student / part-time',       sub: 'Limited or irregular income' },
      { key: 'between_jobs',      emoji: '🔍', label: 'Between jobs',              sub: 'Currently job searching or in transition' },
    ],
  },
  {
    number: 6,
    key: 'goal',
    type: 'single',
    pennyText: "Last one! When you imagine your life 2 years from now after using Penny — what does the win look like?",
    pennySubtext: "This shapes how I track your progress and celebrate your wins.",
    options: [
      { key: 'less_stress',   emoji: '😌', label: 'Less financial stress',         sub: 'I just want to feel in control and not anxious about money' },
      { key: 'build_savings', emoji: '💰', label: 'Build real savings',            sub: 'Emergency fund, down payment, or financial cushion' },
      { key: 'debt_free',     emoji: '🧨', label: 'Get out of debt',               sub: 'Pay it all off and stay that way' },
      { key: 'invest',        emoji: '📈', label: 'Start investing confidently',   sub: 'Actually understand what I\'m doing with my money' },
      { key: 'buy_home',      emoji: '🏠', label: 'Buy a home',                   sub: 'Save for a down payment and qualify for a mortgage' },
      { key: 'fi',            emoji: '🕊️', label: 'Financial independence',       sub: 'Work because I want to, not because I have to' },
    ],
  },
]

// ─── Result Messages ─────────────────────────────────────────
function buildResultMessage(answers) {
  const challenge = answers['challenge']
  const stage     = answers['life_stage']
  const debt      = answers['debt'] || []

  if (challenge === 'debt' || debt.includes('credit_card')) {
    return "You've got ambition — but that debt is costing you more than you think. We're going to get your cash flow under control first, then attack that debt with a real strategy. Investing comes after, and it'll feel so much better without the weight hanging over you."
  }
  if (challenge === 'not_saving' || challenge === 'invest') {
    return "The good news: you're already thinking about the future. Let's make sure the basics are locked in, then get you investing with confidence. Compound interest is on your side — the sooner we start, the more it works for you."
  }
  if (challenge === 'feel_behind') {
    return "You're not behind — you're exactly where you need to be to start. Most people never take this step. We'll build your foundation piece by piece, celebrate every win, and I'll be here the whole time."
  }
  if (challenge === 'retirement') {
    return "Retirement planning sounds overwhelming but it's simpler than you think once it clicks. We'll start with the accounts that give you the biggest advantage and build from there. Future you will be grateful."
  }
  if (challenge === 'big_purchase') {
    return "Big goals need a plan. We'll make sure your credit, savings, and financial foundation are exactly where they need to be before that purchase — so you get the best terms and don't blow your progress."
  }
  return "Let's get your financial life in order — one small win at a time. You've got this, and I've got you."
}

// ─── Component ───────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()

  const [currentQ, setCurrentQ]     = useState(0)
  const [answers, setAnswers]       = useState({})
  const [selected, setSelected] = useState(null)
  const [multiSelected, setMultiSelected] = useState([])
  const [userId, setUserId]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [done, setDone]             = useState(false)
  const [displayName, setDisplayName] = useState('')
  const { isDark } = useTheme()

  const question = QUESTIONS[currentQ]
  const progress = ((currentQ) / QUESTIONS.length) * 100

  // Get current user on mount
  useEffect(() => {
    async function fetchUser() {
      const { user } = await getCurrentUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setUserId(user.id)
      setDisplayName(user.user_metadata?.display_name || 'there')
    }
    fetchUser()
  }, [router])

  // ─── Handle single select answer ───
  async function handleSingleSelect(optionKey: string) {
  setSelected(optionKey)
}
  async function handleConfirmSingle() {
  if (!selected || saving) return
  setSaving(true)
  const newAnswers = { ...answers, [question.key]: selected }
  setAnswers(newAnswers)
  if (userId) {
    await saveQuizAnswer(userId, question.number, question.key, selected, false)
  }
  setSelected(null)
  setSaving(false)
  advanceQuestion(newAnswers)
}

  // ─── Handle multi select ───
  function handleMultiToggle(optionKey) {
    if (optionKey === 'no_debt') {
      setMultiSelected(['no_debt'])
      return
    }
    setMultiSelected(prev => {
      const without = prev.filter(k => k !== 'no_debt')
      if (without.includes(optionKey)) {
        return without.filter(k => k !== optionKey)
      }
      return [...without, optionKey]
    })
  }

  async function handleMultiConfirm() {
    if (saving || multiSelected.length === 0) return
    setSaving(true)

    const newAnswers = { ...answers, [question.key]: multiSelected }
    setAnswers(newAnswers)

    if (userId) {
      await saveQuizAnswer(userId, question.number, question.key, multiSelected, false)
    }

    setSaving(false)
    setMultiSelected([])
    advanceQuestion(newAnswers)
  }

  
  // ─── Handle skip ───
  async function handleSkip() {
    if (saving) return
    setSaving(true)

    const newAnswers = { ...answers, [question.key]: null }
    setAnswers(newAnswers)

    if (userId) {
      await saveQuizAnswer(userId, question.number, question.key, [], true)
    }

    setSaving(false)
    setMultiSelected([])
    advanceQuestion(newAnswers)
  }

  // ─── Advance to next question or finish ───
  function advanceQuestion(currentAnswers) {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(prev => prev + 1)
    } else {
      finishOnboarding(currentAnswers)
    }
  }

  // ─── Finish onboarding ───
  async function finishOnboarding(finalAnswers) {
    setLoading(true)

    if (userId) {
      await updateProfile(userId, { onboarding_completed: true })
    }

    setDone(true)
    setLoading(false)

    // Auto-redirect after 3 seconds
    setTimeout(() => router.push('/dashboard'), 3000)
  }

  // ─── Styles ───
  const S = {
    page: {
      minHeight: '100vh',
      background: 'var(--stone-50)',
      backgroundImage: 'radial-gradient(ellipse 60% 40% at 70% 0%, rgba(212,120,26,0.06) 0%, transparent 60%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '32px 20px 60px',
    },
    container: {
      width: '100%',
      maxWidth: '560px',
    },
    topBar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '32px',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    mark: {
      width: '32px', height: '32px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--penny-400) 0%, var(--penny-600) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'var(--shadow-penny)',
    },
    markLetter: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontSize: '16px',
      color: 'white',
      lineHeight: 1,
    },
    wordmark: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontSize: '18px',
      color: 'var(--penny-600)',
    },
    stepLabel: {
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      letterSpacing: '1px',
      color: 'var(--stone-400)',
    },
    progressBar: {
      height: '4px',
      background: 'var(--stone-200)',
      borderRadius: '2px',
      overflow: 'hidden',
      marginBottom: '40px',
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, var(--penny-400), var(--penny-500))',
      borderRadius: '2px',
      transition: 'width 0.4s ease',
      width: `${progress}%`,
    },
    pennyBubble: {
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      marginBottom: '28px',
    },
    avatar: {
      width: '40px', height: '40px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--penny-400) 0%, var(--penny-600) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'var(--shadow-penny)',
      flexShrink: 0,
    },
    bubble: {
      background: 'var(--penny-50)',
      border: '1px solid var(--penny-200)',
      borderRadius: '0 14px 14px 14px',
      padding: '14px 18px',
      flex: 1,
    },
    qText: {
      fontSize: '17px',
      fontWeight: 700,
      color: 'var(--stone-900)',
      lineHeight: 1.35,
      marginBottom: '4px',
    },
    qSubtext: {
      fontSize: '13px',
      color: 'var(--stone-500)',
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      lineHeight: 1.5,
    },
    optionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: '10px',
      marginBottom: '16px',
    },
    option: (selected) => ({
      background: selected ? 'var(--penny-50)' : 'white',
      border: `1.5px solid ${selected ? 'var(--penny-400)' : 'var(--stone-200)'}`,
      borderRadius: '12px',
      padding: '14px 16px',
      cursor: 'pointer',
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
      transition: 'all 0.12s',
      textAlign: 'left',
      width: '100%',
      boxShadow: selected ? 'var(--shadow-penny)' : 'var(--shadow-sm)',
    }),
    optionEmoji: { fontSize: '20px', flexShrink: 0, marginTop: '1px' },
    optionLabel: { fontSize: '14px', fontWeight: 600, color: isDark ? 'var(--stone-100)' : 'var(--stone-900)', marginBottom: '2px' },
    optionSub: { fontSize: '12px', color: 'var(--stone-500)', lineHeight: 1.4 },
    skipBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12.5px',
      color: 'var(--stone-400)',
      fontStyle: 'italic',
      padding: '8px 0',
      marginTop: '4px',
      fontFamily: 'var(--font-body)',
    },
  }

  // ─── Done screen ───
  if (done) {
    const resultMsg = buildResultMessage(answers)
    const lifeStageOpt = QUESTIONS[0].options.find(o => o.key === answers['life_stage'])
    const goalOpt = QUESTIONS[5].options.find(o => o.key === answers['goal'])
    const challengeOpt = QUESTIONS[2].options.find(o => o.key === answers['challenge'])

    return (
      <div style={S.page}>
        <div style={{ ...S.container, textAlign: 'center' }}>
          <div style={{
            width: '80px', height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--penny-400), var(--penny-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 0 4px var(--penny-100), 0 8px 32px rgba(212,120,26,0.25)',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '38px', color: 'white' }}>p</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontStyle: 'italic', color: 'var(--penny-600)', marginBottom: '8px' }}>
            Your path is ready, {displayName}!
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--stone-500)', marginBottom: '28px' }}>
            Based on what you told me, here's where we're starting:
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '28px' }}>
            {lifeStageOpt && (
              <span className="badge badge-copper">{lifeStageOpt.emoji} {lifeStageOpt.label}</span>
            )}
            {challengeOpt && (
              <span className="badge badge-stone">{challengeOpt.emoji} {challengeOpt.label}</span>
            )}
            {goalOpt && (
              <span className="badge badge-forest">{goalOpt.emoji} Goal: {goalOpt.label}</span>
            )}
          </div>

          <div style={{
            background: 'var(--penny-50)',
            border: '1px solid var(--penny-200)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '28px',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={S.avatar}><span style={S.markLetter}>p</span></div>
              <p style={{ fontSize: '14px', color: 'var(--stone-700)', lineHeight: 1.7, fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
                "{resultMsg}"
              </p>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--stone-400)', marginBottom: '16px' }}>
            Taking you to your dashboard...
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        </div>
      </div>
    )
  }

  // ─── Main quiz render ───
  return (
    <div style={S.page}>
      <div style={S.container}>

        {/* Top bar */}
        <div style={S.topBar}>
          <div style={S.logo}>
            <div style={S.mark}><span style={S.markLetter}>p</span></div>
            <span style={S.wordmark}>penny</span>
          </div>
          <span style={S.stepLabel}>{currentQ + 1} of {QUESTIONS.length}</span>
        </div>

        {/* Progress bar */}
        <div style={S.progressBar}>
          <div style={S.progressFill} />
        </div>

        {/* Penny bubble */}
        <div style={S.pennyBubble}>
          <div style={S.avatar}>
            <span style={S.markLetter}>p</span>
          </div>
          <div style={S.bubble}>
            <div style={S.qText}>{question.pennyText}</div>
            <div style={S.qSubtext}>{question.pennySubtext}</div>
          </div>
        </div>

        {/* Options */}
        <div style={S.optionsGrid}>
  {question.options.map((opt) => {
    const isSelected = question.type === 'multi'
      ? multiSelected.includes(opt.key)
      : selected === opt.key

    return (
      <button
        key={opt.key}
        style={S.option(isSelected)}
        onClick={() => {
          if (question.type === 'multi') {
            handleMultiToggle(opt.key)
          } else {
            handleSingleSelect(opt.key)
          }
        }}
        disabled={saving}
      >
        <span style={S.optionEmoji}>{opt.emoji}</span>
        <div>
          <div style={S.optionLabel}>{opt.label}</div>
          <div style={S.optionSub}>{opt.sub}</div>
        </div>
      </button>
    )
  })}
</div>

<button
  className="btn btn-primary"
  style={{ width: '100%', marginBottom: '12px', opacity: (question.type === 'multi' ? multiSelected.length === 0 : !selected) ? 0.5 : 1 }}
  onClick={question.type === 'multi' ? handleMultiConfirm : () => handleConfirmSingle()}
  disabled={saving || (question.type === 'multi' ? multiSelected.length === 0 : !selected)}
>
  {saving ? 'Saving...' : 'Continue →'}
</button>

<button style={S.skipBtn} onClick={handleSkip} disabled={saving}>
  ⏭️ <span>Skip this question (your path won't be fully personalized)</span>
</button>

      </div>
    </div>
  )
}