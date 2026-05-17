'use client'

// components/BottomNav.js
// ─────────────────────────────────────────────────────────────
// Shared bottom tab bar for all authenticated pages.
// Import this into dashboard, module, progress, simulate,
// and profile pages. Pass the activeTab string to highlight
// the correct tab.
//
// Usage:
//   import BottomNav from '../../components/BottomNav'
//   <BottomNav activeTab="home" />
// ─────────────────────────────────────────────────────────────

import { useRouter } from 'next/navigation'
import { useTheme } from '../lib/theme'

const TABS = [
  {
    key:   'home',
    label: 'Home',
    icon:  HomeIcon,
    route: '/dashboard',
  },
  {
    key:   'learn',
    label: 'Learn',
    icon:  LearnIcon,
    route: '/learn',
  },
  {
    key:   'simulate',
    label: 'Play',
    icon:  SimulateIcon,
    route: '/simulate',
    center: true, // Big center button
  },
  {
    key:   'progress',
    label: 'Progress',
    icon:  ProgressIcon,
    route: '/progress',
  },
  {
    key:   'profile',
    label: 'Profile',
    icon:  ProfileIcon,
    route: '/profile',
  },
]

export default function BottomNav({ activeTab }) {
  const router = useRouter()
  const { isDark } = useTheme()

  const bg     = isDark ? '#1a1814' : '#ffffff'
  const border = isDark ? '#2e2b26' : '#e8e4dc'
  const active = 'var(--penny-500)'
  const inactive = isDark ? '#6b6560' : '#b4ada0'

  return (
    <>
      {/* Spacer so page content doesn't hide behind nav */}
      <div style={{ height: '72px' }} />

      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        background: bg,
        borderTop: `1px solid ${border}`,
        display: 'flex',
        alignItems: 'center',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const Icon = tab.icon

          // Center "Play" button — elevated and prominent
          if (tab.center) {
            return (
              <div key={tab.key} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <button
                  onClick={() => router.push(tab.route)}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, var(--penny-400), var(--penny-600))',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(212,120,26,0.35)',
                    transform: 'translateY(-6px)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,120,26,0.45)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(-6px)'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(212,120,26,0.35)'
                  }}
                >
                  <Icon color="white" size={24} />
                </button>
              </div>
            )
          }

          return (
            <button
              key={tab.key}
              onClick={() => router.push(tab.route)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
                transition: 'all 0.12s',
                position: 'relative',
              }}
            >
              {/* Active indicator dot */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: active,
                }} />
              )}
              <Icon
                color={isActive ? active : inactive}
                size={22}
              />
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.3px',
                color: isActive ? active : inactive,
                fontWeight: isActive ? 700 : 400,
                transition: 'color 0.12s',
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}

// ─── SVG Icons ────────────────────────────────────────────────
function HomeIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 21V12h6v9" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  )
}

function LearnIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 19V6a2 2 0 012-2h12a2 2 0 012 2v13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M4 19a2 2 0 002 2h12a2 2 0 002-2" stroke={color} strokeWidth="1.8"/>
      <path d="M9 10h6M9 14h4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function SimulateIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="5,3 19,12 5,21" fill={color} />
    </svg>
  )
}

function ProgressIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 20h18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M7 20V14" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 20V8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M17 20V4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function ProfileIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}