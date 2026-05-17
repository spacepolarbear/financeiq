'use client'

// components/StreakCelebration.js
// ─────────────────────────────────────────────────────────────
// Full-screen celebration overlay shown when a lesson is
// completed. Shows XP earned with a pop animation.
// Auto-dismisses after 3 seconds.
// ─────────────────────────────────────────────────────────────

export default function StreakCelebration({ xp }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      background: 'rgba(28,26,22,0.4)',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.3s ease forwards',
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes celebPop {
          0%   { transform: scale(0.5) translateY(20px); opacity: 0; }
          60%  { transform: scale(1.1) translateY(-5px); opacity: 1; }
          80%  { transform: scale(0.97) translateY(0); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes xpFloat {
          0%   { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-40px); opacity: 0; }
        }
        @keyframes starPop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          70%  { transform: scale(1.2) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>

      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px 48px',
        textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        animation: 'celebPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        maxWidth: '320px',
        width: '90%',
      }}>
        <div style={{ fontSize: '56px', marginBottom: '16px', animation: 'starPop 0.4s 0.1s ease forwards', opacity: 0 }}>
          ⭐
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px',
          fontStyle: 'italic',
          color: 'var(--penny-600)',
          marginBottom: '8px',
          letterSpacing: '-0.5px',
        }}>
          Lesson complete!
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--penny-50)',
          border: '2px solid var(--penny-300)',
          borderRadius: '100px',
          padding: '8px 20px',
          fontFamily: 'var(--font-mono)',
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--penny-600)',
          animation: 'xpFloat 1s 1.5s ease forwards',
        }}>
          +{xp} XP
        </div>
      </div>
    </div>
  )
}