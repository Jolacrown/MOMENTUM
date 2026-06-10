import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const db = new PrismaClient();
const BCRYPT_COST = 4; // lower cost for dev speed (use 12 in production signup)

async function main() {
  // Seed test user
  const user = await db.user.upsert({
    where: { email: 'test@momentum.app' },
    update: {},
    create: {
      email: 'test@momentum.app',
      passwordHash: await bcrypt.hash('TestPass123!', BCRYPT_COST),
      name: 'Test User',
      skillLevel: 'beginner',
      learningStyle: 'mixed',
      dailyTimeMinutes: 30,
      timezone: 'Africa/Lagos',
      status: 'active',
      onboardingStep: 7,
      onboardingData: {
        name: 'Test User',
        goal: 'Learn UI/UX Design',
        skillLevel: 'beginner',
        learningStyle: 'mixed',
        dailyTime: 30,
        reminderTime: '08:00',
        consentAccepted: true,
      },
      consentAcceptedAt: new Date(),
      consentVersion: '1.0',
    },
  });

  // Seed active goal
  await db.goal.upsert({
    where: { id: 'seed-goal-001' },
    update: {},
    create: {
      id: 'seed-goal-001',
      userId: user.id,
      title: 'Learn UI/UX Design',
      status: 'active',
      progressPercent: 20,
    },
  });

  // Seed streak record
  await db.streak.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      currentStreak: 5,
      longestStreak: 14,
    },
  });

  // Seed sample recommendations
  const recommendations = [
    { type: 'course' as const, title: 'Google UX Design Certificate', tags: ['ux', 'beginner'], skillLevel: 'beginner' as const, isLocal: false },
    { type: 'mentor' as const, title: 'Find a Lagos Design Mentor', tags: ['design', 'nigeria'], skillLevel: 'beginner' as const, isLocal: true },
    { type: 'resource' as const, title: 'Design Nigeria Slack', tags: ['community', 'nigeria'], isLocal: true },
  ];

  for (const rec of recommendations) {
    // Check if recommendation already exists by title to avoid duplicates
    const existing = await db.recommendation.findFirst({ where: { title: rec.title } });
    if (!existing) {
      await db.recommendation.create({ data: rec });
    }
  }

  console.log('✅ Seed complete');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
