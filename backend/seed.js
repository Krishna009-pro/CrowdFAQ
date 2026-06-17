const mongoose = require("mongoose");
const env = require("./config/env");
const User = require("./models/User");
const Question = require("./models/Question");
const Answer = require("./models/Answer");
const Notification = require("./models/Notification");
const Report = require("./models/Report");

const mockUsers = [
  { mockId: 'u1', displayName: 'Mira Halverson', handle: 'mira.h', title: 'Staff Engineer', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80', reputationScore: 18420, email: 'mira.h@crowdfaq.local', role: 'admin' },
  { mockId: 'u2', displayName: 'Daniel Okafor', handle: 'okafor', title: 'Design Systems Lead', avatar: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=200&q=80', reputationScore: 12880, email: 'okafor@crowdfaq.local', role: 'moderator' },
  { mockId: 'u3', displayName: 'Aiko Tanaka', handle: 'aiko.t', title: 'Product Manager', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80', reputationScore: 9461, email: 'aiko.t@crowdfaq.local', role: 'student' },
  { mockId: 'u4', displayName: 'Rafael Costa', handle: 'rafa', title: 'Data Engineer', avatar: 'https://images.pexels.com/photos/12396627/pexels-photo-12396627.jpeg?auto=compress&w=200', reputationScore: 7203, email: 'rafa@crowdfaq.local', role: 'student' },
  { mockId: 'u5', displayName: 'Priya Raghavan', handle: 'priya.r', title: 'Security Engineer', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80', reputationScore: 5611, email: 'priya.r@crowdfaq.local', role: 'student' },
  { mockId: 'u6', displayName: 'Henrik Vossen', handle: 'henrik', title: 'People Ops Manager', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', reputationScore: 4203, email: 'henrik@crowdfaq.local', role: 'moderator' },
];

const mockQuestions = [
  {
    mockId: 'q-001',
    slug: 'how-to-rotate-aws-iam-keys-without-downtime',
    title: 'How do we rotate AWS IAM access keys for service accounts without downtime?',
    body: 'We have ~40 service accounts that consume AWS keys baked into config maps. We want to move to a 90-day rotation policy. What is the right pattern to rotate keys with zero downtime, ideally without touching Kubernetes deployments?',
    excerpt: 'We have ~40 service accounts that consume AWS keys baked into config maps. Looking for the right rotation pattern with zero downtime.',
    authorMockId: 'u5',
    upvoteCount: 142,
    downvoteCount: 0,
    views: 5482,
    status: 'verified',
    category: 'security',
    tags: ['aws', 'iam', 'rotation', 'kubernetes'],
    createdAt: '2026-02-04T10:22:00Z',
  },
  {
    mockId: 'q-002',
    slug: 'recommended-pattern-for-feature-flag-cleanup',
    title: 'Recommended pattern for cleaning up stale feature flags across a 2M LOC codebase?',
    excerpt: 'Our flag system is sprawling. Looking for an internal policy others have shipped that actually gets engineers to remove dead flags.',
    body: 'Our flag system has grown to ~1,400 flags, and a recent audit showed ~38% are dead. Looking for an enforceable policy.',
    authorMockId: 'u1',
    upvoteCount: 98,
    downvoteCount: 0,
    views: 3120,
    status: 'answered',
    category: 'engineering',
    tags: ['feature-flags', 'tech-debt', 'process'],
    createdAt: '2026-02-08T14:55:00Z',
  },
  {
    mockId: 'q-003',
    slug: 'onboarding-engineer-first-30-days',
    title: 'What does a great engineering onboarding plan look like for the first 30 days?',
    excerpt: 'I am building our first formal 30-60-90 onboarding. Curious how other teams structure the first month.',
    body: 'I am building our first formal 30-60-90 onboarding. Curious how other teams structure the first month, what artifacts are required, and what mistakes to avoid.',
    authorMockId: 'u6',
    upvoteCount: 67,
    downvoteCount: 0,
    views: 2104,
    status: 'answered',
    category: 'people-ops',
    tags: ['onboarding', '30-60-90', 'culture'],
    createdAt: '2026-02-10T09:10:00Z',
  },
  {
    mockId: 'q-004',
    slug: 'design-tokens-naming-convention',
    title: 'What naming convention do you use for design tokens across light and dark themes?',
    excerpt: 'We are scaling our token system to support 4 themes. Looking for a battle-tested naming approach.',
    body: 'We are scaling our token system to support 4 themes (light, dark, hi-contrast, brand-print). Want a battle-tested naming approach.',
    authorMockId: 'u2',
    upvoteCount: 54,
    downvoteCount: 0,
    views: 1880,
    status: 'verified',
    category: 'design',
    tags: ['design-tokens', 'theming', 'figma'],
    createdAt: '2026-02-09T11:31:00Z',
  },
  {
    mockId: 'q-005',
    slug: 'reimbursement-software-recommendations',
    title: 'Which expense reimbursement tool integrates cleanly with NetSuite and Deel?',
    excerpt: 'Evaluating Ramp, Brex, Pleo, and Expensify for a 240-person team across 12 countries.',
    body: 'Evaluating Ramp, Brex, Pleo, and Expensify for a 240-person team across 12 countries.',
    authorMockId: 'u3',
    upvoteCount: 21,
    downvoteCount: 0,
    views: 612,
    status: 'pending',
    category: 'finance',
    tags: ['expenses', 'netsuite', 'deel'],
    createdAt: '2026-02-11T16:02:00Z',
  },
  {
    mockId: 'q-006',
    slug: 'sql-window-functions-vs-self-join-performance',
    title: 'When does a self-join outperform a window function in Postgres 16?',
    excerpt: 'Counter-intuitively, our self-join beat ROW_NUMBER() by 4x on a 2B row table. What gives?',
    body: 'Counter-intuitively, our self-join beat ROW_NUMBER() by 4x on a 2B row table. Trying to understand the planner choices.',
    authorMockId: 'u4',
    upvoteCount: 88,
    downvoteCount: 0,
    views: 2941,
    status: 'verified',
    category: 'data',
    tags: ['postgres', 'sql', 'performance'],
    createdAt: '2026-02-06T08:44:00Z',
  },
];

const mockAnswers = {
  'q-001': [
    {
      mockId: 'a-1', authorMockId: 'u1', upvoteCount: 84, downvoteCount: 0, isAccepted: true, createdAt: '2026-02-04T11:30:00Z',
      body: "Use IAM Roles for Service Accounts (IRSA) with EKS. Stop minting long-lived keys for service accounts entirely. For workloads outside EKS, prefer AWS STS AssumeRole with short-lived credentials issued via SPIFFE or an OIDC trust to your CI. If you must keep keys, rotate via a two-key dance: provision key B, deploy new pods with key B, retire key A on a soak window.",
    },
    {
      mockId: 'a-2', authorMockId: 'u5', upvoteCount: 22, downvoteCount: 0, isAccepted: false, createdAt: '2026-02-04T13:14:00Z',
      body: "If your platform team is small, the simplest path is the two-key dance with an automated rotator (HashiCorp Vault or AWS Secrets Manager rotation lambdas). Just enforce a 24-hour overlap window and you'll never page anyone.",
    },
    {
      mockId: 'a-3', authorMockId: 'u4', upvoteCount: 11, downvoteCount: 0, isAccepted: false, createdAt: '2026-02-05T08:02:00Z',
      body: "Worth noting: if any of those service accounts are read by external SaaS vendors, you'll need a webhook to push the new key. We learned this the hard way after a Snowflake integration broke at 3am.",
    },
  ],
  'q-004': [
    {
      mockId: 'a-4', authorMockId: 'u2', upvoteCount: 30, downvoteCount: 0, isAccepted: true, createdAt: '2026-02-09T12:00:00Z',
      body: "We structure our design tokens in three tiers: 1. Global Tokens (raw values like color-blue-500), 2. Alias Tokens (semantic meanings like color-background-primary), and 3. Component Tokens (specific elements like button-primary-background). This makes them incredibly clean to update.",
    }
  ]
};

const mockNotifications = [
  { type: 'answer', actorMockId: 'u1', targetMockId: 'q-001', read: false, text: 'Mira Halverson answered your question on IAM key rotation.' },
  { type: 'mention', actorMockId: 'u2', targetMockId: 'q-004', read: false, text: 'Daniel Okafor mentioned you in a comment on a PRD question.' },
  { type: 'accepted', actorMockId: 'u3', targetMockId: 'q-004', read: false, text: 'Your answer was accepted on "What naming convention do you use for design tokens".' },
];

const mockReports = [
  { targetMockId: 'q-005', type: 'question', reason: 'Spam / promotional', reporterMockId: 'u2', status: 'pending' },
  { targetMockId: 'a-2', type: 'answer', reason: 'Misinformation', reporterMockId: 'u4', status: 'pending' },
];

async function seedDatabase() {
  try {
    await mongoose.connect(env.mongodbUri || "mongodb://localhost:27017/CrowdFAQ");
    console.log("Connected to MongoDB");

    // Clear existing data
    await Question.deleteMany({});
    await Answer.deleteMany({});
    await User.deleteMany({});
    await Notification.deleteMany({});
    await Report.deleteMany({});
    console.log("Cleared existing data");

    // 1. Seed Users
    const userMap = {};
    for (const u of mockUsers) {
      const createdUser = await User.create({
        displayName: u.displayName,
        email: u.email,
        password: "Password@123",
        role: u.role,
        reputationScore: u.reputationScore,
        handle: u.handle,
        title: u.title,
        avatar: u.avatar,
        badges: u.role === 'admin' ? ["verified", "founder"] : []
      });
      userMap[u.mockId] = createdUser;
      console.log(`Created user: ${createdUser.displayName} (${createdUser._id})`);
    }

    // 2. Seed Questions & Answers
    const questionMap = {};
    const answerMap = {};

    for (const q of mockQuestions) {
      const author = userMap[q.authorMockId];
      const createdQuestion = await Question.create({
        title: q.title,
        body: q.body,
        excerpt: q.excerpt,
        views: q.views,
        slug: q.slug,
        author: author._id,
        tags: q.tags,
        status: q.status,
        upvoteCount: q.upvoteCount,
        downvoteCount: q.downvoteCount,
        createdAt: new Date(q.createdAt)
      });
      questionMap[q.mockId] = createdQuestion;
      console.log(`Created question: ${createdQuestion.title}`);

      // Seed answers for this question
      const answersForQ = mockAnswers[q.mockId] || [];
      for (const ans of answersForQ) {
        const ansAuthor = userMap[ans.authorMockId];
        const createdAnswer = await Answer.create({
          question: createdQuestion._id,
          author: ansAuthor._id,
          body: ans.body,
          upvoteCount: ans.upvoteCount,
          downvoteCount: ans.downvoteCount,
          isAccepted: ans.isAccepted,
          createdAt: new Date(ans.createdAt)
        });
        answerMap[ans.mockId] = createdAnswer;

        if (ans.isAccepted) {
          createdQuestion.acceptedAnswerId = createdAnswer._id;
          await createdQuestion.save();
        }
        console.log(`- Created answer by ${ansAuthor.displayName}`);
      }
    }

    // 3. Seed Notifications
    for (const n of mockNotifications) {
      const actor = userMap[n.actorMockId];
      const target = questionMap[n.targetMockId];
      await Notification.create({
        type: n.type,
        actor: actor ? actor._id : null,
        target: target ? target._id : null,
        read: n.read,
        text: n.text
      });
    }
    console.log(`✅ Seeded ${mockNotifications.length} Notifications`);

    // 4. Seed Reports
    for (const r of mockReports) {
      const reporter = userMap[r.reporterMockId];
      const targetId = r.type === 'question' ? questionMap[r.targetMockId]._id : answerMap[r.targetMockId]._id;
      await Report.create({
        target: targetId,
        type: r.type,
        reason: r.reason,
        reporter: reporter._id,
        status: r.status
      });
    }
    console.log(`✅ Seeded ${mockReports.length} Reports`);

    console.log("✅ Database initialization complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
    process.exit(1);
  }
}

seedDatabase();
