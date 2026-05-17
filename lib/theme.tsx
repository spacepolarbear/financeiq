//@ts-nocheck
'use client'

// lib/theme.js
// ─────────────────────────────────────────────────────────────
// Theme context for Penny — light/dark mode toggle.
// Persists preference to localStorage.
// Wrap your root layout with <ThemeProvider>.
// Use useTheme() anywhere to get/set the current theme.
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('light')
  const [mounted, setMounted] = useState(false)

  // Load saved theme on mount
useEffect(() => {
  const saved = localStorage.getItem('penny-theme') as 'light' | 'dark' | null
  const initial = (saved === 'dark' || saved === 'light') ? saved : 'light'
  setTheme(initial)
  setMounted(true)
}, [])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('penny-theme', theme)
  }, [theme, mounted])

  function toggleTheme() {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  // Prevent flash of wrong theme
  if (!mounted) return null

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}