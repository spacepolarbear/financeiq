// @ts-nocheck
'use client'

// app/lesson/[id]/page.js
// ─────────────────────────────────────────────────────────────
// Penny Lesson Player
// The core learning experience. Renders lesson content in
// bite-sized sections with progress tracking, a quiz at the
// end, and XP/streak rewards on completion.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCurrentUser, completeLesson, updateStreak, supabase } from '../../../lib/supabase'
import LessonQuiz from '../../../components/LessonQuiz'
import LessonSimulation from '../../../components/LessonSimulation'
import StreakCelebration from '../../../components/StreakCelebration'

// ─── Mock lesson data ─────────────────────────────────────────
// In production this comes from Supabase.
// Replace this with a real fetch from your lessons table.
const MOCK_LESSONS = {
  '1-1': {
    id: '1-1',
    module_id: 1,
    lesson_number: '1.1',
    title: 'Why Most People Never Get Ahead',
    difficulty: 'beginner',
    estimated_minutes: 12,
    xp_reward: 10,
    has_quiz: true,
    has_simulation: true,
    sections: [
      {
        type: 'intro',
        content: `Most people don't struggle with money because they're bad at math. They struggle because nobody ever taught them to *see* their money clearly.`,
      },
      {
        type: 'text',
        heading: 'The Awareness Gap',
        content: `Here's a question: without checking your bank account, do you know roughly how much you spent last month on food? On subscriptions? On things you barely remember buying?\n\nMost people have no idea. Not because they're irresponsible — but because money moves invisibly in the modern world. It's automatic payments, tap-to-pay, one-click purchases. By the time you notice it's gone, it's already gone.\n\nThis is called **spending blind** — and it's the #1 reason people feel like they can never get ahead, no matter how much they earn.`,
      },
      {
        type: 'callout',
        emoji: '💡',
        heading: 'The Counterintuitive Truth',
        content: `The solution to spending blind isn\'t willpower or discipline. It\'s awareness. When you actually see where your money goes, your behavior changes automatically — without forcing yourself to do anything.`,
      },
      {
        type: 'text',
        heading: 'Why Discipline Isn\'t the Answer',
        content: `Self-help culture tells us that financial problems are a character flaw. That if you just had *more discipline*, you'd be fine. That's wrong — and it's also cruel.\n\nDiscipline depletes. Willpower is a finite resource. You cannot white-knuckle your way to financial health for decades.\n\nSystems beat discipline every single time. The goal of Penny isn't to make you more disciplined — it's to build systems that make the right financial behaviors automatic.`,
      },
      {
        type: 'stat',
        number: '78%',
        label: 'of Americans live paycheck to paycheck',
        note: 'Including many six-figure earners. Income alone doesn\'t solve the problem.',
      },
      {
        type: 'text',
        heading: 'What Actually Changes Things',
        content: `Three things reliably move people out of financial chaos:\n\n**1. Awareness** — Knowing where your money actually goes (not where you think it goes)\n\n**2. A simple system** — One budget method that works for your personality, running mostly on autopilot\n\n**3. One decision at a time** — You don't need to overhaul everything at once. Small, consistent decisions compound into massive change over time.\n\nThat's what Penny is built around. Not lectures about what you *should* do — real decisions, real consequences, real learning.`,
      },
      {
        type: 'callout',
        emoji: '🎯',
        heading: 'Your First Action',
        content: `After this lesson, your challenge is simple: look at your last 30 days of bank/card transactions. Don't judge anything — just look. That act of awareness alone will start changing how you make decisions.`,
      },
      {
        type: 'summary',
        heading: 'What You Just Learned',
        points: [
          'Most money problems come from spending blind — not lack of discipline',
          'Awareness changes behavior automatically, without forcing willpower',
          'Systems beat discipline every time',
          'Small consistent decisions compound into massive change',
        ],
      },
    ],
    quiz: {
      questions: [
        {
          id: 'q1',
          text: 'What is "spending blind"?',
          options: [
            { key: 'a', text: 'Buying things with your eyes closed' },
            { key: 'b', text: 'Not knowing where your money actually goes' },
            { key: 'c', text: 'Spending more than you earn' },
            { key: 'd', text: 'Forgetting to pay bills' },
          ],
          correct: 'b',
          explanation: 'Spending blind means money moves out of your account invisibly — automatic payments, tap-to-pay, subscriptions — without you consciously tracking where it goes.',
          explanation_correct: 'Spending blind means money leaves your account invisibly — auto-payments, tap-to-pay, forgotten subscriptions — without you noticing until it\'s gone.',
          explanation_wrong: 'Spending blind is about visibility, not willpower. It\'s not knowing where your money went — not about spending more than you earn.',
        },
        {
          id: 'q2',
          text: 'According to this lesson, what actually changes financial behavior?',
          options: [
            { key: 'a', text: 'More willpower and discipline' },
            { key: 'b', text: 'Earning more money' },
            { key: 'c', text: 'Awareness — seeing where money actually goes' },
            { key: 'd', text: 'Cutting up your credit cards' },
          ],
          correct: 'c',
          explanation: 'Awareness changes behavior automatically. When you can see where your money goes, you make better decisions without forcing it. Discipline depletes — systems don\'t.',
          explanation_correct: 'Awareness changes behavior automatically. When you can see where your money goes, you make better decisions without forcing it. Systems beat willpower every time.',
          explanation_wrong: 'Willpower depletes — you can\'t rely on it long term. Awareness and simple systems are what actually create lasting change.',
        },
        {
          id: 'q3',
          text: 'What percentage of Americans live paycheck to paycheck?',
          options: [
            { key: 'a', text: 'About 25%' },
            { key: 'b', text: 'About 50%' },
            { key: 'c', text: 'About 78%' },
            { key: 'd', text: 'About 90%' },
          ],
          correct: 'c',
          explanation: 'Around 78% of Americans live paycheck to paycheck — including many six-figure earners. This proves that income alone doesn\'t solve the problem.',
          explanation_correct: 'Around 78% — including many six-figure earners. This proves income alone doesn\'t solve the problem. Habits and systems matter more than the paycheck size.',
          explanation_wrong: 'The number is higher than most people expect. 78% of Americans live paycheck to paycheck — even many high earners.',
        },
      ],
    },
    simulation: {
      setup: "It's Friday. You just got paid $1,200. You open your banking app and see your balance. Rent is $800, due in 5 days. Your friends are inviting you to a birthday dinner tonight that will probably cost $60.",
      question: "What do you do first?",
      choices: [
        {
          key: 'a',
          emoji: '🍽️',
          text: 'Go to dinner — I can figure out rent later',
          outcome: 'bad',
          outcomeText: "You had a great dinner, but now you're anxious about rent all weekend. On Monday you scramble to cover it — and pay a $35 late fee when you're $40 short. Total cost of that dinner: $95.",
          xp: 0,
        },
        {
          key: 'b',
          emoji: '🏠',
          text: 'Pay rent immediately, then decide about dinner',
          outcome: 'great',
          outcomeText: "Smart move. Rent is paid, stress is gone. With $400 left you check if you can afford dinner — and you can, comfortably. You enjoy the night without anxiety. This is what \"pay the essentials first\" looks like in practice.",
          xp: 15,
        },
        {
          key: 'c',
          emoji: '📊',
          text: 'Check your full budget before doing anything',
          outcome: 'good',
          outcomeText: "Solid instinct. You take 5 minutes to see the full picture: rent $800, groceries needed $80, dinner $60. You have enough for all three. You pay rent, budget for groceries, and go to dinner — completely stress-free.",
          xp: 20,
        },
        {
          key: 'd',
          emoji: '❌',
          text: 'Skip dinner to save the money',
          outcome: 'ok',
          outcomeText: "Your bank account is happy but you missed a friend's birthday. There's a better option here — one that lets you enjoy life AND be financially responsible. Money skills aren't about saying no to everything.",
          xp: 5,
        },
      ],
    },
  },
}

