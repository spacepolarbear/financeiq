// @ts-nocheck
'use client'

// app/upgrade/page.js
// ─────────────────────────────────────────────────────────────
// Penny Premium Upgrade Page
// Clean paywall. No dark patterns. Honest about what premium is.
// Stripe integration is a placeholder — wire up when ready.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getProfile } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'

const FEATURES = [
  {
    free:    '100 XP daily goal',
    premium: '300 XP daily goal',
    note:    'Do more lessons on days you have time',
  },
  {
    free:    'Core lessons only',
    premium: 'All lessons + deep-dive library',
    note:    'Full access to every module at every level',
  },
  {
    free:    'Basic simulations',
    premium: 'All 10 simulations',
    note:    'Including advanced career and investing scenarios',
  },
  {
    free:    'Streak breaks on missed days',
    premium: '1 streak freeze per week',
    note:    'Life happens — your streak is protected',
  },
  {
    free:    '1 ad per day for XP boost',
    premium: 'No ads. Ever.',
    note:    'Clean experience, always',
  },
  {
    free:    'Standard support',
    premium: 'Priority support',
    note:    'Faster responses when you have questions',
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const { isDark } = useTheme()

  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState('monthly') // 'monthly' | 'annual'

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

  const MONTHLY_PRICE = 4.99
  const ANNUAL_PRICE  = 3.33  // $39.99/year
  const ANNUAL_TOTAL  = 39.99
  const SAVINGS_PCT   = 33

  function handleUpgrade() {
    // Stripe integration placeholder
    // When ready: redirect to Stripe checkout or open Stripe modal
    alert('Stripe integration coming soon. Premium checkout will open here.')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
        <div className="spinner" />
      </div>
    )
  }

  if (isPremium) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>⭐</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontStyle: 'italic', color: 'var(--penny-600)', marginBottom: '10px' }}>
            You're already Premium
          </h1>
          <p style={{ fontSize: '14px', color: inkDim, marginBottom: '24px', lineHeight: 1.6 }}>
            You have full access to everything Penny has to offer. Enjoy the ride.
          </p>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => router.push('/dashboard')}>
            Back to dashboard →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: bg }}>

      {/* Back button */}
      <div style={{ padding: '16px 20px' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', color: inkDim, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          ← Back
        </button>
      </div>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '0 20px 60px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--penny-400), var(--penny-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 0 0 3px var(--penny-100), var(--shadow-penny)',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '30px', color: 'white' }}>p</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 400, letterSpacing: '-0.5px', marginBottom: '8px', color: ink }}>
            Penny <span style={{ fontStyle: 'italic', color: 'var(--penny-500)' }}>Premium</span>
          </h1>
          <p style={{ fontSize: '14px', color: inkDim, lineHeight: 1.6, maxWidth: '360px', margin: '0 auto' }}>
            More lessons per day, full content library, all simulations, and no ads. Upgrade when you're ready — no pressure.
          </p>
        </div>

        {/* Period toggle */}
        <div style={{
          display: 'flex',
          background: isDark ? '#2e2b26' : 'var(--stone-100)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
          position: 'relative',
        }}>
          {['monthly', 'annual'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
                background: period === p ? (isDark ? '#1a1814' : 'white') : 'transparent',
                color: period === p ? 'var(--penny-600)' : inkDim,
                boxShadow: period === p ? 'var(--shadow-sm)' : 'none',
                position: 'relative',
              }}
            >
              {p === 'annual' ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  Annual
                  <span style={{
                    background: 'var(--penny-500)',
                    color: 'white',
                    borderRadius: '100px',
                    padding: '1px 7px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                  }}>
                    SAVE {SAVINGS_PCT}%
                  </span>
                </span>
              ) : 'Monthly'}
            </button>
          ))}
        </div>

        {/* Price card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--penny-500), var(--penny-700))',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '20px',
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: '120px', height: '120px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }} />
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', letterSpacing: '2px', opacity: 0.7, marginBottom: '12px' }}>
            PENNY PREMIUM
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px', marginBottom: '6px' }}>
            <span style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1 }}>
              ${period === 'monthly' ? MONTHLY_PRICE : ANNUAL_PRICE}
            </span>
            <span style={{ fontSize: '16px', opacity: 0.7 }}>/month</span>
          </div>
          {period === 'annual' && (
            <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '4px' }}>
              Billed as ${ANNUAL_TOTAL}/year
            </div>
          )}
          <div style={{ fontSize: '13px', opacity: 0.65 }}>
            {period === 'monthly' ? 'Cancel anytime' : `Save $${((MONTHLY_PRICE * 12) - ANNUAL_TOTAL).toFixed(2)}/year vs monthly`}
          </div>
        </div>

        {/* CTA button */}
        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginBottom: '12px' }}
          onClick={handleUpgrade}
        >
          Start Premium →
        </button>
        <p style={{ fontSize: '12px', color: inkDim, textAlign: 'center', marginBottom: '28px' }}>
          Cancel anytime. No hidden fees. No gotchas.
        </p>

        {/* Feature comparison */}
        <div style={{
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            padding: '12px 16px',
            background: isDark ? '#2e2b26' : 'var(--stone-100)',
            borderBottom: `1px solid ${border}`,
          }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '1px', color: inkDim, textTransform: 'uppercase' }}>Feature</div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '1px', color: inkDim, textTransform: 'uppercase', textAlign: 'center' }}>Free</div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '1px', color: 'var(--penny-500)', textTransform: 'uppercase', textAlign: 'center' }}>Premium</div>
          </div>

          {FEATURES.map((f, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              padding: '13px 16px',
              borderBottom: i < FEATURES.length - 1 ? `1px solid ${border}` : 'none',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div>
                <div style={{ fontSize: '12px', color: inkDim, lineHeight: 1.4 }}>{f.note}</div>
              </div>
              <div style={{ fontSize: '12px', color: inkDim, textAlign: 'center', lineHeight: 1.4 }}>{f.free}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--penny-600)', textAlign: 'center', lineHeight: 1.4 }}>{f.premium}</div>
            </div>
          ))}
        </div>

        {/* Honest note */}
        <div style={{
          background: isDark ? '#1a1814' : 'var(--stone-100)',
          border: `1px solid ${border}`,
          borderRadius: '14px',
          padding: '16px 18px',
          fontSize: '13px',
          color: inkDim,
          lineHeight: 1.65,
        }}>
          <strong style={{ color: ink, display: 'block', marginBottom: '4px' }}>Honest note:</strong>
          The free version of Penny is genuinely useful. We're not crippling it to force upgrades. Premium is for people who want to learn faster and don't want any friction. If free works for you, that's completely fine with us.
        </div>

      </div>
    </div>
  )
}