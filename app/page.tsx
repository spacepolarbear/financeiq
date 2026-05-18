// @ts-nocheck
'use client'

// app/page.js
// ─────────────────────────────────────────────────────────────
// Penny Landing Page — Public Homepage
// Shown to users who aren't logged in.
// Clean, conversion-focused. Gets people to sign up.
// ─────────────────────────────────────────────────────────────

import Link from 'next/link'

// ─── Feature data ────────────────────────────────────────────
const FEATURES = [
  {
    emoji: '🎯',
    title: 'Personalized to you',
    desc: 'A 6-question quiz builds your custom learning path. No one-size-fits-all courses — just what you actually need.',
  },
  {
    emoji: '⚡',
    title: 'Bite-sized lessons',
    desc: '3–12 minute lessons you can finish on your lunch break. Real knowledge, no fluff, no textbook energy.',
  },
  {
    emoji: '🎮',
    title: 'Learn by deciding',
    desc: '"You got paid $1,200 and rent is due. Your friends invite you on a $180 trip. What do you do?" Real scenarios, real consequences.',
  },
  {
    emoji: '🔥',
    title: 'Streaks and XP',
    desc: 'Daily streaks, XP points, levels, and badges that make building financial habits feel like a game you actually want to play.',
  },
  {
    emoji: '🗺️',
    title: '12 complete modules',
    desc: 'Budgeting, debt, credit, investing, taxes, insurance, retirement, housing — everything you need, in one place.',
  },
  {
    emoji: '🆓',
    title: 'Free to start',
    desc: 'Core lessons are always free. No credit card required. No ads pushing products at you. Just information.',
  },
]

const SIMULATIONS = [
  { emoji: '🎓', title: 'Survive College with Debt', desc: 'Navigate student loans, a tight budget, and your first real financial decisions.' },
  { emoji: '🏠', title: 'First Apartment', desc: 'Security deposits, utilities, renter\'s insurance — what nobody told you about moving out.' },
  { emoji: '💼', title: 'Job Loss Survival', desc: 'Your income stops tomorrow. How long can you last and what do you do first?' },
  { emoji: '📈', title: 'Investing Through a Recession', desc: 'Markets drop 30%. Do you panic sell, hold, or buy more? See the outcome of each choice.' },
]

