//@ts-nocheck
'use client'

// app/simulate/survive-the-month/page.js
// ─────────────────────────────────────────────────────────────
// "Survive the Month" — Module 1 Capstone
//
// A 4-week interactive budgeting simulation. User picks a
// character, faces real financial decisions each week, and
// gets a final financial health score.
//
// Structure:
//   phase: 'pick' → 'intro' → 'week' → 'result'
//   Each week: situation → choice → consequence → next week
//
// XP: +50 bonus, uncapped, regardless of performance
// Saves to: simulation_progress table (key: 'survive_the_month')
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, supabase } from '../../../lib/supabase'
import StreakCelebration from '../../../components/StreakCelebration'

// ─────────────────────────────────────────────────────────────
// CHARACTER PROFILES
// ─────────────────────────────────────────────────────────────
const CHARACTERS = [
  {
    id: 'maya',
    name: 'Maya',
    emoji: '🎓',
    role: 'College Junior · Part-time barista',
    income: 1100,
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    fixed: [
      { label: 'Shared apartment', amount: 480 },
      { label: 'Phone bill',       amount: 45  },
      { label: 'Transit pass',     amount: 35  },
    ],
    intro: "You're a junior splitting a 3-bedroom with two roommates. You work 20 hours a week at $13/hr. After taxes and fixed expenses you have $540 left each month for everything else.",
    challenge: "Tight income, no emergency fund yet, student loan grace period ending soon.",
  },
  {
    id: 'jordan',
    name: 'Jordan',
    emoji: '💼',
    role: 'Recent grad · First real job',
    income: 2800,
    color: '#d4781a',
    bg: '#fdf8f0',
    border: '#f5d9a8',
    fixed: [
      { label: 'Rent (own place)', amount: 1050 },
      { label: 'Car payment',      amount: 280  },
      { label: 'Student loan min', amount: 180  },
    ],
    intro: "You started your first salaried job 3 months ago. $48k/year sounds great until you see $2,800 take-home after taxes. Fixed expenses eat $1,510 before you even think about food.",
    challenge: "Lifestyle inflation temptation, student loans, building savings from zero.",
  },
  {
    id: 'alex',
    name: 'Alex',
    emoji: '🏠',
    role: 'Just moved out · Hourly worker',
    income: 1650,
    color: '#1e7a58',
    bg: '#f0f7f3',
    border: '#a8d4bc',
    fixed: [
      { label: 'Studio apartment', amount: 750 },
      { label: 'Utilities',        amount: 80  },
      { label: 'Car insurance',    amount: 95  },
    ],
    intro: "You moved out at 19 and work 38 hours a week in retail at $14/hr. Hours aren't always guaranteed. Fixed expenses are $925, leaving you $725 most months — less when hours get cut.",
    challenge: "Variable income, no financial cushion, learning everything on the fly.",
  },
]

