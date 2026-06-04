// Seed data — mirrors MongoDB schemas. Loaded into localStorage by the store.
export type Role = "admin" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // plain for demo only
  role: Role;
  avatar?: string;
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  unitId: string;
  passingScore: number;
  questions: Question[];
}

export interface Unit {
  id: string;
  courseId: string;
  order: number;
  title: string;
  description: string;
  videoUrl: string;
  readingHtml: string;
  pdfUrl?: string;
  pdfHtml?: string;
  pdfCoverTemplate?: string;
  pdfTheme?: string;
  pdfWatermark?: { enabled: boolean; text: string; opacity: number; diagonal: boolean };
  pdfPageNumberStyle?: "minimal" | "pill" | "dots" | "roman" | "bar";
  duration: string;
  resources: { name: string; url: string }[];
  quiz: Quiz;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  price: number;
  thumbnail: string;
  introVideo: string;
  outcomes: string[];
  prerequisites: string[];
  duration: string;
  status: "draft" | "published";
  units: Unit[];
  createdBy: string;
  rating: number;
  studentsCount: number;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  purchaseStatus: "paid";
  currentUnitOrder: number;
  progressPercent: number;
  completedUnits: string[];
  unlockedUnits: string[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  courseId: string;
  unitId: string;
  score: number;
  passed: boolean;
  answers: number[];
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  courseId: string;
  unitId: string;
  htmlContent: string;
  audioUrl?: string;          // base64 data URL of recorded audio
  audioDurationSec?: number;  // recorded length in seconds
  updatedAt: string;
}

// ---------- Test Series ----------
export type RetakePolicy = "always" | "on_fail" | "never";

export interface TestSeries {
  id: string;
  title: string;
  description: string;
  category: string;
  durationMin: number;
  passingScore: number;
  questions: Question[];
  assignedUserIds: string[];
  status: "draft" | "published";
  createdBy: string;
  createdAt: string;
  // Retake controls
  maxAttempts: number; // 0 = unlimited
  retakePolicy: RetakePolicy; // when retakes are allowed
  cooldownHours: number; // wait time between attempts (0 = none)
}

export interface TestAttempt {
  id: string;
  testId: string;
  userId: string;
  answers: number[]; // index per question, -1 = skipped
  score: number;
  passed: boolean;
  startedAt: string;
  submittedAt: string;
}

// ---------- Study planner ----------
export interface StudyPlan {
  id: string;
  userId: string;
  courseId: string;
  examDate: string; // ISO date (YYYY-MM-DD treated as local)
  createdAt: string;
  updatedAt: string;
}

export type ScheduleStatus = "done" | "today" | "overdue" | "upcoming";

export interface ScheduleItem {
  unitId: string;
  unitTitle: string;
  unitOrder: number;
  scheduledDate: string; // ISO YYYY-MM-DD
  status: ScheduleStatus;
}

// ---------- Notification preferences ----------
export type NotificationKind = "today" | "overdue" | "completed";

export interface NotificationPrefs {
  userId: string;
  channels: Record<NotificationKind, boolean>;
  quietHours: { enabled: boolean; start: string; end: string }; // "HH:MM"
  updatedAt: string;
}

export const DEFAULT_NOTIFICATION_PREFS: Omit<NotificationPrefs, "userId" | "updatedAt"> = {
  channels: { today: true, overdue: true, completed: true },
  quietHours: { enabled: false, start: "22:00", end: "07:00" },
};

const sampleQuestions = (topic: string): Question[] => [
  {
    id: crypto.randomUUID(),
    text: `Which of the following best describes ${topic}?`,
    options: ["An advanced concept used in production systems", "A deprecated practice", "Only relevant to UI design", "An obsolete pattern"],
    correctOptionIndex: 0,
    explanation: `${topic} is widely used in modern production systems.`,
  },
  {
    id: crypto.randomUUID(),
    text: `What is a primary benefit of ${topic}?`,
    options: ["Increases bundle size", "Improves maintainability and clarity", "Slows down execution", "Requires more boilerplate"],
    correctOptionIndex: 1,
    explanation: "Better structure leads to easier maintenance.",
  },
  {
    id: crypto.randomUUID(),
    text: `Which tool is commonly associated with ${topic}?`,
    options: ["Notepad", "Industry-standard frameworks and libraries", "Spreadsheets", "Calculators"],
    correctOptionIndex: 1,
    explanation: "Modern frameworks support this practice well.",
  },
  {
    id: crypto.randomUUID(),
    text: `When should you apply ${topic}?`,
    options: ["Never", "Only in legacy systems", "When building scalable, maintainable software", "Only in academic settings"],
    correctOptionIndex: 2,
    explanation: "Apply it whenever scalability matters.",
  },
  {
    id: crypto.randomUUID(),
    text: `What is a common pitfall when working with ${topic}?`,
    options: ["Over-engineering simple cases", "Using too few keystrokes", "Writing documentation", "Adding tests"],
    correctOptionIndex: 0,
    explanation: "Always match complexity to the problem.",
  },
];

const makeUnits = (courseId: string, lessons: { title: string; description: string; reading: string; video?: string }[]): Unit[] =>
  lessons.map((l, idx) => {
    const unitId = `${courseId}-u${idx + 1}`;
    return {
      id: unitId,
      courseId,
      order: idx + 1,
      title: l.title,
      description: l.description,
      videoUrl: l.video || "https://www.w3schools.com/html/mov_bbb.mp4",
      readingHtml: l.reading,
      duration: `${10 + idx * 2} min`,
      resources: [
        { name: "Cheat Sheet PDF", url: "#" },
        { name: "Reference Guide", url: "#" },
      ],
      quiz: {
        id: `${unitId}-quiz`,
        unitId,
        passingScore: 60,
        questions: sampleQuestions(l.title),
      },
    };
  });

export const SEED_USERS: User[] = [
  { id: "u-admin", name: "Alex Admin", email: "admin@learn.com", password: "admin123", role: "admin", createdAt: new Date().toISOString() },
  { id: "u-student", name: "Sam Student", email: "student@learn.com", password: "student123", role: "student", createdAt: new Date().toISOString() },
];

export const SEED_COURSES: Course[] = [
  {
    id: "c-react",
    title: "Mastering Modern React",
    slug: "mastering-modern-react",
    description: "Build production-grade React apps with hooks, context, performance patterns, and modern tooling.",
    category: "Web Development",
    difficulty: "Intermediate",
    price: 49,
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
    introVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    outcomes: ["Build complex SPAs", "Master hooks and context", "Optimize performance", "Ship production apps"],
    prerequisites: ["Basic JavaScript", "HTML & CSS"],
    duration: "8 hours",
    status: "published",
    createdBy: "u-admin",
    rating: 4.8,
    studentsCount: 1240,
    createdAt: new Date().toISOString(),
    units: makeUnits("c-react", [
      { title: "React Foundations", description: "Components, props, and JSX fundamentals.", reading: "<h2>Welcome to React</h2><p>React is a library for building UIs out of components. In this unit we'll cover the mental model behind components, props, and rendering.</p><h3>Key concepts</h3><ul><li>Declarative UI</li><li>Component composition</li><li>One-way data flow</li></ul><blockquote>Think in components — small, reusable, single-purpose.</blockquote>" },
      { title: "Hooks in Depth", description: "useState, useEffect, useMemo, and custom hooks.", reading: "<h2>Hooks</h2><p>Hooks let you use state and lifecycle features in function components. Master the dependency array to avoid bugs.</p>" },
      { title: "State Management Patterns", description: "Context API, lifting state, and reducer patterns.", reading: "<h2>State Patterns</h2><p>Choose the right tool: local state, lifted state, context, or external stores.</p>" },
      { title: "Performance & Optimization", description: "Memoization, code splitting, and profiling.", reading: "<h2>Performance</h2><p>Profile first, optimize second. Use React DevTools to find bottlenecks.</p>" },
      { title: "Production Deployment", description: "Build, deploy, and monitor your React app.", reading: "<h2>Going Live</h2><p>Ship with confidence: builds, monitoring, error tracking, and analytics.</p>" },
    ]),
  },
  {
    id: "c-node",
    title: "Node.js & Express API Mastery",
    slug: "nodejs-express-api",
    description: "Design, build, and deploy scalable REST APIs with Node, Express, and MongoDB.",
    category: "Backend",
    difficulty: "Intermediate",
    price: 59,
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    introVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    outcomes: ["Design REST APIs", "Use MongoDB effectively", "Implement auth", "Deploy at scale"],
    prerequisites: ["JavaScript basics"],
    duration: "10 hours",
    status: "published",
    createdBy: "u-admin",
    rating: 4.7,
    studentsCount: 980,
    createdAt: new Date().toISOString(),
    units: makeUnits("c-node", [
      { title: "Node.js Runtime Essentials", description: "Event loop, modules, async patterns.", reading: "<h2>Node Runtime</h2><p>Understand the event loop and how Node handles I/O.</p>" },
      { title: "Express Routing & Middleware", description: "Build clean, modular Express apps.", reading: "<h2>Express</h2><p>Routing and middleware are the building blocks of an Express app.</p>" },
      { title: "MongoDB with Mongoose", description: "Schemas, models, queries, and indexes.", reading: "<h2>MongoDB</h2><p>Design schemas that match your access patterns.</p>" },
      { title: "Authentication & JWT", description: "Secure your API with JWT and bcrypt.", reading: "<h2>Auth</h2><p>Hash passwords, sign tokens, verify on every request.</p>" },
    ]),
  },
  {
    id: "c-design",
    title: "UI/UX Design for Developers",
    slug: "ui-ux-for-devs",
    description: "Learn design principles, color theory, typography, and layout to ship beautiful products.",
    category: "Design",
    difficulty: "Beginner",
    price: 39,
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=800&q=80",
    introVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    outcomes: ["Spot good design", "Build design systems", "Use typography well", "Pick perfect colors"],
    prerequisites: ["None"],
    duration: "5 hours",
    status: "published",
    createdBy: "u-admin",
    rating: 4.9,
    studentsCount: 2100,
    createdAt: new Date().toISOString(),
    units: makeUnits("c-design", [
      { title: "Design Principles", description: "Hierarchy, contrast, alignment, repetition.", reading: "<h2>Principles</h2><p>Great design follows timeless principles.</p>" },
      { title: "Color & Typography", description: "Build harmonious palettes and type scales.", reading: "<h2>Color & Type</h2><p>Color tells a story; type sets the tone.</p>" },
      { title: "Layout & Spacing", description: "Grids, rhythm, and the 8pt system.", reading: "<h2>Layout</h2><p>Rhythm comes from consistent spacing.</p>" },
    ]),
  },
];