export default function LandingPage() {
  return (
    <div style={{
      background: 'var(--stone-50)',
      minHeight: '100vh',
      fontFamily: 'var(--font-body)',
    }}>

      {/* Nav */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid var(--stone-200)',
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '34px', height: '34px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--penny-400), var(--penny-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-penny)',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '17px', color: 'white' }}>p</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '20px', color: 'var(--penny-600)', letterSpacing: '-0.3px' }}>penny</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/auth?mode=login" style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--stone-600)',
            textDecoration: 'none',
            padding: '8px 12px',
          }}>
            Log in
          </Link>
          <Link href="/auth?mode=signup" className="btn btn-primary btn-sm">
                    Get started free →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: '700px',
        margin: '0 auto',
        padding: '80px 24px 64px',
        textAlign: 'center',
        backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,120,26,0.08) 0%, transparent 60%)',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--penny-50)',
          border: '1px solid var(--penny-200)',
          borderRadius: '100px',
          padding: '5px 14px',
          fontSize: '12.5px',
          fontWeight: 600,
          color: 'var(--penny-600)',
          marginBottom: '28px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.5px',
        }}>
          🪙 FREE TO START · NO CREDIT CARD
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(40px, 6vw, 64px)',
          fontWeight: 400,
          lineHeight: 1.08,
          letterSpacing: '-1.5px',
          color: 'var(--stone-900)',
          marginBottom: '20px',
        }}>
          Learn money skills through<br />
          <em style={{ color: 'var(--penny-500)' }}>tiny daily decisions</em>
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'var(--stone-500)',
          lineHeight: 1.7,
          maxWidth: '520px',
          margin: '0 auto 36px',
          fontWeight: 300,
        }}>
          Penny is the personal finance app that actually explains things. Personalized lessons, real-life simulations, and Duolingo-style streaks that make building financial habits feel like a game.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth" className="btn btn-primary btn-lg" style={{ minWidth: '200px' }}>
            Start learning free →
          </Link>
          <a href="#how-it-works" className="btn btn-ghost btn-lg">
            See how it works
          </a>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--stone-400)', marginTop: '16px' }}>
          Join thousands of people finally figuring out their money.
        </p>
      </section>

      {/* Experience preview card */}
      <section style={{ maxWidth: '600px', margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{
          background: 'white',
          border: '1px solid var(--stone-200)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(28,26,22,0.08)',
        }}>
          {/* Fake app bar */}
          <div style={{
            background: 'white',
            borderBottom: '1px solid var(--stone-100)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--penny-400), var(--penny-600))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '12px', color: 'white' }}>p</span>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '15px', color: 'var(--penny-600)' }}>penny</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ background: 'var(--penny-50)', border: '1px solid var(--penny-200)', color: 'var(--penny-600)', borderRadius: '100px', padding: '2px 10px', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>🔥 7</span>
              <span style={{ background: 'var(--forest-50)', border: '1px solid var(--forest-200)', color: 'var(--forest-600)', borderRadius: '100px', padding: '2px 10px', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>120 XP</span>
            </div>
          </div>

          {/* Scenario card */}
          <div style={{ padding: '20px 18px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--stone-400)', letterSpacing: '1px', marginBottom: '10px' }}>TODAY'S SCENARIO</div>
            <div style={{
              background: 'var(--penny-50)',
              border: '1px solid var(--penny-200)',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--penny-400), var(--penny-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '13px', color: 'white' }}>p</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--stone-700)', lineHeight: 1.6, fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
                  "You got paid $1,200 today. Rent is due in 5 days ($800). Your friends invite you on a $180 weekend trip. What do you do?"
                </p>
              </div>
            </div>

            {/* Choices */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { emoji: '✈️', text: 'Go on the trip — YOLO', color: 'var(--stone-200)', textColor: 'var(--stone-600)' },
                { emoji: '🏠', text: 'Pay rent first, skip the trip', color: 'var(--forest-100)', textColor: 'var(--forest-700)', selected: true },
                { emoji: '🤝', text: 'Negotiate a shorter, cheaper version of the trip', color: 'var(--stone-200)', textColor: 'var(--stone-600)' },
                { emoji: '💳', text: 'Put the trip on credit card', color: 'var(--stone-200)', textColor: 'var(--stone-600)' },
              ].map((choice, i) => (
                <div key={i} style={{
                  background: choice.selected ? choice.color : 'var(--stone-50)',
                  border: `1.5px solid ${choice.selected ? 'var(--forest-300)' : 'var(--stone-200)'}`,
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13.5px',
                  fontWeight: choice.selected ? 600 : 400,
                  color: choice.selected ? choice.textColor : 'var(--stone-600)',
                }}>
                  <span>{choice.emoji}</span>
                  <span>{choice.text}</span>
                  {choice.selected && <span style={{ marginLeft: 'auto', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--forest-600)' }}>+10 XP</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px 64px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 40px)',
          textAlign: 'center',
          marginBottom: '8px',
          letterSpacing: '-0.5px',
        }}>
          Why Penny <em style={{ color: 'var(--penny-500)' }}>works</em>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--stone-500)', fontSize: '15px', marginBottom: '40px', fontWeight: 300 }}>
          Most finance apps are boring or trying to sell you something. Penny is neither.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="card" style={{ padding: '22px' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.emoji}</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', color: 'var(--stone-900)' }}>{f.title}</div>
              <div style={{ fontSize: '13.5px', color: 'var(--stone-500)', lineHeight: 1.6, fontWeight: 300 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Simulations */}
      <section style={{
        background: 'var(--stone-900)',
        padding: '64px 24px',
        backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(212,120,26,0.1) 0%, transparent 70%)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 40px)',
            color: 'var(--stone-50)',
            marginBottom: '10px',
            letterSpacing: '-0.5px',
          }}>
            Financial simulations that <em style={{ color: 'var(--penny-300)' }}>actually teach</em>
          </h2>
          <p style={{ color: 'var(--stone-400)', fontSize: '15px', marginBottom: '36px', fontWeight: 300 }}>
            Make real decisions with fake money. See the consequences. Learn without the consequences.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '14px',
            textAlign: 'left',
          }}>
            {SIMULATIONS.map((sim, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                padding: '20px',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>{sim.emoji}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--stone-100)', marginBottom: '6px' }}>{sim.title}</div>
                <div style={{ fontSize: '12.5px', color: 'var(--stone-400)', lineHeight: 1.55, fontWeight: 300 }}>{sim.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        maxWidth: '560px',
        margin: '0 auto',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(30px, 4vw, 44px)',
          letterSpacing: '-0.5px',
          marginBottom: '14px',
        }}>
          Your financial glow-up<br />
          <em style={{ color: 'var(--penny-500)' }}>starts with one lesson</em>
        </h2>
        <p style={{ color: 'var(--stone-500)', fontSize: '15px', marginBottom: '32px', fontWeight: 300 }}>
          Free to start. Takes 2 minutes to set up. No credit card, no spam, no financial products pushed at you.
        </p>
        <Link href="/auth" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', minWidth: '240px' }}>
          Start for free →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--stone-200)',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--penny-400), var(--penny-600))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '10px', color: 'white' }}>p</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '14px', color: 'var(--penny-600)' }}>penny</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--stone-400)' }}>
          Built to actually help people with money. No ads. No affiliate links. No hidden agenda.
        </p>
      </footer>

    </div>
  )
}