// ─────────────────────────────────────────────────────────────
// WEEK SCENARIOS — per character
// Each week: { situation, question, choices: [{key,emoji,text,outcome,points,consequence}] }
// outcome: 'great' | 'good' | 'ok' | 'bad'
// points: added to health score (max 100 across 4 weeks)
// ─────────────────────────────────────────────────────────────
const WEEKS = {
  maya: [
    {
      week: 1,
      title: 'Week 1 — The Paycheck',
      situation: "Your $550 paycheck just hit (2 weeks of work). Rent is paid. You have $540 this month for groceries, going out, and anything else. A friend invites you to a $45 concert this Friday.",
      question: "What do you do with this paycheck first?",
      choices: [
        { key: 'a', emoji: '📊', text: 'Map out the full month before spending anything', outcome: 'great', points: 25,
          consequence: "You spend 10 minutes planning. Groceries $160, personal $80, dining $60, buffer $40 = $340. You have $200 unassigned — and you know exactly where it should go. The concert is $45 you can genuinely afford." },
        { key: 'b', emoji: '🎵', text: 'Buy the concert ticket first — $45 is not that much', outcome: 'ok', points: 10,
          consequence: "The concert was great. But you spent Friday–Sunday fairly freely and by Monday had $310 left for 3 more weeks of the month. Tight but survivable — you got lucky nothing unexpected came up." },
        { key: 'c', emoji: '🏦', text: 'Move $100 to savings immediately, then figure out the rest', outcome: 'good', points: 20,
          consequence: "Pay yourself first — solid instinct. $100 into savings, $440 left for the month. Still tight but you just built your emergency fund by $100 without thinking about it again." },
        { key: 'd', emoji: '🛍️', text: 'Stock up on things you\'ve been needing — clothes, supplies', outcome: 'bad', points: 0,
          consequence: "You spent $180 on things you'd been putting off. Felt productive. Then week 2 arrived and grocery money was gone by Wednesday. You borrowed $40 from a roommate." },
      ],
    },
    {
      week: 2,
      title: 'Week 2 — The Subscription Audit',
      situation: "You're reviewing your bank statement and find 4 subscriptions you forgot about: Spotify $10, unused gym app $8, a streaming service $15, and a storage app $3. Total: $36/month.",
      question: "What do you do with these subscriptions?",
      choices: [
        { key: 'a', emoji: '✂️', text: 'Cancel all 4 — $36/month is $432/year', outcome: 'great', points: 25,
          consequence: "$432/year back in your pocket. You re-download Spotify if you really miss it later. The gym app you forgot existed. That $36/month goes toward your emergency fund instead." },
        { key: 'b', emoji: '🤔', text: 'Keep Spotify, cancel the other three', outcome: 'good', points: 18,
          consequence: "You kept the one you actually use. $26/month saved — $312/year. Not perfect but honest. The streaming service you were using 2x a month wasn't worth $15." },
        { key: 'c', emoji: '😐', text: 'They\'re small amounts — not worth the effort to cancel', outcome: 'bad', points: 0,
          consequence: "$36/month feels small. Over 12 months that's $432 gone to things you weren't using. At your income, that's 3 weeks of groceries. Small amounts are only small individually." },
        { key: 'd', emoji: '📋', text: 'Cancel two now, revisit the others next month', outcome: 'ok', points: 12,
          consequence: "Half a step forward. The two you cancelled save $18/month. The other two are still running — but at least you're aware of them now." },
      ],
    },
    {
      week: 3,
      title: 'Week 3 — The Unexpected Bill',
      situation: "You get a $90 bill from the campus health center for a visit last month. You have $180 left for the week. Groceries will cost about $40. Rent isn't due for 3 weeks.",
      question: "How do you handle the $90 bill?",
      choices: [
        { key: 'a', emoji: '📞', text: 'Call and ask about a payment plan', outcome: 'great', points: 25,
          consequence: "The health center offers $30/month for 3 months — no interest. You keep $180 intact, groceries are covered, and the bill gets handled without stress. This option exists at almost every campus health service." },
        { key: 'b', emoji: '💵', text: 'Pay it now — get it done', outcome: 'ok', points: 12,
          consequence: "Bill is gone. You have $90 left for the week — $40 for groceries leaves $50. Tight but you made it. Would have been smarter to ask about a payment plan first." },
        { key: 'c', emoji: '🙈', text: 'Ignore it for now — deal with it next paycheck', outcome: 'bad', points: 0,
          consequence: "30 days later it gets a late fee added. 90 days later it goes to collections. A $90 bill just became a credit score problem. Medical billing is one of the most negotiable expenses that exists — ignoring it is the worst option." },
        { key: 'd', emoji: '💳', text: 'Put it on a credit card', outcome: 'ok', points: 8,
          consequence: "Bill is handled. But at 22% APR, if you don't pay it off this month it'll cost you more than $90. And the payment plan was free. Credit cards make sense for convenience — not for replacing free alternatives." },
      ],
    },
    {
      week: 4,
      title: 'Week 4 — The Finale',
      situation: "Last week of the month. You've been tracking well. You have $95 left. Your roommate wants to do a group grocery run — your share would be $55. You also just got an email: your student loan grace period ends in 30 days. Minimum payment will be $145/month starting next month.",
      question: "How do you handle this last week knowing what's coming?",
      choices: [
        { key: 'a', emoji: '📋', text: 'Do the grocery run AND start replanning next month\'s budget for the loan payment', outcome: 'great', points: 25,
          consequence: "You spend $55 on groceries ($40 left as buffer), then open your budget and find $145 to reallocate — cut dining by $40, personal by $50, subscriptions by $30, pick up one extra shift. Next month is planned before it starts. This is what financial control looks like." },
        { key: 'b', emoji: '🤞', text: 'Do the grocery run and figure out the loan next month', outcome: 'bad', points: 0,
          consequence: "Next month the $145 payment hits and you haven't adjusted anything. Something doesn't get paid. A bill you expected to cover gets missed. The loan doesn't disappear by waiting — it just surprises you." },
        { key: 'c', emoji: '🛒', text: 'Skip the group run — buy only what you absolutely need ($25)', outcome: 'ok', points: 15,
          consequence: "Conservative and reasonable. You save $30, have $70 buffer, and can start planning for the loan. Not the most social choice, but financially sound when cash is genuinely tight." },
        { key: 'd', emoji: '💪', text: 'Text your roommates to ask for a shift picking up next month to cover the new payment', outcome: 'good', points: 20,
          consequence: "Proactive income solution — exactly the right instinct. You do the grocery run, and you've already started solving next month's gap by looking for more hours. This is how financially aware people think." },
      ],
    },
  ],

  jordan: [
    {
      week: 1,
      title: 'Week 1 — The First Real Paycheck',
      situation: "First paycheck at the new job: $1,400 (biweekly). After fixed expenses ($1,510/month), you have about $1,290 each month for everything else. A coworker invites the team to a $90 dinner to celebrate your first month.",
      question: "How do you approach this first month?",
      choices: [
        { key: 'a', emoji: '📊', text: 'Build a full monthly budget before the dinner decision', outcome: 'great', points: 25,
          consequence: "You spend 20 minutes. Groceries $300, dining $200, transport $100, subscriptions $80, personal $150, savings $300, buffer $160. The $90 dinner fits in dining. You go, enjoy it, and the month is planned." },
        { key: 'b', emoji: '🍽️', text: 'Go to dinner — team bonding matters at a new job', outcome: 'ok', points: 12,
          consequence: "Good call socially. But without a budget, the $90 comes out of an undefined pool and sets a tone of spending freely. By week 3, you're not sure where $400 went." },
        { key: 'c', emoji: '🏦', text: 'Set up a $400/month auto-transfer to savings immediately', outcome: 'good', points: 20,
          consequence: "Pay yourself first on day one of the new job — before lifestyle inflation has a chance to set in. Smart. You have $890 left and you'll figure out the dinner separately." },
        { key: 'd', emoji: '🛍️', text: 'Upgrade some things now that you\'re earning real money', outcome: 'bad', points: 0,
          consequence: "New apartment decor, nicer clothes for work, upgraded subscriptions. You spent $600 in the first two weeks feeling like you could afford it. Technically true — but you saved nothing and the student loans are still there." },
      ],
    },
    {
      week: 2,
      title: 'Week 2 — The Lifestyle Creep',
      situation: "You've been eating out more since starting work — it's faster and you're tired after long days. You spend $340 on food this month between groceries and restaurants. That's $140 over your $200 dining budget.",
      question: "How do you course-correct?",
      choices: [
        { key: 'a', emoji: '🍳', text: 'Start meal prepping Sundays — one session covers most of the week', outcome: 'great', points: 25,
          consequence: "2-3 hours on Sunday, $60 in groceries, covers 4-5 dinners. You cut dining spending by $90/month. That's $1,080/year. The habit sticks because it solves the real problem: no time during the week." },
        { key: 'b', emoji: '✂️', text: 'Cut dining budget entirely for 2 weeks to catch up', outcome: 'ok', points: 10,
          consequence: "Overcorrection. You last 9 days before ordering delivery in desperation, spending $45 in one night. Extreme restriction rarely works — moderate habit change does." },
        { key: 'c', emoji: '📈', text: 'Acknowledge it, adjust the budget to $280 dining, cut something else', outcome: 'good', points: 20,
          consequence: "Realistic self-awareness. You increased dining, reduced personal shopping by $80. The new budget reflects your actual life. Not ideal, but honest — and honest budgets get followed." },
        { key: 'd', emoji: '🤷', text: 'It was a long month — give yourself a pass', outcome: 'bad', points: 0,
          consequence: "Next month is also a long month. And the one after. Lifestyle inflation doesn't announce itself — it just quietly becomes the new normal. This is exactly how it starts." },
      ],
    },
    {
      week: 3,
      title: 'Week 3 — The Opportunity',
      situation: "A friend mentions a side project that could make $200-400/month in your spare time — 5-8 hours per week of freelance writing. It would mean less free time but real extra income.",
      question: "What do you do?",
      choices: [
        { key: 'a', emoji: '💻', text: 'Start it — extra income accelerates everything', outcome: 'great', points: 25,
          consequence: "You commit to 6 hours/week. First month: $280. You put $200 toward the emergency fund, $80 into a sinking fund for a trip. By month 3 you have a $600 emergency fund and feel genuinely more stable." },
        { key: 'b', emoji: '🤔', text: 'Research it seriously before committing', outcome: 'good', points: 18,
          consequence: "Smart diligence. You spend a week understanding the platform, time requirements, and realistic income. Then you start with realistic expectations. Better than jumping in blind." },
        { key: 'c', emoji: '😴', text: 'Pass — you barely have free time as it is', outcome: 'ok', points: 10,
          consequence: "Protecting your wellbeing is valid. But the student loans aren't shrinking, and the emergency fund is still at $0. This was an option worth at least investigating before passing." },
        { key: 'd', emoji: '💸', text: 'Start it and immediately increase spending now that income will rise', outcome: 'bad', points: 0,
          consequence: "Spending the money before it arrives — and before you've confirmed how much or how reliably it comes in. Classic lifestyle inflation. The side income becomes a baseline instead of a boost." },
      ],
    },
    {
      week: 4,
      title: 'Week 4 — The Reality Check',
      situation: "End of month. You calculate: earned $2,800, spent $2,650, saved $150. Your emergency fund goal is $8,400 (3 months expenses). At this rate it takes 56 months — over 4 years.",
      question: "What's your response to this math?",
      choices: [
        { key: 'a', emoji: '🎯', text: 'Set a specific 12-month target and find $300/month more to save', outcome: 'great', points: 25,
          consequence: "You audit every category and find: cancel 3 subscriptions ($45), reduce dining by $80, pause personal shopping for 2 months ($150), pick up the freelance work ($200). $475 more/month freed up. Emergency fund in 12 months instead of 56. One decision, completely different outcome." },
        { key: 'b', emoji: '😰', text: 'Feel overwhelmed and put off the decision', outcome: 'bad', points: 0,
          consequence: "Month 2 starts the same way. Then month 3. The math doesn't change unless the behavior changes. Discomfort avoided today is a larger problem tomorrow." },
        { key: 'c', emoji: '📈', text: 'Accept it — $150/month savings is better than nothing', outcome: 'ok', points: 8,
          consequence: "True, but this is a case where modest acceptance leads to very slow progress. At your income, $150/month is genuinely improvable. The ceiling isn't $150 — the current habits just make it feel that way." },
        { key: 'd', emoji: '🔍', text: 'Look specifically at the student loan strategy alongside savings', outcome: 'good', points: 20,
          consequence: "Smart systems thinking. You research whether extra loan payments or emergency fund building should come first (emergency fund first, then loans). You build a 24-month plan with both. Less dramatic than option A but more complete." },
      ],
    },
  ],

  alex: [
    {
      week: 1,
      title: 'Week 1 — The Variable Week',
      situation: "First week of the month. You were supposed to work 38 hours but the schedule got cut to 28. That's $140 less than expected this week. Your budget was built around full hours.",
      question: "How do you handle a short week?",
      choices: [
        { key: 'a', emoji: '📋', text: 'Immediately recalculate the month and identify what to cut', outcome: 'great', points: 25,
          consequence: "You pull up your budget. $140 short means cutting dining by $60 and personal by $80 for the month. Not fun, but you know exactly what you're working with. No surprises week 4." },
        { key: 'b', emoji: '💪', text: 'Pick up extra shifts or a weekend gig to make up the difference', outcome: 'great', points: 25,
          consequence: "Income solution over expense cuts — valid and often better. You ask for extra shifts, pick up 2, recover $90 of the $140. The remaining $50 gap is manageable with minor cuts." },
        { key: 'c', emoji: '🤞', text: 'Hope next week is better — it usually evens out', outcome: 'ok', points: 8,
          consequence: "Sometimes it does even out. But 'hoping' isn't a financial strategy. You got lucky this time — but the next short week might stack with a bill." },
        { key: 'd', emoji: '💳', text: 'Use the credit card this week and pay it off next paycheck', outcome: 'bad', points: 0,
          consequence: "Using credit to fill income gaps creates a debt cycle. If next week is also short, you can't pay it off and the balance grows. The card now costs more than the original $140 shortfall." },
      ],
    },
    {
      week: 2,
      title: 'Week 2 — The Social Pressure',
      situation: "Friends want to do a birthday dinner for someone in the group. Estimated cost: $65 with drinks and tip. You have $310 left for the next 3 weeks after fixed expenses. Groceries will cost about $120 more this month.",
      question: "What do you do about the dinner?",
      choices: [
        { key: 'a', emoji: '✅', text: 'Go — you can afford $65 and friendships matter', outcome: 'great', points: 22,
          consequence: "You check the math: $310 − $65 dinner − $120 groceries = $125 for 3 weeks. Tight but real. You go, enjoy it, and spend conservatively the rest of the month. Financial health doesn't mean never spending on life." },
        { key: 'b', emoji: '🍹', text: 'Go but order only a main, no drinks — keep it to $35', outcome: 'good', points: 18,
          consequence: "Smart compromise. You show up, contribute to the birthday, and spend $30 less. Nobody cared what you ordered. You kept $30 and had a good time." },
        { key: 'c', emoji: '❌', text: 'Skip it — you can\'t afford to go out right now', outcome: 'ok', points: 10,
          consequence: "Financially conservative — but the math actually supports going. Skipping things you can genuinely afford leads to feeling deprived without reason, which causes bigger spending binges later." },
        { key: 'd', emoji: '💸', text: 'Go and don\'t track what you spend — it\'s one night', outcome: 'bad', points: 0,
          consequence: "The dinner was $65 but drinks kept going, then dessert, then a late stop. $110 total. The 'one night' exception became a $45 budget hole you didn't anticipate." },
      ],
    },
    {
      week: 3,
      title: 'Week 3 — The Emergency',
      situation: "Your phone screen cracked badly — it's hard to use. Repair cost: $120. You have $190 left for the week. No emergency fund yet. Payday is in 6 days.",
      question: "How do you handle the phone?",
      choices: [
        { key: 'a', emoji: '🔍', text: 'Get 3 quotes — independent repair shops are often $40-60 cheaper', outcome: 'great', points: 25,
          consequence: "You find a local shop for $75 vs the $120 Apple quote. You pay $75, have $115 left, and grocery money is still intact. Comparison shopping on repairs is one of the highest hourly-rate activities you can do." },
        { key: 'b', emoji: '💵', text: 'Pay the $120 now — the phone is necessary for work', outcome: 'ok', points: 12,
          consequence: "It is necessary. You pay $120, have $70 left for 6 days. Very tight. You make it work with minimal spending but it's stressful. This is exactly what an emergency fund prevents." },
        { key: 'c', emoji: '🤝', text: 'Ask a family member to cover it, pay them back next paycheck', outcome: 'good', points: 15,
          consequence: "Interest-free, bought you 6 days. You pay them back immediately on payday as promised. Borrowing from family works when you're reliable about repaying — and you were." },
        { key: 'd', emoji: '💳', text: 'Put it on a credit card at 24% APR', outcome: 'ok', points: 8,
          consequence: "Solved the immediate problem. But if you don't pay it off in full when the statement comes, that $120 starts growing. This is how credit card debt starts — one legitimate emergency at a time." },
      ],
    },
    {
      week: 4,
      title: 'Week 4 — The Big Picture',
      situation: "Last week of the month. You look at everything: income was $1,540 (slightly short month), total spent $1,480, saved $60. You have zero emergency fund. One bad month could put you in debt.",
      question: "What's your plan going forward?",
      choices: [
        { key: 'a', emoji: '🎯', text: 'Set a specific goal: $500 emergency fund in 4 months, find $125/month', outcome: 'great', points: 25,
          consequence: "Specific, achievable, time-bound. You identify: pack lunch 3x/week ($45 saved), cancel unused app ($8), request one guaranteed extra shift/week ($56 more). $109/month found. $500 in 5 months. You're not just hoping — you have a plan." },
        { key: 'b', emoji: '📈', text: 'Start looking for a higher-paying job or negotiate a raise', outcome: 'good', points: 20,
          consequence: "Income is the biggest lever at your income level. You update your resume, research comparable pay, and schedule a conversation with your manager. 3 months later you're making $15.50/hr. That $1.50 is $3,000/year." },
        { key: 'c', emoji: '😮‍💨', text: 'Feel relieved you broke even — worry about savings later', outcome: 'bad', points: 0,
          consequence: "Breaking even feels safe but it's actually the most dangerous financial position. One real emergency and you're in debt. 'Later' has no deadline — which means it doesn't happen." },
        { key: 'd', emoji: '🔄', text: 'Commit to tracking every transaction next month to find the leaks', outcome: 'good', points: 18,
          consequence: "Visibility first — a solid first step. You can't optimize what you can't see. Tracking for one month usually reveals $80-150 in spending you didn't realize was happening." },
      ],
    },
  ],
}

