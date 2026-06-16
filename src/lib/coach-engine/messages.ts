import { UserState } from './types';

interface MessageSet {
  motivational: string[];
  accountability: string[];
  recommendation: string[];
  nextAction: string[];
}

export const MESSAGE_TEMPLATES: Record<UserState, MessageSet> = {
  ON_FIRE: {
    motivational: [
      "You're on fire, {name}! 🔥 A {streak}-day streak shows serious dedication. This is how champions are made — one consistent day at a time.",
      "Absolute dominance, {name}! {streak} days straight. You're not just building a habit — you're becoming unstoppable. Keep the torch burning.",
      "{streak}-day streak and counting! {name}, you're in rare air. This level of consistency is what separates intention from achievement.",
    ],
    accountability: [
      "You've built something impressive. Don't let it slip — every day you show up, you're reinforcing a habit that's becoming part of who you are.",
      "A streak like this is fragile and powerful at the same time. Protect it like the accomplishment it is. One more day. Then another.",
      "The hardest part is already behind you. Now it's about protecting what you've built. Don't break the chain, {name}.",
    ],
    recommendation: [
      "Your consistency is elite. Consider increasing your daily target by 10% to stretch without breaking. Growth lives just outside your comfort zone.",
      "You've mastered showing up. Now focus on depth — spend 5 extra minutes on today's task refining your approach.",
      "With a {longestStreak}-day longest streak, you know what works. Double down on your winning routine and share your method with someone starting out.",
    ],
    nextAction: [
      "Complete today's task before your usual time to lock in the habit early and build buffer against interruptions.",
      "Pick the hardest part of your goal and tackle it first today. Momentum is on your side — use it.",
      "Review your last 7 days of progress and identify one pattern you can optimize. Then execute today's task with that insight.",
    ],
  },

  CONSISTENT: {
    motivational: [
      "Nice rhythm, {name}! A {streak}-day streak means you're turning consistency into a habit. Keep showing up and the results will follow.",
      "You're building real momentum, {name}. {streak} days in a row shows discipline. This is exactly how lasting change happens.",
      "Solid work, {name}! Consistency is the engine of achievement, and you're proving you have what it takes to keep it running.",
    ],
    accountability: [
      "You're in a great groove. The next 48 hours are critical — pushing to a {nextMilestone}-day streak creates momentum that carries you forward.",
      "This is the phase where good habits become automatic. Don't ease up now — the next few days lock in everything you've built.",
      "You're earning your consistency. Every day you show up, the person you're becoming gets a little stronger. Keep proving it to yourself.",
    ],
    recommendation: [
      "Your completion rate is solid at {completionRate}%. Try breaking your task into smaller chunks to make each session even more achievable.",
      "You're past the initial hump. Now's the perfect time to review your environment — is it set up to make showing up easy? Remove friction where you can.",
      "Consider tracking not just completion but quality. Rate each session 1-5 and look for patterns in your best days.",
    ],
    nextAction: [
      "Double down on what's working. Review your progress from the last 3 days and repeat your best approach today.",
      "Set an intention for today's session before you start. Write down one thing you want to improve from yesterday.",
      "Complete today's task and take 30 seconds to note what felt good about it. Celebrate the win — you've earned it.",
    ],
  },

  BUILDING: {
    motivational: [
      "You've started, {name} — and starting is the hardest part. Day {streak} is where momentum begins to build. Let's keep it going!",
      "Every streak starts with day 1. You're on day {streak} and you're building something real. I'm proud of you for showing up.",
      "The first steps are the bravest. You're laying the foundation for something meaningful, {name}. One day at a time.",
    ],
    accountability: [
      "The first 7 days determine the trajectory. Stay committed today and you'll be well on your way to a week-long streak.",
      "Right now, you're teaching your brain that this new habit is important. Every day you show up, the neural pathways get stronger.",
      "This is the fragile phase — and also the most exciting. Protect your streak like the new beginning it is. You've got this.",
    ],
    recommendation: [
      "Set a specific time and place for your daily action. Consistency thrives on routine — anchor this habit to something you already do.",
      "Make today's task so small it feels easy. A 5-minute session is infinitely better than skipping. Progress over perfection.",
      "Tell one person about your goal. Accountability doubles your chances of sticking with it through the first two weeks.",
    ],
    nextAction: [
      "Identify one small win from yesterday and build on it today. Stacking wins creates confidence.",
      "Set a daily reminder right now. Pick a time you can consistently protect and commit to it.",
      "Open your goal and do your minimum viable action. Don't overthink it — just start.",
    ],
  },

  RECOVERING: {
    motivational: [
      "Welcome back, {name}! Momentum pauses — it doesn't disappear. What matters is that you chose to return. That takes real courage.",
      "You're back in the arena, and that's what counts. Every comeback story starts with a single decision to try again. Today is that day.",
      "Missing a day doesn't erase your progress. The fact that you're here right now tells me everything about your resilience, {name}.",
    ],
    accountability: [
      "One missed day doesn't define your journey. What defines you is what you do next. Let's make today count.",
      "Don't let one gap become a pattern. You've proven you can do this — now prove it to yourself again. Today is your reset.",
      "Recovery isn't about catching up. It's about showing up. Leave the missed days behind and focus entirely on right now.",
    ],
    recommendation: [
      "Start with the smallest possible action. A 5-minute task is enough to rebuild the habit loop and remind your brain this matters.",
      "Reflect on what caused the gap — not to dwell, but to learn. Adjust your approach so the same obstacle doesn't stop you again.",
      "Don't try to make up for missed days. Just focus on today's single task. One win is all you need to rebuild momentum.",
    ],
    nextAction: [
      "Complete a micro-action right now. Even 2 minutes of progress counts. The goal is to rebuild the showing-up muscle.",
      "Re-read your original motivation for starting this goal. Reconnect with your 'why' before taking today's step.",
      "Send a message to your accountability partner or write a note about why you're coming back. Commitment strengthens with declaration.",
    ],
  },

  SLUMPING: {
    motivational: [
      "Every comeback starts with a single decision. This is your moment to reset and reclaim your momentum, {name}. I believe in you.",
      "It's okay to have tough patches. What matters is how you respond. You're stronger than this slump — and today is where you prove it.",
      "{name}, falling off track isn't failure. Staying off track is. You're still here, which means your journey isn't over — it's just restarting.",
    ],
    accountability: [
      "You've been away for a few days. That's okay — but today is where you choose. Future you is counting on you showing up right now.",
      "Momentum paused, but it hasn't disappeared. The version of you that started this goal is still in there. Let's wake them up today.",
      "This is a turning point. You can let the gap grow, or you can close it right now. One action changes the direction of your entire week.",
    ],
    recommendation: [
      "Reset by recommitting to the smallest version of your goal. Can you do just 5 minutes today? Start there and rebuild.",
      "Don't focus on the streak. Focus on a single, tiny win. Once you have that, the streak will take care of itself.",
      "Change your environment. If you usually work in the same space, try somewhere new. A fresh setting can break the resistance cycle.",
    ],
    nextAction: [
      "Open your goal and do one tiny thing. Don't think about the streak — just take one step forward. Then stop. You did it.",
      "Write down the one reason you started this goal in the first place. Read it out loud. Then do your smallest possible action.",
      "Close your eyes and imagine how you'll feel after completing just one small task. Now open your eyes and go do it.",
    ],
  },

  JUST_STARTING: {
    motivational: [
      "Welcome to Momentum, {name}! 🎉 Every expert was once a beginner. Your journey starts with a single step — and you've just taken it.",
      "Today is day 1 of your new story, {name}. The fact that you're here, ready to grow, is already a victory. Let's make it count.",
      "The best time to start was yesterday. The second best time is right now. You're here, you're ready, and I've got your back, {name}.",
    ],
    accountability: [
      "Day 1 is about showing up. Don't worry about streaks or perfection — just build the habit of showing up daily.",
      "This first week is about discovery. Learn what works for you, what time feels right, and how to make progress feel good.",
      "Every master was once a beginner who refused to quit. Today is your beginning. Show up and let the process work.",
    ],
    recommendation: [
      "Set a daily reminder at a time you can consistently protect. Morning works best for most people — before the day's chaos begins.",
      "Define your minimum viable action — the smallest thing you can do that counts as progress. Make it laughably easy.",
      "Set up your environment for success. Remove distractions, prepare your tools, and create a space where showing up feels natural.",
    ],
    nextAction: [
      "Define one tiny action you'll complete tomorrow. Make it so easy you can't say no. Then do it.",
      "Set your first daily reminder right now. Pick a time and commit to it. This is your first accountability step.",
      "Write down your 'why' in one sentence. When motivation dips, this sentence will bring you back. Keep it somewhere visible.",
    ],
  },

  ACHIEVEMENT: {
    motivational: [
      "{streak}-day streak, {name}! 🎉 That's a milestone to celebrate. You've proven something powerful to yourself — that you can sustain commitment over time.",
      "Incredible! {streak} days of consistency. This isn't luck — it's the result of daily choices adding up to something remarkable. Well done, {name}.",
      "Look at what you've built, {name}. {streak} days of showing up. Celebrate this moment — you've earned every bit of it. Then get ready for the next chapter.",
    ],
    accountability: [
      "A milestone like this is proof of your capability. Now let's not stop here. The next {nextMilestone} days will transform a habit into an identity.",
      "You've proven you can do the work. Now the question is: can you build on it? Don't let this milestone be a peak — make it a foundation.",
      "This is a moment to reflect and recommit. You didn't come this far to stop here. Let's set our sights on the next milestone.",
    ],
    recommendation: [
      "Reflect on what worked during this run. Identify your top three success factors and double down on them for the next cycle.",
      "Celebrate properly — then raise the bar. Add one new dimension to your goal that challenges you without overwhelming you.",
      "Share your achievement with someone who supported you. Articulating what worked reinforces your learning and inspires others.",
    ],
    nextAction: [
      "Take 2 minutes to acknowledge this win. Write down how you feel. Then set your intention for the next {nextMilestone} days.",
      "Review your journey from day 1 to today. Note the patterns that served you and commit to repeating them going forward.",
      "Update your goal or set a new micro-goal for the next phase. Growth doesn't stop — it evolves.",
    ],
  },
};

export const STATE_LABELS: Record<UserState, string> = {
  ON_FIRE: 'On Fire',
  CONSISTENT: 'Consistent',
  BUILDING: 'Building',
  RECOVERING: 'Recovering',
  SLUMPING: 'Slumping',
  JUST_STARTING: 'Just Starting',
  ACHIEVEMENT: 'Achievement',
};
