'use client'

// app/auth/page.js
// ─────────────────────────────────────────────────────────────
// Penny Sign Up / Login Page
// Handles both signup and login with a toggled UI.
// After successful auth, redirects to /onboarding (new users)
// or /dashboard (returning users).
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, signIn, getProfile } from '../../lib/supabase'

export default function AuthPage() {
  const router = useRouter()

  // Toggle between 'signup' and 'login'
  const [mode, setMode] = useState('signup')

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')

  // UI state
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [success, setSuccess]   = useState(null)

  // ─── Handle Submit ───
  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        // Validate
        if (!displayName.trim()) {
          setError('Please enter your name.')
          setLoading(false)
          return
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters.')
          setLoading(false)
          return
        }

        const { error: signUpError } = await signUp(email, password, displayName)

        if (signUpError) {
          setError(signUpError.message)
          setLoading(false)
          return
        }

        // Success — redirect to onboarding
        setSuccess('Account created! Taking you to your personalized setup...')
        setTimeout(() => router.push('/onboarding'), 1500)

      } else {
        // Login
        const { data, error: signInError } = await signIn(email, password)

        if (signInError) {
          setError('Invalid email or password. Please try again.')
          setLoading(false)
          return
        }

        // Check if user has completed onboarding
        const { data: profile } = await getProfile(data.user.id)

        if (profile?.onboarding_completed) {
          router.push('/dashboard')
        } else {
          router.push('/onboarding')
        }
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // ─── Render ───
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--stone-50)',
      backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(212,120,26,0.08) 0%, transparent 60%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--penny-400) 0%, var(--penny-600) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 0 0 3px var(--penny-100), 0 8px 24px rgba(212,120,26,0.22)',
            position: 'relative',
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: '30px',
              color: 'white',
              lineHeight: 1,
              textShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}>p</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: '26px',
            color: 'var(--penny-600)',
            letterSpacing: '-0.5px',
            marginBottom: '6px',
          }}>penny</div>
          <p style={{ fontSize: '14px', color: 'var(--stone-500)', fontWeight: 300 }}>
            {mode === 'signup' ? 'Start your financial journey' : 'Welcome back'}
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>

          {/* Mode toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--stone-100)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '28px',
          }}>
            {['signup', 'login'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null) }}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s',
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? 'var(--penny-600)' : 'var(--stone-500)',
                  boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {m === 'signup' ? 'Sign Up' : 'Log In'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Name field (signup only) */}
            {mode === 'signup' && (
              <div style={{ marginBottom: '18px' }}>
                <label className="input-label">Your first name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="What should Penny call you?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  autoComplete="given-name"
                />
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: '18px' }}>
              <label className="input-label">Email address</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label className="input-label">Password</label>
              <input
                className="input"
                type="password"
                placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '13.5px',
                color: '#991b1b',
                marginBottom: '16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div style={{
                background: 'var(--forest-50)',
                border: '1px solid var(--forest-200)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '13.5px',
                color: 'var(--forest-700)',
                marginBottom: '16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}>
                <span>✅</span>
                <span>{success}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '18px', height: '18px' }} />
                  {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                mode === 'signup' ? 'Create my account →' : 'Sign in →'
              )}
            </button>

          </form>

          {/* Footer note */}
          {mode === 'signup' && (
            <p style={{
              fontSize: '12px',
              color: 'var(--stone-400)',
              textAlign: 'center',
              marginTop: '16px',
              lineHeight: 1.5,
            }}>
              By signing up you agree to our Terms of Service and Privacy Policy.
              Penny is free to use — no credit card required.
            </p>
          )}

        </div>
      </div>
    </div>
  )
}