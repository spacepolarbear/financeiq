// @ts-nocheck
'use client'

// components/LessonSimulation.js
// ─────────────────────────────────────────────────────────────
// The flagship Penny feature — real-life financial scenarios
// where users make decisions and see consequences.
// This is what separates Penny from every other finance app.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'

const OUTCOME_STYLES = {
  great: { bg: 'var(--forest-50)', border: 'var(--forest-300)', color: 'var(--forest-700)', emoji: '🎯', label: 'Great choice!' },
  good:  { bg: '#f0f7f3',          border: 'var(--forest-200)', color: 'var(--forest-600)', emoji: '✅', label: 'Good thinking' },
  ok:    { bg: 'var(--penny-50)',  border: 'var(--penny-300)', color: 'var(--penny-700)', emoji: '🤔', label: 'Not bad, but...' },
  bad:   { bg: '#fef2f2',          border: '#fca5a5',          color: '#991b1b',          emoji: '⚠️', label: 'Heads up...' },
}

export default function LessonSimulation({ simulation, lessonTitle, onComplete }) {
  const [selected, setSelected]   = useState(null)
  const [revealed, setRevealed]   = useState(false)

  const choice = simulation.choices.find(c => c.key === selected)
  const outcomeStyle = choice ? OUTCOME_STYLES[choice.outcome] : null

  function handleSelect(key) {
    if (revealed) return
    setSelected(key)
  }

  function handleReveal() {
    if (!selected) return
    setRevealed(true)
  }

  function handleContinue() {
    const xpBonus = choice?.xp || 0
    onComplete(xpBonus)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--stone-900)',
      backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,120,26,0.1) 0%, transparent 60%)',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Top bar */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{ fontSize: '18px' }}>🎯</span>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
          Real Life Scenario
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', padding: '32px 20px 40px', justifyContent: 'center', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '540px' }}>

          {/* Penny's scenario setup */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '28px',
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: '36px', height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--penny-400), var(--penny-600))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '17px', color: 'white' }}>p</span>
              </div>
              <p style={{
                fontSize: '15px',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.7,
                fontStyle: 'italic',
                fontFamily: 'var(--font-display)',
              }}>
                "{simulation.setup}"
              </p>
            </div>

            <div style={{
              background: 'rgba(212,120,26,0.15)',
              border: '1px solid rgba(212,120,26,0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
            }}>
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--penny-300)', letterSpacing: '-0.2px' }}>
                {simulation.question}
              </p>
            </div>
          </div>

          {/* Choices */}
          {!revealed && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {simulation.choices.map((choice) => (
                  <button
                    key={choice.key}
                    onClick={() => handleSelect(choice.key)}
                    style={{
                      background: selected === choice.key
                        ? 'rgba(212,120,26,0.2)'
                        : 'rgba(255,255,255,0.06)',
                      border: `1.5px solid ${selected === choice.key
                        ? 'var(--penny-400)'
                        : 'rgba(255,255,255,0.12)'}`,
                      borderRadius: '14px',
                      padding: '16px 18px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.12s',
                      width: '100%',
                    }}
                  >
                    <span style={{ fontSize: '22px', flexShrink: 0 }}>{choice.emoji}</span>
                    <span style={{
                      fontSize: '14.5px',
                      color: selected === choice.key ? 'var(--penny-200)' : 'rgba(255,255,255,0.75)',
                      fontWeight: selected === choice.key ? 600 : 400,
                      lineHeight: 1.4,
                    }}>
                      {choice.text}
                    </span>
                  </button>
                ))}
              </div>

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', opacity: selected ? 1 : 0.5 }}
                onClick={handleReveal}
                disabled={!selected}
              >
                See what happens →
              </button>
            </>
          )}

          {/* Revealed outcome */}
          {revealed && choice && outcomeStyle && (
            <div style={{ animation: 'fadeUp 0.3s ease forwards' }}>

              {/* Outcome header */}
              <div style={{
                background: outcomeStyle.bg,
                border: `1px solid ${outcomeStyle.border}`,
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{outcomeStyle.emoji}</span>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: outcomeStyle.color }}>{outcomeStyle.label}</div>
                    <div style={{ fontSize: '12px', color: outcomeStyle.color, opacity: 0.7, fontFamily: 'var(--font-mono)' }}>
                      You chose: {choice.text}
                    </div>
                  </div>
                  {choice.xp > 0 && (
                    <div style={{
                      marginLeft: 'auto',
                      background: 'var(--forest-500)',
                      color: 'white',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      +{choice.xp} XP
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '14.5px', color: outcomeStyle.color, lineHeight: 1.65 }}>
                  {choice.outcomeText}
                </p>
              </div>

              {/* Best answer if they didn't choose it */}
              {choice.outcome !== 'great' && (
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '20px',
                }}>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginBottom: '10px', textTransform: 'uppercase' }}>
                    The strongest move would have been:
                  </div>
                  {simulation.choices.filter(c => c.outcome === 'great' || c.outcome === 'good').slice(0, 1).map(best => (
                    <div key={best.key} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '18px' }}>{best.emoji}</span>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>{best.text}</div>
                        <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{best.outcomeText}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={handleContinue}
              >
                {choice.xp > 0 ? `Complete lesson → (+${choice.xp} XP bonus)` : 'Complete lesson →'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}