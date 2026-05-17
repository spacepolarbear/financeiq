// lib/supabase.js
// ─────────────────────────────────────────────────────────────
// Supabase client for Penny
//
// SETUP INSTRUCTIONS:
// 1. Make sure you have a .env.local file in your project root
// 2. Add these two lines to it (get values from Supabase dashboard):
//    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
//    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
// 3. Never commit .env.local to GitHub
// ─────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// ─────────────────────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────────────────────

/**
 * Sign up a new user with email and password.
 * Supabase automatically sends a confirmation email.
 */
export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  })
  return { data, error }
}

/**
 * Sign in an existing user with email and password.
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get the currently logged-in user.
 * Returns null if no user is logged in.
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

/**
 * Get the current session.
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

// ─────────────────────────────────────────────────────────────
// Profile helpers
// ─────────────────────────────────────────────────────────────

/**
 * Fetch the full profile for a user by their ID.
 */
export async function getProfile(userId: string){
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

/**
 * Update a user's profile fields.
 * Pass only the fields you want to update.
 */
export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// ─────────────────────────────────────────────────────────────
// Quiz answer helpers
// ─────────────────────────────────────────────────────────────

/**
 * Save or update a quiz answer.
 * Uses UPSERT — safe to call multiple times.
 */
export async function saveQuizAnswer(userId: string, questionNumber: number, questionKey: string, answerKey: string | string[], skipped: boolean = false) {
  const { data, error } = await supabase
    .from('quiz_answers')
    .upsert(
      {
        user_id: userId,
        question_number: questionNumber,
        question_key: questionKey,
        answer_key: Array.isArray(answerKey) ? answerKey : [answerKey],
        skipped,
        answered_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,question_number' }
    )
    .select()
  return { data, error }
}

/**
 * Get all quiz answers for a user.
 */
export async function getQuizAnswers(userId: string)
 {
  const { data, error } = await supabase
    .from('quiz_answers')
    .select('*')
    .eq('user_id', userId)
    .order('question_number', { ascending: true })
  return { data, error }
}

// ─────────────────────────────────────────────────────────────
// Lesson progress helpers
// ─────────────────────────────────────────────────────────────

/**
 * Mark a lesson as completed and award XP.
 * Uses UPSERT — safe to call on already-completed lessons.
 */
export async function completeLesson(userId: string, lessonId: string, score: number | null = null, xpEarned: number = 10) {
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        status: 'completed',
        score,
        xp_earned: xpEarned,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' }
    )
    .select()
  return { data, error }
}

/**
 * Get all lesson progress for a user.
 */
export async function getLessonProgress(userId: string) {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*, lessons(title, module_id, lesson_number)')
    .eq('user_id', userId)
  return { data, error }
}

// ─────────────────────────────────────────────────────────────
// Streak helpers
// ─────────────────────────────────────────────────────────────

/**
 * Get the current streak for a user.
 */
export async function getStreak(userId: string) {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { data, error }
}

/**
 * Update streak after a lesson is completed.
 * Call this every time a lesson is finished.
 */
export async function updateStreak(userId: string) {
  const today = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Get current streak
  const { data: existing } = await getStreak(userId)

  let newStreak = 1
  let longestStreak = 1

  if (existing) {
    const lastDate = existing.last_activity_date

    if (lastDate === today) {
      // Already active today — no change
      return { data: existing, error: null }
    } else if (lastDate === yesterday) {
      // Continued streak
      newStreak = (existing.current_streak || 0) + 1
    } else {
      // Streak broken
      newStreak = 1
    }

    longestStreak = Math.max(newStreak, existing.longest_streak || 0)
  }

  const { data, error } = await supabase
    .from('streaks')
    .upsert(
      {
        user_id: userId,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  return { data, error }
}