// ─── Section renderers ────────────────────────────────────────
function renderSection(section, index) {
  const S = {
    text: { fontSize: '15px', color: 'var(--stone-700)', lineHeight: 1.8, fontWeight: 300, marginBottom: '0' },
    heading: { fontSize: '19px', fontWeight: 700, color: 'var(--stone-900)', marginBottom: '12px', letterSpacing: '-0.3px' },
  }

  // Parse markdown-like bold
  function parseBold(text) {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1
              ? <strong key={j} style={{ fontWeight: 700, color: 'var(--stone-900)' }}>{part}</strong>
              : part
          )}
          {i < text.split('\n').length - 1 && <><br /><br /></>}
        </span>
      )
    })
  }

  switch (section.type) {
    case 'intro':
      return (
        <div key={index} style={{
          background: 'var(--penny-50)',
          border: '1px solid var(--penny-200)',
          borderRadius: '16px',
          padding: '24px',
          borderLeft: '4px solid var(--penny-500)',
        }}>
          <p style={{ fontSize: '17px', fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--penny-700)', lineHeight: 1.6 }}>
            {section.content}
          </p>
        </div>
      )

    case 'text':
      return (
        <div key={index}>
          {section.heading && <h3 style={S.heading}>{section.heading}</h3>}
          <p style={S.text}>{parseBold(section.content)}</p>
        </div>
      )

    case 'callout':
      return (
        <div key={index} style={{
          background: 'var(--forest-50)',
          border: '1px solid var(--forest-200)',
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '22px', flexShrink: 0 }}>{section.emoji}</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--forest-700)', marginBottom: '6px' }}>{section.heading}</div>
            <div style={{ fontSize: '13.5px', color: 'var(--forest-700)', lineHeight: 1.6 }}>{section.content}</div>
          </div>
        </div>
      )

    case 'stat':
      return (
        <div key={index} style={{
          background: 'white',
          border: '1px solid var(--stone-200)',
          borderRadius: '14px',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '52px',
            fontWeight: 400,
            color: 'var(--penny-500)',
            lineHeight: 1,
            marginBottom: '8px',
          }}>{section.number}</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--stone-800)', marginBottom: '6px' }}>{section.label}</div>
          <div style={{ fontSize: '13px', color: 'var(--stone-400)', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>{section.note}</div>
        </div>
      )

    case 'summary':
      return (
        <div key={index} style={{
          background: 'var(--stone-900)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
        }}>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--stone-400)', marginBottom: '14px' }}>
            What You Just Learned
          </div>
          {section.points.map((point, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px', fontSize: '14px', color: 'var(--stone-200)', lineHeight: 1.5 }}>
              <span style={{ color: 'var(--penny-400)', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>
              <span>{point}</span>
            </div>
          ))}
        </div>
      )
    case 'pull':
  return (
    <div key={index} style={{
      borderLeft: '3px solid var(--penny-500)',
      paddingLeft: '16px',
      background: 'var(--penny-50)',
      borderRadius: '0 10px 10px 0',
      padding: '12px 16px',
    }}>
      <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--penny-600)', lineHeight: 1.5, margin: 0 }}>
        {section.content}
      </p>
    </div>
  )

case 'visual':
  return (
    <div key={index} style={{
      background: 'white',
      border: '1px solid var(--stone-200)',
      borderRadius: '14px',
      padding: '20px',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--stone-400)', marginBottom: '14px' }}>
        {section.label}
      </div>
      <div style={{ fontSize: '13.5px', color: 'var(--stone-600)', lineHeight: 1.7 }}>
        {section.content}
      </div>
    </div>
  )
    default:
      return null
  }
}

// ─── Main Component ───────────────────────────────────────────
export default function LessonPage() {
  const router  = useRouter()
  const params  = useParams()
  const lessonId = params.id

  const [lesson, setLesson]         = useState(null)
  const [user, setUser]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [phase, setPhase]           = useState('reading') // reading | quiz | simulation | complete
  const [readProgress, setReadProgress] = useState(0)
  const [quizPassed, setQuizPassed] = useState(false)
  const [quizScore, setQuizScore]   = useState(0)
  const [simXP, setSimXP]           = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [totalXP, setTotalXP]       = useState(0)
  const contentRef = useRef(null)

  // ─── Load lesson and user ───
  useEffect(() => {
    async function load() {
      const { user: currentUser } = await getCurrentUser()
      if (!currentUser) { router.push('/auth'); return }
      setUser(currentUser)

      // Try to load from Supabase first, fall back to mock
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('lesson_number', lessonId.replace('-', '.'))
        .maybeSingle()

      // Use real data if available, otherwise use mock
      let lessonToUse = lessonData || MOCK_LESSONS[lessonId] || MOCK_LESSONS['1-1']

// Parse content JSON if it's a string
if (lessonToUse.content && typeof lessonToUse.content === 'string') {
  try {
    lessonToUse = { ...lessonToUse, sections: JSON.parse(lessonToUse.content) }
  } catch {
    // Keep as plain text if parsing fails
  }
}
      setLesson(lessonToUse)
      setLoading(false)
    }
    load()
  }, [lessonId, router])

  // ─── Track scroll progress ───
  useEffect(() => {
    function handleScroll() {
      if (!contentRef.current) return
      const el = contentRef.current
      const scrolled = el.scrollTop
      const total = el.scrollHeight - el.clientHeight
      if (total > 0) setReadProgress(Math.min(100, Math.round((scrolled / total) * 100)))
    }

    const el = contentRef.current
    if (el) el.addEventListener('scroll', handleScroll)
    return () => { if (el) el.removeEventListener('scroll', handleScroll) }
  }, [lesson])

  // ─── Handle quiz complete ───
  async function handleQuizComplete(passed, score) {
    setQuizPassed(passed)
    setQuizScore(score)

    if (lesson.has_simulation) {
      setPhase('simulation')
    } else {
      await finishLesson(score, 0)
    }
  }

  // ─── Handle simulation complete ───
  async function handleSimComplete(xpBonus) {
    setSimXP(xpBonus)
    await finishLesson(quizScore, xpBonus)
  }

  // ─── Finish lesson ───
  async function finishLesson(score, bonusXP) {
    if (!user || !lesson) return

    const baseXP   = lesson.xp_reward || 10
    const quizBonus = quizPassed ? 5 : 0
    const earned   = baseXP + quizBonus + (bonusXP || 0)
    setTotalXP(earned)

    // Save progress and update streak in parallel
    await Promise.all([
      completeLesson(user.id, lesson.id || lessonId, score, earned),
      updateStreak(user.id),
    ])

    setPhase('complete')
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)
  }

  // ─── Loading ───
  if (loading || !lesson) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--stone-50)' }}>
        <div className="spinner" />
      </div>
    )
  }

  // ─── Complete screen ───
  if (phase === 'complete') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--stone-50)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        {showCelebration && <StreakCelebration xp={totalXP} />}
        <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontStyle: 'italic', color: 'var(--penny-600)', marginBottom: '8px' }}>
            Lesson complete!
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--stone-500)', marginBottom: '28px' }}>
            {lesson.lesson_number} · {lesson.title}
          </p>

          {/* XP breakdown */}
          <div style={{
            background: 'white',
            border: '1px solid var(--stone-200)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'left',
          }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--stone-400)', marginBottom: '14px' }}>
              XP Earned
            </div>
            {[
              { label: 'Lesson completed', xp: lesson.xp_reward || 10 },
              quizPassed && { label: 'Quiz bonus', xp: 5 },
              simXP > 0 && { label: 'Simulation bonus', xp: simXP },
            ].filter(Boolean).map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: 'var(--stone-700)' }}>
                <span>{row.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--penny-500)' }}>+{row.xp} XP</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--stone-100)', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '16px' }}>
              <span>Total</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--penny-500)' }}>+{totalXP} XP</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button className="btn btn-primary btn-lg" onClick={() => router.push('/dashboard')} style={{ width: '100%' }}>
              Back to dashboard →
            </button>
            <button className="btn btn-ghost" onClick={() => router.push(`/module/${lesson.module_id}`)} style={{ width: '100%' }}>
              View module progress
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Quiz phase ───
  if (phase === 'quiz') {
  return (
    <LessonQuiz
      questions={lesson.quiz?.questions || []}
      mode="knowledge_check"
      lessonId={lesson.id || '1-1'}
      onComplete={handleQuizComplete}
    />
  )
}

  // ─── Simulation phase ───
  if (phase === 'simulation') {
    return (
      <LessonSimulation
        simulation={lesson.simulation}
        lessonTitle={lesson.title}
        onComplete={handleSimComplete}
      />
    )
  }

  // ─── Reading phase ───
  const canAdvance = readProgress >= 80

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--stone-50)' }}>

      {/* Top bar */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid var(--stone-200)',
        padding: '0 20px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        flexShrink: 0,
        position: 'relative',
      }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--stone-400)', padding: '4px 8px', lineHeight: 1 }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ height: '4px', background: 'var(--stone-100)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--penny-400), var(--penny-500))',
              borderRadius: '2px',
              width: `${readProgress}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone-400)', flexShrink: 0 }}>
          {readProgress}%
        </span>
      </div>

      {/* Scrollable content */}
      <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '28px 20px 120px' }}>

          {/* Lesson header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span className="badge badge-stone">
                {lesson.lesson_number}
              </span>
              <span className="badge badge-copper" style={{ textTransform: 'capitalize' }}>
                {lesson.difficulty}
              </span>
              <span className="badge badge-stone">
                ⏱ {lesson.estimated_minutes} min
              </span>
              <span className="badge badge-forest">
                +{lesson.xp_reward} XP
              </span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 400,
              lineHeight: 1.2,
              letterSpacing: '-0.5px',
              color: 'var(--stone-900)',
            }}>
              {lesson.title}
            </h1>
          </div>

          {/* Lesson sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {lesson.sections 
  ? lesson.sections.map((section, i) => renderSection(section, i))
  : lesson.content?.split('\n\n').map((block, i) => (
      <div key={i} className="txt" style={{ fontSize: '15px', color: 'var(--stone-700)', lineHeight: 1.8, fontWeight: 300 }}>
        {block.replace(/^##\s/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
      </div>
    ))
}
          </div>

        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        background: 'white',
        borderTop: '1px solid var(--stone-200)',
        padding: '16px 20px',
        flexShrink: 0,
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {!canAdvance ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--stone-400)', marginBottom: '10px', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
                Keep reading to unlock the quiz — {100 - readProgress}% to go
              </p>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${readProgress}%` }} />
              </div>
            </div>
          ) : lesson.has_quiz ? (
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={() => setPhase('quiz')}
            >
              Take the quiz → (+5 bonus XP)
            </button>
          ) : (
            <button
              className="btn btn-success btn-lg"
              style={{ width: '100%' }}
              onClick={() => finishLesson(100, 0)}
            >
              Complete lesson → (+{lesson.xp_reward} XP)
            </button>
          )}
        </div>
      </div>

    </div>
  )
}