// @ts-nocheck
'use client'

// app/simulate/[key]/page.js
// ─────────────────────────────────────────────────────────────
// Penny Individual Simulation Player
// Multi-step financial scenario with branching decisions.
// Each step presents a situation and choices with consequences.
// Final screen shows overall score and what the best path was.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCurrentUser, getProfile, supabase } from '../../../lib/supabase'
import { useTheme } from '../../../lib/theme'
import StreakCelebration from '../../../components/StreakCelebration'

// ─── Full simulation data ─────────────────────────────────────
const SIMULATIONS = {
  survive_college_debt: {
    key:   'survive_college_debt',
    emoji: '🎓',
    title: 'Survive College with Debt',
    intro: "You're a college junior. You have $34,000 in federal student loans, work 15 hours/week at $13/hr, and have $800/month in expenses. You just got an unexpected $400 bill from the campus health center. Let's see how you navigate the next 6 months.",
    color: '#2563eb',
    bg:    '#eff6ff',
    totalXP: 60,
    steps: [
      {
        id: 's1',
        situation: "The $400 health center bill arrives. You have $520 in your checking account and rent ($600) is due in 3 weeks.",
        question: "What do you do with the health bill?",
        choices: [
          { key: 'a', emoji: '💳', text: 'Pay it immediately with my debit card', outcome: 'bad', xp: 0, consequence: "You paid it — but now you have $120 left with rent due in 3 weeks. One small emergency away from overdrafting." },
          { key: 'b', emoji: '📞', text: 'Call the health center and ask about a payment plan', outcome: 'great', xp: 20, consequence: "Smart move. Campus health centers almost always offer 0% payment plans. You arrange $80/month for 5 months — no interest, rent is safe, you're not stressed." },
          { key: 'c', emoji: '🙈', text: 'Ignore it and hope it goes away', outcome: 'bad', xp: 0, consequence: "It doesn't go away. 90 days later it goes to collections, which shows up on your credit report and drops your score by 80 points. That $400 bill just cost you a lot more." },
          { key: 'd', emoji: '📲', text: 'Venmo your parents and ask for help', outcome: 'ok', xp: 5, consequence: "Your parents help out — this time. But you didn't learn the system that would have solved this yourself. Payment plans exist for exactly this situation." },
        ],
      },
      {
        id: 's2',
        situation: "A friend tells you about a credit card offering $200 cash back after spending $500 in the first 3 months. Your normal monthly spending is $800.",
        question: "What do you do?",
        choices: [
          { key: 'a', emoji: '✅', text: "Apply — I spend $800/month naturally, so I'll hit $500 easily", outcome: 'good', xp: 15, consequence: "Good thinking. You hit the minimum spend naturally, earn the $200, and pay it off in full each month. No interest, $200 ahead. This is how credit card rewards work correctly." },
          { key: 'b', emoji: '🛍️', text: 'Apply and spend extra to hit the bonus faster', outcome: 'bad', xp: 0, consequence: "You spent $200 extra you wouldn't have otherwise. The $200 bonus barely covers it, and now you have a credit card you're tempted to use for more. Not worth it." },
          { key: 'c', emoji: '❌', text: "Don't apply — credit cards are too dangerous", outcome: 'ok', xp: 5, consequence: "Cautious, but you're leaving $200 on the table and missing a chance to build credit. Used correctly, a credit card is a free tool — the danger is only if you carry a balance." },
          { key: 'd', emoji: '🤔', text: 'Apply but only use it for fixed bills so you know exactly what you owe', outcome: 'great', xp: 20, consequence: "Excellent strategy. Fixed bills only means predictable spending, you hit the bonus, build credit history, and never risk overspending. This is exactly the right approach for a starter card." },
        ],
      },
      {
        id: 's3',
        situation: "You graduate and enter the 6-month grace period on your $34,000 in federal student loans. Your first job pays $48,000/year. Your loan servicer contacts you about repayment options.",
        question: "Which repayment plan do you choose?",
        choices: [
          { key: 'a', emoji: '📋', text: 'Standard 10-year plan — highest monthly payment, done fastest', outcome: 'good', xp: 15, consequence: "About $350/month. You pay the most per month but the least total interest — roughly $8,000 over 10 years. Smart if you can afford it and don't plan to pursue PSLF." },
          { key: 'b', emoji: '📉', text: 'SAVE income-driven plan — payments based on your income', outcome: 'great', xp: 20, consequence: "Your payment would be around $180/month based on $48k income. Lower stress, more cash flow for investing and emergency fund. And if you work in public service, these payments count toward PSLF forgiveness." },
          { key: 'c', emoji: '⏸️', text: 'Apply for forbearance — pause payments for now', outcome: 'bad', xp: 0, consequence: "Interest accrues during forbearance on most federal loans. You pause payments but your balance grows. This is usually the worst option unless you're in a genuine financial emergency." },
          { key: 'd', emoji: '🚀', text: 'Pay extra every month to pay it off in 5 years', outcome: 'ok', xp: 8, consequence: "Admirable, but at $48k salary you should probably build your emergency fund and start investing before aggressive loan payoff. The math often favors investing over extra loan payments at 5-7% rates." },
        ],
      },
    ],
  },

  job_loss: {
    key:   'job_loss',
    emoji: '💼',
    title: 'Job Loss Survival',
    intro: "It's Monday morning. You just got laid off. Your final paycheck covers this week. You have $2,200 in savings, $1,400/month in expenses, and you were making $58,000/year. Here's the next 30 days.",
    color: '#b45309',
    bg:    '#fffbeb',
    totalXP: 60,
    steps: [
      {
        id: 'j1',
        situation: "Day 1. You just got the news. You have 30 days of expenses covered. What's your first move?",
        question: "What do you do in the first 24 hours?",
        choices: [
          { key: 'a', emoji: '😰', text: 'Panic and start applying for every job you can find', outcome: 'ok', xp: 5, consequence: "Understandable, but scattershot applications usually waste time. You need to handle the financial emergency first — unemployment filing, COBRA decision, budget reduction — before the job search." },
          { key: 'b', emoji: '📋', text: 'File for unemployment immediately, then review your budget', outcome: 'great', xp: 20, consequence: "Exactly right. Unemployment takes 2-3 weeks to process — filing immediately means money arrives sooner. Then you know your real runway. Most states pay 50-60% of your prior earnings up to a cap." },
          { key: 'c', emoji: '💸', text: 'Withdraw money from your 401k for emergency funds', outcome: 'bad', xp: 0, consequence: "Don't do this. Early 401k withdrawal means a 10% penalty plus income taxes — you'd lose 30-40% of what you take out. You have savings for exactly this. Your 401k is protected by law and can stay invested." },
          { key: 'd', emoji: '📞', text: 'Call a financial advisor', outcome: 'ok', xp: 5, consequence: "A good instinct, but the most urgent things — unemployment filing, COBRA decision, budget review — you can handle yourself in the first 24 hours. Save the advisor call for week 2." },
        ],
      },
      {
        id: 'j2',
        situation: "Your employer health insurance ends at the end of the month. You're 28 and healthy but have a prescription that costs $180/month. COBRA costs $480/month. The ACA marketplace has a plan for $140/month.",
        question: "What do you do about health insurance?",
        choices: [
          { key: 'a', emoji: '🏥', text: 'Take COBRA — keep my exact same coverage', outcome: 'bad', xp: 0, consequence: "At $480/month, COBRA will drain your savings in 4-5 months. It's the most expensive option and usually only worth it if you have major ongoing medical needs or are close to meeting a high deductible." },
          { key: 'b', emoji: '✅', text: 'Apply for ACA marketplace plan during the SEP window', outcome: 'great', xp: 20, consequence: "Job loss triggers a Special Enrollment Period — you have 60 days to apply. At $140/month, you save $340/month vs COBRA. Check if your prescription is covered. This is almost always the right call for healthy young adults." },
          { key: 'c', emoji: '🤞', text: 'Go uninsured and hope nothing happens', outcome: 'bad', xp: 0, consequence: "One ER visit or accident could mean a $15,000+ bill. Going uninsured while jobless is the worst-case financial scenario. ACA plans exist specifically for this situation and are heavily subsidized when you have low income." },
          { key: 'd', emoji: '💊', text: 'Stay on parents\' insurance if under 26', outcome: 'great', xp: 20, consequence: "If you qualify, this is free. Under the ACA, you can stay on a parent's plan until 26 regardless of employment status. This should always be the first thing you check." },
        ],
      },
      {
        id: 'j3',
        situation: "Week 3. Unemployment approved — you'll receive $1,050/month. Your expenses are $1,400. You're $350 short each month. You have $1,800 left in savings.",
        question: "How do you close the $350/month gap?",
        choices: [
          { key: 'a', emoji: '✂️', text: 'Cut non-essential spending immediately — subscriptions, dining, etc.', outcome: 'great', xp: 20, consequence: "This is the move. Cancel streaming extras, pause gym membership, cook at home. Most people find $200-400/month in cuttable expenses without feeling deprived. This buys you more runway without touching savings." },
          { key: 'b', emoji: '🚗', text: 'Do gig work — Uber, DoorDash, TaskRabbit — to fill the gap', outcome: 'great', xp: 20, consequence: "Excellent. Gig work is exactly what it's designed for — flexible income when you need it. $350 gap means about 3-4 hours of driving per day. This protects your savings while you job search full-time." },
          { key: 'c', emoji: '💳', text: 'Use a credit card to cover the shortfall', outcome: 'bad', xp: 0, consequence: "At 22% APR, every $350 you charge costs you more until you pay it off. Credit cards are for convenience and rewards, not bridging income gaps during unemployment. You'll come out of this with debt on top of job loss." },
          { key: 'd', emoji: '🏠', text: 'Talk to your landlord about a temporary reduction or deferral', outcome: 'ok', xp: 10, consequence: "Worth asking, and some landlords will accommodate a month or two of reduced payment. But don't count on it — have your Plan B ready. This works better as a supplement to expense cuts than as your main strategy." },
        ],
      },
    ],
  },

  paycheck_decisions: {
    key:   'paycheck_decisions',
    emoji: '💵',
    title: 'Paycheck Decisions',
    intro: "It's Friday. You got paid $1,200. You have: rent due in 5 days ($800), groceries needed ($120), and a friend's birthday dinner tonight ($65). Let's see how you navigate the next week.",
    color: '#d4781a',
    bg:    '#fdf8f0',
    totalXP: 45,
    steps: [
      {
        id: 'p1',
        situation: "Your $1,200 paycheck just hit. Rent ($800) is due in 5 days. You have $0 in savings.",
        question: "What's the very first thing you do?",
        choices: [
          { key: 'a', emoji: '🏠', text: 'Transfer $800 to rent immediately', outcome: 'great', xp: 20, consequence: "The single best first move. Rent is paid, stress gone, and you know exactly how much is left for everything else. This is the 'pay essentials first' principle in action." },
          { key: 'b', emoji: '🍽️', text: 'Go to dinner first — it\'s Friday, I\'ll handle rent Monday', outcome: 'bad', xp: 0, consequence: "Rent is due in 5 days and you have zero buffer. Going to dinner first means you'll spend more freely — and Murphy's Law says something will come up over the weekend." },
          { key: 'c', emoji: '📊', text: 'Map out all expenses before spending anything', outcome: 'great', xp: 20, consequence: "Perfect. 5 minutes of planning: rent $800, groceries $120, dinner $65 = $985. You have $215 left. Now you make decisions from a position of knowledge, not anxiety." },
          { key: 'd', emoji: '🛍️', text: 'Grab a few things I\'ve been wanting to buy', outcome: 'bad', xp: 0, consequence: "This is exactly how people end up stressed about rent. Your wants always feel urgent — but rent being late is a hard consequence with real fees and credit impact." },
        ],
      },
      {
        id: 'p2',
        situation: "Rent is paid. You have $400 left. You need $120 for groceries. Tonight is your friend's birthday dinner — estimated $65.",
        question: "How do you handle the dinner?",
        choices: [
          { key: 'a', emoji: '✅', text: 'Go — I have $400, I can afford $65', outcome: 'great', xp: 15, consequence: "Exactly right. You did the math, rent is paid, groceries covered, and you still have $215 left. Going to dinner is a completely responsible choice here. Financial health doesn't mean never spending on life." },
          { key: 'b', emoji: '❌', text: 'Skip it — I need to save every dollar', outcome: 'ok', xp: 5, consequence: "Too conservative. You have $400 and all essentials covered. $65 for a friend's birthday is completely within your means right now. Rigid deprivation isn't a sustainable strategy." },
          { key: 'c', emoji: '🤝', text: 'Suggest a cheaper alternative — grab drinks instead of dinner', outcome: 'good', xp: 10, consequence: "Reasonable if you're trying to save. A good friend will understand. But given your actual numbers tonight, you can afford the dinner — this is solving a problem that doesn't exist." },
          { key: 'd', emoji: '💳', text: 'Put dinner on credit card — I\'ll pay it off next paycheck', outcome: 'ok', xp: 3, consequence: "You have $400 in cash. There's no reason to use a credit card here — you're paying to defer a payment you already have the money for. Use the card for rewards if you want, but pay it when the statement closes." },
        ],
      },
      {
        id: 'p3',
        situation: "After rent, groceries, and dinner you have $215 left. Next paycheck is 2 weeks away. What do you do with the $215?",
        question: "What's the smartest move with this remaining money?",
        choices: [
          { key: 'a', emoji: '🏦', text: 'Move $150 to savings, keep $65 as buffer', outcome: 'great', xp: 20, consequence: "This is how emergency funds get built — one paycheck at a time. $150 saved, $65 for unexpected costs this week. In 6 months of doing this, you'd have $900+ saved without ever feeling deprived." },
          { key: 'b', emoji: '💰', text: 'Save all $215 — be as aggressive as possible', outcome: 'good', xp: 12, consequence: "Ambitious, but leaving zero buffer is risky. One $20 unexpected expense means a transfer back, or worse, a credit card charge. A small cash buffer reduces financial anxiety enormously." },
          { key: 'c', emoji: '🛒', text: 'Leave it in checking — I might need it for something', outcome: 'ok', xp: 5, consequence: "Studies show money left in checking gets spent. Without intentionally moving it to savings, it tends to disappear on small purchases by the end of the week. 'Might need it' usually means 'will spend it on things I don't need.'" },
          { key: 'd', emoji: '🎉', text: 'Spend it — it\'s been a tough week and I deserve it', outcome: 'bad', xp: 0, consequence: "Emotional spending is one of the biggest wealth destroyers. 'I deserve it' is the money script that keeps people broke. You do deserve things — but your future self deserves security more than your present self deserves stuff." },
        ],
      },
    ],
  },

  credit_card_trap: {
    key:   'credit_card_trap',
    emoji: '💳',
    title: 'Escaping Credit Card Debt',
    intro: "You have $8,400 spread across three credit cards: Card A ($3,200 at 26.99% APR), Card B ($2,800 at 22.99% APR), Card C ($2,400 at 19.99% APR). You have $400/month available for debt payoff after minimum payments. Let's build your strategy.",
    color: '#dc2626',
    bg:    '#fef2f2',
    totalXP: 55,
    steps: [
      {
        id: 'cc1',
        situation: "You have $400/month extra for debt payoff. Your options are the debt avalanche (highest interest first) or debt snowball (lowest balance first).",
        question: "Which method do you choose?",
        choices: [
          { key: 'a', emoji: '📐', text: 'Avalanche — attack Card A (26.99%) first, save most on interest', outcome: 'great', xp: 20, consequence: "Mathematically optimal. Attacking Card A first saves about $800 in total interest vs the snowball. If you can stay motivated by the math, this is the right call. Card A is paid off in ~9 months." },
          { key: 'b', emoji: '❄️', text: 'Snowball — attack Card C ($2,400 balance) first for a quick win', outcome: 'good', xp: 14, consequence: "Slightly less efficient mathematically, but the psychological win of eliminating Card C first can keep people on track. If you've struggled to stick to debt payoff before, the snowball might actually win because you follow through." },
          { key: 'c', emoji: '➗', text: 'Split $400 evenly across all three cards', outcome: 'bad', xp: 0, consequence: "This is the worst strategy. Spreading extra payments equally means none of the cards get paid off faster — you're just slowly reducing all three. Focused payoff is always better than splitting." },
          { key: 'd', emoji: '🏦', text: 'Consolidate all three into one personal loan first', outcome: 'ok', xp: 8, consequence: "Smart to consider — if you qualify for a personal loan at under 15%, consolidation saves money. But if your credit is already damaged, you might not get a good rate. Check the math before committing to this route." },
        ],
      },
      {
        id: 'cc2',
        situation: "8 months in, Card A is almost paid off. You get a 0% balance transfer offer — move Card B's $2,800 balance to a new card, 0% for 18 months, 3% transfer fee ($84). Should you?",
        question: "Do you take the balance transfer offer?",
        choices: [
          { key: 'a', emoji: '✅', text: 'Yes — 0% for 18 months, I\'ll pay it off in time', outcome: 'great', xp: 20, consequence: "Smart move if you're disciplined. $84 fee is tiny compared to 18 months of 22.99% interest savings on $2,800. Just make sure you have a plan to pay it off before the 18 months ends — after that, rates often jump to 25%+." },
          { key: 'b', emoji: '❌', text: 'No — it feels risky, I\'ll stick with my current plan', outcome: 'ok', xp: 8, consequence: "Cautious, and understandable. The risk is real — if you don't pay it off in 18 months, you could be worse off. But the math strongly favors taking it if you're committed to the payoff plan." },
          { key: 'c', emoji: '🛍️', text: 'Yes — and since it\'s 0%, I\'ll use the new card for some purchases too', outcome: 'bad', xp: 0, consequence: "No. The new card is a debt payoff tool, not spending money. Using it for purchases adds new debt on top of the balance transfer. This is how 0% offers turn into more debt." },
          { key: 'd', emoji: '🔢', text: 'Calculate exact savings first, then decide', outcome: 'great', xp: 20, consequence: "This is exactly the right process. 18 months of interest on $2,800 at 22.99% ≈ $580. Minus the $84 fee = $496 in savings. The math clearly says take it. Decisions like this should always be run through the numbers first." },
        ],
      },
      {
        id: 'cc3',
        situation: "You're 18 months in. Cards A and B are paid off. Card C has $800 left. You also have $0 in savings. You get your tax refund — $1,200.",
        question: "What do you do with the $1,200 refund?",
        choices: [
          { key: 'a', emoji: '💳', text: 'Pay off Card C completely ($800) and put $400 in savings', outcome: 'great', xp: 20, consequence: "Perfect allocation. Debt is gone, you start an emergency fund, and you feel the weight of those three cards finally lift. This is the finish line — and the beginning of building real wealth." },
          { key: 'b', emoji: '🎉', text: 'Reward yourself — you worked hard, spend it on something nice', outcome: 'bad', xp: 0, consequence: "You're $800 from being completely debt free. Spending this refund is the financial version of celebrating before the finish line. Pay off Card C, put the rest in savings, THEN celebrate." },
          { key: 'c', emoji: '💰', text: 'Put all $1,200 in savings, keep paying Card C monthly', outcome: 'ok', xp: 8, consequence: "Understandable instinct, but Card C is at 19.99% APR. Keeping $800 in savings earning 5% while paying 20% on debt is mathematically losing. Pay off the card first, then start building savings." },
          { key: 'd', emoji: '📈', text: 'Invest it all — start building wealth now', outcome: 'ok', xp: 6, consequence: "The enthusiasm is right but the timing is wrong. No investment reliably returns 20% — Card C's interest rate. Pay the debt first, then invest. Debt-free is the prerequisite for effective investing." },
        ],
      },
    ],
  },

  emergency_fund_build: {
    key:   'emergency_fund_build',
    emoji: '🆘',
    title: 'Building an Emergency Fund',
    intro: "You're starting from zero savings. You make $3,200/month after taxes and have $2,600 in fixed expenses. That leaves $600/month. But life keeps happening. Let's see if you can build a $3,000 emergency fund in 6 months.",
    color: '#16a34a',
    bg:    '#f0fdf4',
    totalXP: 50,
    steps: [
      {
        id: 'e1',
        situation: "Month 1. You have $600 available. Your goal is to start the emergency fund.",
        question: "How do you set up your savings system?",
        choices: [
          { key: 'a', emoji: '🤖', text: 'Set up auto-transfer of $500 on payday to a separate HYSA', outcome: 'great', xp: 20, consequence: "This is the gold standard. Auto-transfer means you never 'decide' whether to save — it just happens. Separate account means you don't see it and spend it. HYSA means it earns 4-5% while you build. $500 in month 1." },
          { key: 'b', emoji: '💪', text: 'Save whatever is left over at the end of each month', outcome: 'bad', xp: 0, consequence: "Studies consistently show that 'save what's left' results in saving almost nothing. Spending fills available space. Auto-transfer at the start of the month is the only reliable system." },
          { key: 'c', emoji: '📊', text: 'Save $600 — all of the available money', outcome: 'ok', xp: 8, consequence: "Ambitious, but leaving zero buffer for the whole month is risky. One small unexpected expense and the system collapses. $500 with a $100 cushion is more sustainable." },
          { key: 'd', emoji: '🏦', text: 'Keep it in checking — same bank, easier access', outcome: 'bad', xp: 0, consequence: "Money in checking gets spent. Psychological distance matters — when your emergency fund is in a separate account, you treat it differently. A HYSA also earns 50x more interest than most checking accounts." },
        ],
      },
      {
        id: 'e2',
        situation: "Month 3. You have $1,200 saved. Your car needs $400 in repairs you can't avoid. Your partner suggests using the emergency fund.",
        question: "Do you use the emergency fund for the car repair?",
        choices: [
          { key: 'a', emoji: '✅', text: 'Yes — this is exactly what emergency funds are for', outcome: 'great', xp: 20, consequence: "Correct. A car repair you can't avoid is a textbook emergency. Use $400, get the car fixed, reduce your monthly savings goal to $350 for the next 2 months to rebuild. This is the fund working as designed." },
          { key: 'b', emoji: '💳', text: 'No — use a credit card and pay it off next month', outcome: 'bad', xp: 0, consequence: "If you have $1,200 in an emergency fund, using a credit card for an emergency defeats the purpose. You'll pay interest on the credit card while emergency fund money sits earning 5%. Use the fund." },
          { key: 'c', emoji: '🔧', text: 'Find the cheapest possible fix and reduce the cost', outcome: 'good', xp: 12, consequence: "Smart to minimize the cost first — get multiple quotes, look for coupons, ask a mechanically-inclined friend. But the remaining cost should still come from the emergency fund, not a credit card." },
          { key: 'd', emoji: '🚌', text: "Don't fix it — take public transit for now", outcome: 'ok', xp: 8, consequence: "If it's truly optional, this works and protects your savings. But if the car is your only way to get to work, 'don't fix it' could cost you your job — which is a much bigger financial emergency." },
        ],
      },
      {
        id: 'e3',
        situation: "Month 6. You have $2,800 saved (close to the $3,000 goal). A friend offers you a chance to invest $500 in their startup. 'Ground floor opportunity,' they say.",
        question: "What do you do?",
        choices: [
          { key: 'a', emoji: '🎯', text: 'Finish the emergency fund goal first, then evaluate the investment', outcome: 'great', xp: 20, consequence: "The only right answer. Your emergency fund isn't finished. Without it, you're one paycheck from financial crisis. The startup can wait 1 month — if the friend can't, that tells you something about the deal." },
          { key: 'b', emoji: '🚀', text: 'Invest $500 — startups are how people build real wealth', outcome: 'bad', xp: 0, consequence: "90%+ of startups fail. Investing $500 in a friend's startup when you have zero financial foundation is a risk with very low expected value. Build the foundation first, then take calculated risks." },
          { key: 'c', emoji: '🤔', text: 'Ask lots of questions before deciding', outcome: 'good', xp: 12, consequence: "Good instinct. Due diligence is always right. But the real answer here is: finish your emergency fund first regardless of the investment quality. The timing is wrong even if the deal is good." },
          { key: 'd', emoji: '❌', text: "Decline — friends and money don't mix", outcome: 'ok', xp: 8, consequence: "Declining is the right outcome, but for the wrong reason. The issue isn't friendship — it's timing. Finish the emergency fund, then evaluate the opportunity on its merits with money you can afford to lose." },
        ],
      },
    ],
  },
}