// ─────────────────────────────────────────────────────────────
// OUTCOME STYLES
// ─────────────────────────────────────────────────────────────
const OUTCOME_STYLE = {
  great: { label: '🎯 Best move',      bg: '#f0fdf4', border: '#86efac', color: '#15803d', barColor: '#16a34a' },
  good:  { label: '✅ Good thinking',  bg: '#f0fdf4', border: '#a8d4bc', color: '#1e7a58', barColor: '#1e7a58' },
  ok:    { label: '🤔 Not bad, but…',  bg: '#fffbeb', border: '#fcd34d', color: '#b45309', barColor: '#f59e0b' },
  bad:   { label: '⚠️ Heads up',       bg: '#fef2f2', border: '#fca5a5', color: '#dc2626', barColor: '#ef4444' },
}

// ─────────────────────────────────────────────────────────────
// HEALTH SCORE LABEL
// ─────────────────────────────────────────────────────────────
function getHealthLabel(score) {
  if (score >= 90) return { label: '🏆 Outstanding',    color: '#16a34a' }
  if (score >= 75) return { label: '✅ Solid',          color: '#1e7a58' }
  if (score >= 55) return { label: '📈 Developing',    color: '#d4781a' }
  if (score >= 35) return { label: '🌱 Getting There', color: '#b45309' }
  return                  { label: '📚 Keep Learning', color: '#dc2626' }
}

// ─────────────────────────────────────────────────────────────
// AWARD CAPSTONE XP
// ─────────────────────────────────────────────────────────────
async function awardCapstoneXP(userId) {
  if (!userId) return
  try {
    await supabase.from('xp_ledger').insert({
      user_id:   userId,
      amount:    50,
      source:    'capstone_complete',
      earned_at: new Date().toISOString(),
    })
    // Capstone XP is uncapped — add directly to total
    try {
  await supabase.rpc('increment_xp', { user_id_input: userId, xp_amount: 50 })
} catch {
  // Fallback if RPC doesn't exist
  const { data } = await supabase
    .from('profiles')
    .select('xp_total')
    .eq('id', userId)
    .single()
  if (data) {
    await supabase
      .from('profiles')
      .update({ 
        xp_total: (data.xp_total || 0) + 50,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
  }
}
    await supabase.from('simulation_progress').upsert({
      user_id:        userId,
      simulation_key: 'survive_the_month',
      status:         'completed',
      xp_earned:      50,
      last_played_at: new Date().toISOString(),
    }, { onConflict: 'user_id,simulation_key' })
  } catch (err) {
    console.error('Capstone XP error:', err)
  }
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function SurviveTheMonth() {
  const router = useRouter()
  const [userId, setUserId]         = useState(null)
  const [phase, setPhase]           = useState('pick')     // pick | intro | week | result
  const [character, setCharacter]   = useState(null)
  const [weekIndex, setWeekIndex]   = useState(0)
  const [stepInWeek, setStepInWeek] = useState('question') // question | consequence
  const [selected, setSelected]     = useState(null)
  const [decisions, setDecisions]   = useState([])         // [{week, choiceKey, outcome, points}]
  const [healthScore, setHealthScore] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    getCurrentUser().then(({ user }) => { if (user) setUserId(user.id) })
  }, [])

  const weeks      = character ? WEEKS[character.id] : []
  const currentWeek = weeks[weekIndex]
  const selectedChoice = currentWeek?.choices.find(c => c.key === selected)

  function pickCharacter(char) {
    setCharacter(char)
    setPhase('intro')
  }

  function startSimulation() {
    setPhase('week')
    setWeekIndex(0)
    setStepInWeek('question')
    setSelected(null)
  }

  function handleChoiceSelect(key) {
    if (stepInWeek !== 'question') return
    setSelected(key)
  }

  function handleReveal() {
    if (!selected) return
    setStepInWeek('consequence')
    const choice = currentWeek.choices.find(c => c.key === selected)
    const newDecisions = [...decisions, {
      week:      weekIndex + 1,
      weekTitle: currentWeek.title,
      choiceKey: selected,
      choiceText: choice.text,
      outcome:   choice.outcome,
      points:    choice.points,
      consequence: choice.consequence,
    }]
    setDecisions(newDecisions)
    setHealthScore(prev => prev + choice.points)
  }

  function handleNext() {
    if (weekIndex < weeks.length - 1) {
      setWeekIndex(prev => prev + 1)
      setStepInWeek('question')
      setSelected(null)
    } else {
      // Finished all weeks
      awardCapstoneXP(userId)
      setPhase('result')
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }

  const maxScore    = weeks.length > 0 ? weeks.reduce((sum, w) => sum + Math.max(...w.choices.map(c => c.points)), 0) : 100
  const scorePct    = Math.round((healthScore / maxScore) * 100)
  const healthLabel = getHealthLabel(scorePct)

  // ─── Styles (uses Penny CSS vars from globals.css) ───────
  const S = {
    page: {
      minHeight: '100vh',
      background: 'var(--stone-50)',
      display: 'flex',
      flexDirection: 'column',
    },
    topBar: {
      background: 'white',
      borderBottom: '1px solid var(--stone-200)',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    },
    backBtn: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontSize: '18px',
      color: 'var(--stone-400)',
      padding: '2px 6px',
    },
    topTitle: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontSize: '16px',
      color: 'var(--penny-600)',
    },
    main: {
      flex: 1,
      maxWidth: '560px',
      margin: '0 auto',
      width: '100%',
      padding: '24px 20px 60px',
    },
    card: (bg, border) => ({
      background: bg || 'white',
      border: `1px solid ${border || 'var(--stone-200)'}`,
      borderRadius: '18px',
      padding: '22px',
      marginBottom: '14px',
    }),
  }

  // ─── PHASE: PICK CHARACTER ────────────────────────────────
  if (phase === 'pick') {
    return (
      <div style={S.page}>
        <div style={S.topBar}>
          <button style={S.backBtn} onClick={() => router.back()}>←</button>
          <span style={S.topTitle}>Survive the Month</span>
        </div>
        <div style={S.main}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 400, letterSpacing: '-0.5px', marginBottom: '8px' }}>
              Module 1 Capstone
            </h1>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '22px', color: 'var(--penny-500)', marginBottom: '12px' }}>
              Survive the Month
            </div>
            <p style={{ fontSize: '14px', color: 'var(--stone-500)', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
              4 weeks. Real decisions. Your choices shape the outcome. Pick who you're playing as.
            </p>
          </div>

          {CHARACTERS.map((char) => (
            <button
              key={char.id}
              onClick={() => pickCharacter(char)}
              style={{
                ...S.card(char.bg, char.border),
                cursor: 'pointer',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                width: '100%',
                textAlign: 'left',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: '32px', flexShrink: 0 }}>{char.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: char.color, marginBottom: '3px' }}>{char.name}</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--stone-400)', marginBottom: '8px', letterSpacing: '0.3px' }}>{char.role}</div>
                <div style={{ fontSize: '13px', color: 'var(--stone-600)', lineHeight: 1.5 }}>{char.intro}</div>
              </div>
              <div style={{ color: char.color, fontSize: '18px', flexShrink: 0, marginTop: '4px' }}>→</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ─── PHASE: INTRO ─────────────────────────────────────────
  if (phase === 'intro') {
    const income = character.income
    const fixed  = character.fixed
    const fixedTotal = fixed.reduce((s, f) => s + f.amount, 0)
    const remaining  = income - fixedTotal

    return (
      <div style={S.page}>
        <div style={S.topBar}>
          <button style={S.backBtn} onClick={() => setPhase('pick')}>←</button>
          <span style={S.topTitle}>Survive the Month — {character.name}</span>
        </div>
        <div style={S.main}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>{character.emoji}</div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{character.name}</h2>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--stone-400)', letterSpacing: '0.5px' }}>{character.role}</div>
          </div>

          <div style={S.card(character.bg, character.border)}>
            <p style={{ fontSize: '14px', color: 'var(--stone-700)', lineHeight: 1.7, fontStyle: 'italic', fontFamily: 'var(--font-display)', marginBottom: '0' }}>
              "{character.intro}"
            </p>
          </div>

          <div style={S.card()}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--stone-400)', marginBottom: '14px' }}>
              Monthly Snapshot
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
              <span style={{ color: 'var(--stone-600)' }}>Monthly take-home</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--forest-600)' }}>+${income.toLocaleString()}</span>
            </div>
            {fixed.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px' }}>
                <span style={{ color: 'var(--stone-500)' }}>{f.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--stone-500)' }}>−${f.amount}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--stone-100)', paddingTop: '10px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800 }}>
              <span>Left for everything else</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: character.color }}>${remaining}</span>
            </div>
          </div>

          <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '12px', padding: '13px 16px', fontSize: '13px', color: '#854d0e', marginBottom: '20px', lineHeight: 1.6 }}>
            <strong style={{ display: 'block', marginBottom: '3px' }}>⚡ Your challenge:</strong>
            {character.challenge}
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', background: `linear-gradient(135deg, ${character.color}dd, ${character.color})` }}
            onClick={startSimulation}
          >
            Start Week 1 →
          </button>
        </div>
      </div>
    )
  }

  // ─── PHASE: WEEK ──────────────────────────────────────────
  if (phase === 'week' && currentWeek) {
    const outStyle = selectedChoice ? OUTCOME_STYLE[selectedChoice.outcome] : null

    return (
      <div style={S.page}>
        {/* Top bar with progress */}
        <div style={S.topBar}>
          <button style={S.backBtn} onClick={() => { if (weekIndex === 0) setPhase('intro'); else { setWeekIndex(w => w-1); setStepInWeek('question'); setSelected(null) } }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ height: '4px', background: 'var(--stone-100)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: `linear-gradient(90deg, ${character.color}aa, ${character.color})`,
                width: `${((weekIndex) / weeks.length) * 100}%`,
                borderRadius: '2px',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone-400)', flexShrink: 0 }}>
            Week {weekIndex + 1}/{weeks.length}
          </span>
        </div>

        <div style={S.main}>
          {/* Health score bar */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--stone-400)', marginBottom: '5px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>FINANCIAL HEALTH</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: character.color }}>{scorePct}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--stone-100)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: `linear-gradient(90deg, ${character.color}99, ${character.color})`,
                width: `${scorePct}%`,
                borderRadius: '3px',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          {/* Week title */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--stone-400)', marginBottom: '8px' }}>
            {currentWeek.title}
          </div>

          {/* Situation */}
          <div style={S.card(character.bg, character.border)}>
            <p style={{ fontSize: '14.5px', color: 'var(--stone-800)', lineHeight: 1.7 }}>
              {currentWeek.situation}
            </p>
          </div>

          {/* Question */}
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--stone-900)', marginBottom: '14px', letterSpacing: '-0.2px' }}>
            {currentWeek.question}
          </div>

          {/* Choices */}
          {stepInWeek === 'question' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '16px' }}>
                {currentWeek.choices.map((choice) => (
                  <button
                    key={choice.key}
                    onClick={() => handleChoiceSelect(choice.key)}
                    style={{
                      background: selected === choice.key ? character.bg : 'white',
                      border: `1.5px solid ${selected === choice.key ? character.color : 'var(--stone-200)'}`,
                      borderRadius: '13px',
                      padding: '13px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.12s',
                    }}
                  >
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>{choice.emoji}</span>
                    <span style={{
                      fontSize: '14px',
                      color: selected === choice.key ? character.color : 'var(--stone-700)',
                      fontWeight: selected === choice.key ? 600 : 400,
                      lineHeight: 1.4,
                    }}>
                      {choice.text}
                    </span>
                  </button>
                ))}
              </div>

              <button
                className="btn btn-lg"
                style={{
                  width: '100%',
                  background: selected ? `linear-gradient(135deg, ${character.color}dd, ${character.color})` : 'var(--stone-200)',
                  color: selected ? 'white' : 'var(--stone-400)',
                  cursor: selected ? 'pointer' : 'default',
                }}
                onClick={handleReveal}
                disabled={!selected}
              >
                See what happens →
              </button>
            </>
          )}

          {/* Consequence */}
          {stepInWeek === 'consequence' && selectedChoice && outStyle && (
            <div style={{ animation: 'fadeUp 0.3s ease forwards' }}>
              <div style={{
                background: outStyle.bg,
                border: `1px solid ${outStyle.border}`,
                borderRadius: '16px',
                padding: '18px',
                marginBottom: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: outStyle.color }}>{outStyle.label}</span>
                  <div style={{
                    marginLeft: 'auto',
                    background: outStyle.barColor,
                    color: 'white',
                    borderRadius: '100px',
                    padding: '2px 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}>
                    +{selectedChoice.points} pts
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: outStyle.color, lineHeight: 1.65 }}>
                  {selectedChoice.consequence}
                </p>
              </div>

              <button
                className="btn btn-lg"
                style={{
                  width: '100%',
                  background: `linear-gradient(135deg, ${character.color}dd, ${character.color})`,
                  color: 'white',
                }}
                onClick={handleNext}
              >
                {weekIndex < weeks.length - 1 ? `Week ${weekIndex + 2} →` : 'See your results →'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── PHASE: RESULT ────────────────────────────────────────
  if (phase === 'result') {
    return (
      <div style={S.page}>
        {showCelebration && <StreakCelebration xp={50} />}
        <div style={S.topBar}>
          <span style={S.topTitle}>Survive the Month — Complete</span>
        </div>
        <div style={S.main}>

          {/* Score hero */}
          <div style={{
            background: `linear-gradient(135deg, ${character.color}22, ${character.color}11)`,
            border: `1px solid ${character.border}`,
            borderRadius: '20px',
            padding: '28px',
            textAlign: 'center',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>{character.emoji}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '24px', color: character.color, marginBottom: '6px' }}>
              {character.name} survived the month
            </div>
            <div style={{ fontSize: '52px', fontWeight: 800, color: healthLabel.color, lineHeight: 1, marginBottom: '6px' }}>
              {scorePct}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: healthLabel.color, marginBottom: '16px' }}>
              {healthLabel.label}
            </div>

            {/* Health bar */}
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{
                height: '100%',
                background: healthLabel.color,
                width: `${scorePct}%`,
                borderRadius: '4px',
                transition: 'width 1s ease',
              }} />
            </div>

            {/* XP earned */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'white',
              border: '2px solid var(--penny-200)',
              borderRadius: '100px',
              padding: '8px 20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '16px',
              fontWeight: 800,
              color: 'var(--penny-600)',
            }}>
              +50 XP BONUS
            </div>
          </div>

          {/* Decision breakdown */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--stone-400)', marginBottom: '12px' }}>
            Your Decisions
          </div>

          {decisions.map((d, i) => {
            const os = OUTCOME_STYLE[d.outcome]
            return (
              <div key={i} style={{
                background: 'white',
                border: '1px solid var(--stone-200)',
                borderRadius: '14px',
                padding: '14px 16px',
                marginBottom: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone-400)', letterSpacing: '1px' }}>WEEK {d.week}</span>
                  <span style={{
                    marginLeft: 'auto',
                    background: os.bg,
                    border: `1px solid ${os.border}`,
                    color: os.color,
                    borderRadius: '4px',
                    padding: '1px 7px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}>
                    {os.label.split(' ').slice(0,2).join(' ')} · +{d.points}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stone-800)', marginBottom: '5px' }}>{d.choiceText}</div>
                <div style={{ fontSize: '12px', color: 'var(--stone-500)', lineHeight: 1.5 }}>{d.consequence}</div>
              </div>
            )
          })}

          {/* Module complete message */}
          <div style={{
            background: 'var(--stone-900)',
            borderRadius: '16px',
            padding: '22px',
            textAlign: 'center',
            marginTop: '8px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>💰</div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '20px', color: 'var(--penny-300)', marginBottom: '8px' }}>
              Module 1 Complete
            </div>
            <div style={{ fontSize: '13px', color: 'var(--stone-400)', lineHeight: 1.6 }}>
              Budgeting & Cash Flow — done. You've covered awareness, auditing, expense types, budgeting frameworks, emergency funds, and real-life decisions. Module 2 is unlocked.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => router.push('/learn')}>
              Start Module 2 →
            </button>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => { setPhase('pick'); setDecisions([]); setHealthScore(0); setWeekIndex(0) }}>
              Try a different character
            </button>
          </div>

        </div>
      </div>
    )
  }

  return null
}