// ─── Component ───────────────────────────────────────────────
export default function SimulationPlayerPage() {
  const router  = useRouter()
  const params  = useParams()
  const simKey  = params.key
  const { isDark } = useTheme()

  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [phase, setPhase]         = useState('intro')  // intro | step | complete
  const [currentStep, setCurrentStep] = useState(0)
  const [selected, setSelected]   = useState(null)
  const [revealed, setRevealed]   = useState(false)
  const [results, setResults]     = useState([])       // [{stepId, choiceKey, outcome, xp}]
  const [totalXP, setTotalXP]     = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)

  const sim  = SIMULATIONS[simKey]
  const step = sim?.steps[currentStep]

  const bg      = isDark ? '#0a0a08' : (sim?.bg || '#fafaf8')
  const surface = isDark ? '#1a1814' : '#ffffff'
  const border  = isDark ? '#2e2b26' : '#e8e4dc'
  const ink     = isDark ? '#f0ede8' : '#1c1a16'
  const inkDim  = isDark ? '#a8a298' : '#645e56'

  useEffect(() => {
    async function load() {
      const { user: currentUser } = await getCurrentUser()
      if (!currentUser) { router.push('/auth'); return }
      setUser(currentUser)
      setLoading(false)
    }
    load()
  }, [router])

  if (!sim) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤔</div>
          <p style={{ color: inkDim }}>Simulation not found.</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => router.push('/simulate')}>
            Back to simulations
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
        <div className="spinner" />
      </div>
    )
  }

  // ─── Outcome styles ───
  const OUTCOME = {
    great: { label: '🎯 Great choice!',    bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
    good:  { label: '✅ Good thinking',    bg: '#f0fdf4', border: '#a8d4bc', color: '#1e7a58' },
    ok:    { label: '🤔 Not bad, but...', bg: '#fffbeb', border: '#fcd34d', color: '#b45309' },
    bad:   { label: '⚠️ Heads up...',     bg: '#fef2f2', border: '#fca5a5', color: '#dc2626' },
  }

  // ─── Handle choice ───
  function handleSelect(key) {
    if (revealed) return
    setSelected(key)
  }

  function handleReveal() {
    if (!selected) return
    setRevealed(true)
  }

  function handleNext() {
    const choice = step.choices.find(c => c.key === selected)
    const newResults = [...results, {
      stepId: step.id,
      choiceKey: selected,
      outcome: choice.outcome,
      xp: choice.xp,
    }]
    setResults(newResults)
    setTotalXP(prev => prev + (choice?.xp || 0))

    if (currentStep < sim.steps.length - 1) {
      setCurrentStep(prev => prev + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      // Save to Supabase
      saveSimProgress(newResults)
      setPhase('complete')
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }

  async function saveSimProgress(finalResults) {
    if (!user) return
    const score = Math.round((finalResults.filter(r => r.outcome === 'great' || r.outcome === 'good').length / finalResults.length) * 100)
    const xpEarned = finalResults.reduce((sum, r) => sum + r.xp, 0)

    await supabase.from('simulation_progress').upsert({
      user_id: user.id,
      simulation_key: simKey,
      status: 'completed',
      outcome_score: score,
      decisions_made: finalResults,
      xp_earned: xpEarned,
      attempts: 1,
      best_score: score,
      last_played_at: new Date().toISOString(),
    }, { onConflict: 'user_id,simulation_key' })
  }

  const progress = ((currentStep) / sim.steps.length) * 100
  const selectedChoice = step?.choices.find(c => c.key === selected)
  const outcomeStyle = selectedChoice ? OUTCOME[selectedChoice.outcome] : null

  // ─── Intro screen ───
  if (phase === 'intro') {
    return (
      <div style={{
        minHeight: '100vh',
        background: isDark ? '#0a0a08' : sim.bg,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
          <div style={{ maxWidth: '520px', width: '100%' }}>

            {/* Back */}
            <button
              onClick={() => router.back()}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', color: inkDim, marginBottom: '24px', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-body)' }}
            >
              ← Simulations
            </button>

            {/* Sim card */}
            <div style={{
              background: surface,
              border: `1px solid ${border}`,
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}>
              <div style={{ fontSize: '52px', marginBottom: '16px', textAlign: 'center' }}>{sim.emoji}</div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                fontWeight: 400,
                letterSpacing: '-0.5px',
                color: ink,
                textAlign: 'center',
                marginBottom: '16px',
                lineHeight: 1.2,
              }}>
                {sim.title}
              </h1>

              <div style={{
                background: isDark ? '#1e1814' : sim.bg,
                border: `1px solid ${isDark ? '#2e2b26' : sim.border || '#e8e4dc'}`,
                borderRadius: '14px',
                padding: '16px 18px',
                marginBottom: '24px',
              }}>
                <p style={{ fontSize: '14.5px', color: ink, lineHeight: 1.7, fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
                  "{sim.intro}"
                </p>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', justifyContent: 'center' }}>
                {[
                  { label: 'Steps', value: sim.steps.length },
                  { label: 'Max XP', value: `+${sim.totalXP}` },
                  { label: 'Decisions', value: sim.steps.length * 4 },
                ].map((s, i) => (
                  <div key={i} style={{
                    flex: 1,
                    background: isDark ? '#2e2b26' : '#f4f2ee',
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: sim.color }}>{s.value}</div>
                    <div style={{ fontSize: '10px', color: inkDim, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <button
                className="btn btn-lg"
                style={{
                  width: '100%',
                  background: `linear-gradient(135deg, ${sim.color}dd, ${sim.color})`,
                  color: 'white',
                  boxShadow: `0 4px 16px ${sim.color}40`,
                }}
                onClick={() => setPhase('step')}
              >
                Start simulation →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Complete screen ───
  if (phase === 'complete') {
    const greatCount = results.filter(r => r.outcome === 'great').length
    const goodCount  = results.filter(r => r.outcome === 'good').length
    const score = Math.round(((greatCount + goodCount * 0.7) / results.length) * 100)

    const scoreLabel = score >= 80 ? '🏆 Excellent' : score >= 60 ? '✅ Good' : score >= 40 ? '🤔 Developing' : '📚 Keep Learning'
    const scoreColor = score >= 80 ? '#16a34a' : score >= 60 ? '#1e7a58' : score >= 40 ? '#b45309' : '#dc2626'

    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        {showCelebration && <StreakCelebration xp={totalXP} />}
        <div style={{ maxWidth: '480px', width: '100%' }}>

          <div style={{
            background: surface,
            border: `1px solid ${border}`,
            borderRadius: '24px',
            padding: '32px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '52px', marginBottom: '12px' }}>{sim.emoji}</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontStyle: 'italic', color: sim.color, marginBottom: '6px' }}>
              Simulation Complete!
            </h1>
            <p style={{ fontSize: '14px', color: inkDim, marginBottom: '24px' }}>{sim.title}</p>

            {/* Score */}
            <div style={{
              background: isDark ? '#2e2b26' : '#f4f2ee',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
            }}>
              <div style={{ fontSize: '48px', fontWeight: 800, color: scoreColor, lineHeight: 1, marginBottom: '4px' }}>
                {score}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: scoreColor, marginBottom: '12px' }}>
                {scoreLabel}
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {results.map((r, i) => (
                  <div key={i} style={{
                    width: '32px', height: '32px',
                    borderRadius: '8px',
                    background: r.outcome === 'great' ? '#16a34a' : r.outcome === 'good' ? '#1e7a58' : r.outcome === 'ok' ? '#b45309' : '#dc2626',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px',
                  }}>
                    {r.outcome === 'great' ? '🎯' : r.outcome === 'good' ? '✅' : r.outcome === 'ok' ? '🤔' : '⚠️'}
                  </div>
                ))}
              </div>
            </div>

            {/* XP earned */}
            <div style={{
              background: 'var(--penny-50)',
              border: '1px solid var(--penny-200)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '14px', color: inkDim }}>XP earned this run</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800, color: 'var(--penny-600)' }}>
                +{totalXP} XP
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={() => router.push('/simulate')}
              >
                More simulations →
              </button>
              <button
                className="btn btn-ghost"
                style={{ width: '100%' }}
                onClick={() => {
                  setPhase('intro')
                  setCurrentStep(0)
                  setSelected(null)
                  setRevealed(false)
                  setResults([])
                  setTotalXP(0)
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Step screen ───
  return (
    <div style={{
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(180deg, #0a0a08 0%, #12100e 100%)'
        : `linear-gradient(180deg, ${sim.bg} 0%, #fafaf8 40%)`,
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Top bar */}
      <div style={{
        background: isDark ? 'rgba(26,24,20,0.9)' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${border}`,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: inkDim, padding: '2px 6px' }}
        >
          ←
        </button>
        <div style={{ flex: 1, height: '4px', background: isDark ? '#2e2b26' : '#e8e4dc', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: `linear-gradient(90deg, ${sim.color}aa, ${sim.color})`,
            borderRadius: '2px',
            width: `${progress}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: inkDim, flexShrink: 0 }}>
          {currentStep + 1}/{sim.steps.length}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '24px 20px 40px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '540px' }}>

          {/* Scenario */}
          <div style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : 'white',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : sim.border || '#e8e4dc'}`,
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: inkDim, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
              Scenario {currentStep + 1}
            </div>
            <p style={{ fontSize: '15px', color: ink, lineHeight: 1.7, marginBottom: '14px' }}>
              {step.situation}
            </p>
            <div style={{
              background: isDark ? `${sim.color}20` : sim.bg,
              border: `1px solid ${isDark ? `${sim.color}40` : sim.border || '#e8e4dc'}`,
              borderRadius: '10px',
              padding: '12px 14px',
            }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: sim.color }}>
                {step.question}
              </p>
            </div>
          </div>

          {/* Choices */}
          {!revealed && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {step.choices.map((choice) => (
                  <button
                    key={choice.key}
                    onClick={() => handleSelect(choice.key)}
                    style={{
                      background: selected === choice.key
                        ? (isDark ? `${sim.color}20` : sim.bg)
                        : (isDark ? 'rgba(255,255,255,0.04)' : 'white'),
                      border: `1.5px solid ${selected === choice.key ? sim.color : border}`,
                      borderRadius: '14px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.12s',
                    }}
                  >
                    <span style={{ fontSize: '22px', flexShrink: 0 }}>{choice.emoji}</span>
                    <span style={{
                      fontSize: '14px',
                      color: selected === choice.key ? sim.color : ink,
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
                  background: selected ? `linear-gradient(135deg, ${sim.color}dd, ${sim.color})` : (isDark ? '#2e2b26' : '#e8e4dc'),
                  color: selected ? 'white' : inkDim,
                  cursor: selected ? 'pointer' : 'default',
                }}
                onClick={handleReveal}
                disabled={!selected}
              >
                See what happens →
              </button>
            </>
          )}

          {/* Revealed */}
          {revealed && selectedChoice && outcomeStyle && (
            <div style={{ animation: 'fadeUp 0.3s ease forwards' }}>
              <div style={{
                background: isDark ? '#1a1814' : outcomeStyle.bg,
                border: `1px solid ${isDark ? '#2e2b26' : outcomeStyle.border}`,
                borderRadius: '16px',
                padding: '18px',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: isDark ? '#f0ede8' : outcomeStyle.color }}>
                    {outcomeStyle.label}
                  </span>
                  {selectedChoice.xp > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      background: 'var(--forest-500)',
                      color: 'white',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}>
                      +{selectedChoice.xp} XP
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '14px', color: isDark ? '#a8a298' : outcomeStyle.color, lineHeight: 1.65 }}>
                  {selectedChoice.consequence}
                </p>
              </div>

              <button
                className="btn btn-lg"
                style={{
                  width: '100%',
                  background: `linear-gradient(135deg, ${sim.color}dd, ${sim.color})`,
                  color: 'white',
                }}
                onClick={handleNext}
              >
                {currentStep < sim.steps.length - 1 ? 'Next scenario →' : 'See results →'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}