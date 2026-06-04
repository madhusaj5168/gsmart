// Mock backend — localStorage acts as our MongoDB. Easy to swap for a real Express API later.
import { DEFAULT_NOTIFICATION_PREFS, SEED_COURSES, SEED_USERS, type Course, type Enrollment, type Note, type NotificationKind, type NotificationPrefs as NotificationPrefsType, type Quiz, type QuizAttempt, type ScheduleItem, type ScheduleStatus, type StudyPlan, type TestAttempt, type TestSeries, type Unit, type User } from "./seed";

const K = {
  users: "lms.users",
  courses: "lms.courses",
  enrollments: "lms.enrollments",
  attempts: "lms.attempts",
  notes: "lms.notes",
  session: "lms.session",
  tests: "lms.tests",
  testAttempts: "lms.testAttempts",
  studyPlans: "lms.studyPlans",
  notifPrefs: "lms.notifPrefs",
};

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function initStore() {
  if (!localStorage.getItem(K.users)) write(K.users, SEED_USERS);
  if (!localStorage.getItem(K.courses)) write(K.courses, SEED_COURSES);
  if (!localStorage.getItem(K.enrollments)) write(K.enrollments, []);
  if (!localStorage.getItem(K.attempts)) write(K.attempts, []);
  if (!localStorage.getItem(K.notes)) write(K.notes, []);
  if (!localStorage.getItem(K.tests)) write(K.tests, []);
  if (!localStorage.getItem(K.testAttempts)) write(K.testAttempts, []);
  if (!localStorage.getItem(K.studyPlans)) write(K.studyPlans, []);
}

// ---------- Users / Auth ----------
export const Users = {
  all: () => read<User[]>(K.users, []),
  byEmail: (email: string) => Users.all().find((u) => u.email.toLowerCase() === email.toLowerCase()),
  byId: (id: string) => Users.all().find((u) => u.id === id),
  create: (u: Omit<User, "id" | "createdAt">) => {
    const users = Users.all();
    if (users.find((x) => x.email.toLowerCase() === u.email.toLowerCase())) throw new Error("Email already in use");
    const user: User = { ...u, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    write(K.users, [...users, user]);
    return user;
  },
};

export const Session = {
  current: (): User | null => {
    const id = read<string | null>(K.session, null);
    return id ? Users.byId(id) || null : null;
  },
  login: (email: string, password: string): User => {
    const u = Users.byEmail(email);
    if (!u || u.password !== password) throw new Error("Invalid email or password");
    write(K.session, u.id);
    return u;
  },
  logout: () => localStorage.removeItem(K.session),
};

// ---------- Courses ----------
export const Courses = {
  all: () => read<Course[]>(K.courses, []),
  published: () => Courses.all().filter((c) => c.status === "published"),
  byId: (id: string) => Courses.all().find((c) => c.id === id),
  save: (course: Course) => {
    const list = Courses.all();
    const idx = list.findIndex((c) => c.id === course.id);
    if (idx >= 0) list[idx] = course;
    else list.push(course);
    write(K.courses, list);
  },
  delete: (id: string) => write(K.courses, Courses.all().filter((c) => c.id !== id)),
  addUnit: (courseId: string, unit: Omit<Unit, "id" | "courseId" | "order" | "quiz"> & { quiz?: Quiz }) => {
    const course = Courses.byId(courseId);
    if (!course) return;
    const order = course.units.length + 1;
    const unitId = `${courseId}-u${order}-${Date.now()}`;
    const newUnit: Unit = {
      ...unit,
      id: unitId,
      courseId,
      order,
      quiz: unit.quiz || {
        id: `${unitId}-quiz`,
        unitId,
        passingScore: 60,
        questions: [],
      },
    };
    course.units.push(newUnit);
    Courses.save(course);
    return newUnit;
  },
};

// ---------- Enrollments ----------
export const Enrollments = {
  all: () => read<Enrollment[]>(K.enrollments, []),
  forUser: (userId: string) => Enrollments.all().filter((e) => e.userId === userId),
  find: (userId: string, courseId: string) => Enrollments.all().find((e) => e.userId === userId && e.courseId === courseId),
  enroll: (userId: string, courseId: string): Enrollment => {
    const existing = Enrollments.find(userId, courseId);
    if (existing) return existing;
    const course = Courses.byId(courseId);
    if (!course) throw new Error("Course not found");
    const first = course.units[0];
    const e: Enrollment = {
      id: crypto.randomUUID(),
      userId,
      courseId,
      purchaseStatus: "paid",
      currentUnitOrder: 1,
      progressPercent: 0,
      completedUnits: [],
      unlockedUnits: first ? [first.id] : [],
      createdAt: new Date().toISOString(),
    };
    write(K.enrollments, [...Enrollments.all(), e]);
    return e;
  },
  update: (e: Enrollment) => {
    const list = Enrollments.all().map((x) => (x.id === e.id ? e : x));
    write(K.enrollments, list);
  },
  passUnit: (userId: string, courseId: string, unitId: string) => {
    const e = Enrollments.find(userId, courseId);
    const course = Courses.byId(courseId);
    if (!e || !course) return;
    const wasCompleted = e.completedUnits.includes(unitId);
    if (!wasCompleted) e.completedUnits.push(unitId);
    let nextUnit: Unit | undefined;
    const unit = course.units.find((u) => u.id === unitId);
    if (unit) {
      nextUnit = course.units.find((u) => u.order === unit.order + 1);
      if (nextUnit && !e.unlockedUnits.includes(nextUnit.id)) {
        e.unlockedUnits.push(nextUnit.id);
        e.currentUnitOrder = nextUnit.order;
      }
    }
    e.progressPercent = Math.round((e.completedUnits.length / course.units.length) * 100);
    Enrollments.update(e);
    if (!wasCompleted && unit) {
      Notifier.emit({
        userId,
        kind: "completed",
        title: `Unit ${unit.order} completed`,
        body: nextUnit
          ? `Next up: Unit ${nextUnit.order}. ${nextUnit.title}`
          : `You've finished ${course.title}!`,
        courseId,
        unitId: nextUnit?.id,
      });
    }
    return e;
  },
};

// ---------- Quiz Attempts ----------
export const Attempts = {
  all: () => read<QuizAttempt[]>(K.attempts, []),
  forUserUnit: (userId: string, unitId: string) => Attempts.all().filter((a) => a.userId === userId && a.unitId === unitId),
  record: (a: Omit<QuizAttempt, "id" | "createdAt">): QuizAttempt => {
    const attempt: QuizAttempt = { ...a, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    write(K.attempts, [...Attempts.all(), attempt]);
    return attempt;
  },
};

// ---------- Notes ----------
export const Notes = {
  all: () => read<Note[]>(K.notes, []),
  find: (userId: string, courseId: string, unitId: string) =>
    Notes.all().find((n) => n.userId === userId && n.courseId === courseId && n.unitId === unitId),
  save: (n: Omit<Note, "id" | "updatedAt"> & { id?: string }) => {
    const list = Notes.all();
    const existing = Notes.find(n.userId, n.courseId, n.unitId);
    const note: Note = {
      id: existing?.id || n.id || crypto.randomUUID(),
      userId: n.userId,
      courseId: n.courseId,
      unitId: n.unitId,
      htmlContent: n.htmlContent,
      audioUrl: n.audioUrl ?? existing?.audioUrl,
      audioDurationSec: n.audioDurationSec ?? existing?.audioDurationSec,
      updatedAt: new Date().toISOString(),
    };
    const without = list.filter((x) => x.id !== note.id);
    write(K.notes, [...without, note]);
    return note;
  },
};

// ---------- Analytics ----------
export const Analytics = {
  totals: () => {
    const enrollments = Enrollments.all();
    const courses = Courses.all();
    const users = Users.all().filter((u) => u.role === "student");
    const revenue = enrollments.reduce((sum, e) => sum + (Courses.byId(e.courseId)?.price || 0), 0);
    const completed = enrollments.filter((e) => e.progressPercent === 100).length;
    const attempts = Attempts.all();
    const passed = attempts.filter((a) => a.passed).length;
    return {
      students: users.length,
      courses: courses.length,
      enrollments: enrollments.length,
      revenue,
      completionRate: enrollments.length ? Math.round((completed / enrollments.length) * 100) : 0,
      quizPassRate: attempts.length ? Math.round((passed / attempts.length) * 100) : 0,
      attempts: attempts.length,
    };
  },
};

// ---------- Test Series ----------
export const Tests = {
  all: () => read<TestSeries[]>(K.tests, []),
  byId: (id: string) => Tests.all().find((t) => t.id === id),
  forUser: (userId: string) =>
    Tests.all().filter((t) => t.status === "published" && t.assignedUserIds.includes(userId)),
  save: (test: TestSeries) => {
    const list = Tests.all();
    const idx = list.findIndex((t) => t.id === test.id);
    if (idx >= 0) list[idx] = test;
    else list.push(test);
    write(K.tests, list);
    return test;
  },
  create: (input: Omit<TestSeries, "id" | "createdAt">): TestSeries => {
    const t: TestSeries = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    write(K.tests, [...Tests.all(), t]);
    return t;
  },
  delete: (id: string) => write(K.tests, Tests.all().filter((t) => t.id !== id)),
  assign: (testId: string, userIds: string[]) => {
    const t = Tests.byId(testId);
    if (!t) return;
    t.assignedUserIds = Array.from(new Set(userIds));
    Tests.save(t);
  },
};

export class RetakeViolationError extends Error {
  code: string;
  status: RetakeStatus;
  constructor(status: RetakeStatus, code = "retake_blocked") {
    super(status.reason || "Submission rejected by retake policy");
    this.name = "RetakeViolationError";
    this.code = code;
    this.status = status;
  }
}

export const TestAttempts = {
  all: () => read<TestAttempt[]>(K.testAttempts, []),
  forTest: (testId: string) => TestAttempts.all().filter((a) => a.testId === testId),
  forUser: (userId: string) => TestAttempts.all().filter((a) => a.userId === userId),
  forUserTest: (userId: string, testId: string) =>
    TestAttempts.all().filter((a) => a.userId === userId && a.testId === testId),
  byId: (id: string) => TestAttempts.all().find((a) => a.id === id),
  /**
   * Server-side style submission. Re-validates the test exists, the user is
   * assigned, attempt limits, retake policy, and cooldown BEFORE persisting.
   * The UI can short-circuit for UX, but this is the source of truth.
   */
  record: (a: Omit<TestAttempt, "id" | "score" | "passed">): TestAttempt => {
    const test = Tests.byId(a.testId);
    if (!test) throw new RetakeViolationError(
      { canTake: false, reason: "Test not found", attemptsUsed: 0, attemptsRemaining: 0 },
      "test_not_found",
    );
    if (test.status !== "published" || !test.assignedUserIds.includes(a.userId)) {
      throw new RetakeViolationError(
        { canTake: false, reason: "Test is not assigned to this user.", attemptsUsed: 0, attemptsRemaining: 0 },
        "not_assigned",
      );
    }
    const status = getRetakeStatus(a.userId, a.testId);
    if (!status.canTake) throw new RetakeViolationError(status);

    // Re-score on the "server" so a tampered client score cannot be trusted.
    const answers = Array.isArray(a.answers) ? a.answers : [];
    const correct = test.questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correctOptionIndex ? 1 : 0),
      0,
    );
    const score = test.questions.length ? Math.round((correct / test.questions.length) * 100) : 0;
    const passed = score >= test.passingScore;

    const attempt: TestAttempt = {
      ...a,
      answers,
      score,
      passed,
      id: crypto.randomUUID(),
    };
    write(K.testAttempts, [...TestAttempts.all(), attempt]);
    return attempt;
  },
};

// ---------- Retake eligibility ----------
export type RetakeStatus = {
  canTake: boolean;
  reason?: string;
  attemptsUsed: number;
  attemptsRemaining: number | null; // null = unlimited
  nextAttemptAt?: string; // ISO when cooldown elapses
};

export function getRetakeStatus(userId: string, testId: string): RetakeStatus {
  const test = Tests.byId(testId);
  if (!test) return { canTake: false, reason: "Test not found", attemptsUsed: 0, attemptsRemaining: 0 };
  const attempts = TestAttempts.forUserTest(userId, testId).sort((a, b) =>
    a.submittedAt < b.submittedAt ? -1 : 1
  );
  const used = attempts.length;
  const last = attempts[attempts.length - 1];
  const max = test.maxAttempts ?? 0;
  const remaining = max > 0 ? Math.max(0, max - used) : null;

  if (last?.passed && test.retakePolicy !== "always") {
    return { canTake: false, reason: "You've already passed this test.", attemptsUsed: used, attemptsRemaining: remaining };
  }
  if (used > 0 && test.retakePolicy === "never") {
    return { canTake: false, reason: "Retakes are not allowed for this test.", attemptsUsed: used, attemptsRemaining: remaining };
  }
  if (max > 0 && used >= max) {
    return { canTake: false, reason: `Attempt limit reached (${max}).`, attemptsUsed: used, attemptsRemaining: 0 };
  }
  if (last && test.cooldownHours > 0) {
    const nextMs = new Date(last.submittedAt).getTime() + test.cooldownHours * 3600_000;
    if (Date.now() < nextMs) {
      return {
        canTake: false,
        reason: `Cooldown active. Try again after ${new Date(nextMs).toLocaleString()}.`,
        attemptsUsed: used,
        attemptsRemaining: remaining,
        nextAttemptAt: new Date(nextMs).toISOString(),
      };
    }
  }
  return { canTake: true, attemptsUsed: used, attemptsRemaining: remaining };
}

// ---------- Study Plans ----------
function toDateKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(a: Date, b: Date): number {
  const ms = new Date(toDateKey(b)).getTime() - new Date(toDateKey(a)).getTime();
  return Math.round(ms / 86_400_000);
}

export const StudyPlans = {
  all: () => read<StudyPlan[]>(K.studyPlans, []),
  forUser: (userId: string) => StudyPlans.all().filter((p) => p.userId === userId),
  find: (userId: string, courseId: string) =>
    StudyPlans.all().find((p) => p.userId === userId && p.courseId === courseId),
  upsert: (userId: string, courseId: string, examDate: string): StudyPlan => {
    const list = StudyPlans.all();
    const existing = list.find((p) => p.userId === userId && p.courseId === courseId);
    const now = new Date().toISOString();
    let plan: StudyPlan;
    if (existing) {
      existing.examDate = examDate;
      existing.updatedAt = now;
      write(K.studyPlans, list);
      plan = existing;
    } else {
      plan = {
        id: crypto.randomUUID(),
        userId,
        courseId,
        examDate,
        createdAt: now,
        updatedAt: now,
      };
      write(K.studyPlans, [...list, plan]);
    }
    // Emit a "next due" reminder based on the freshly recomputed schedule.
    const sched = StudyPlans.schedule(userId, courseId);
    const due = sched.find((s) => s.status === "today" || s.status === "overdue")
      || sched.find((s) => s.status === "upcoming");
    const course = Courses.byId(courseId);
    if (due && course) {
      const kind: NotificationKind = due.status === "overdue" ? "overdue" : "today";
      Notifier.emit({
        userId,
        kind,
        title: existing ? "Exam date updated" : "Study plan created",
        body: `Next up: Unit ${due.unitOrder}. ${due.unitTitle} — ${course.title}`,
        courseId,
        unitId: due.unitId,
      });
    }
    return plan;
  },
  remove: (userId: string, courseId: string) => {
    write(
      K.studyPlans,
      StudyPlans.all().filter((p) => !(p.userId === userId && p.courseId === courseId)),
    );
  },

  /**
   * Build a day-by-day schedule that distributes remaining (incomplete) units
   * evenly across the days from today up to the exam date.
   * Completed units are scheduled "done" on today's bucket and excluded from
   * future distribution.
   */
  schedule: (userId: string, courseId: string): ScheduleItem[] => {
    const plan = StudyPlans.find(userId, courseId);
    const course = Courses.byId(courseId);
    const enrollment = Enrollments.find(userId, courseId);
    if (!plan || !course || !enrollment) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(plan.examDate);
    exam.setHours(0, 0, 0, 0);

    const completed = new Set(enrollment.completedUnits);
    const sorted = [...course.units].sort((a, b) => a.order - b.order);
    const remaining = sorted.filter((u) => !completed.has(u.id));
    const daysLeft = Math.max(1, daysBetween(today, exam) + 1); // inclusive of today
    const perDay = Math.max(1, Math.ceil(remaining.length / daysLeft));

    const items: ScheduleItem[] = [];

    // Already completed units → tagged done, dated on plan creation day
    sorted
      .filter((u) => completed.has(u.id))
      .forEach((u) =>
        items.push({
          unitId: u.id,
          unitTitle: u.title,
          unitOrder: u.order,
          scheduledDate: toDateKey(plan.createdAt),
          status: "done",
        }),
      );

    // Distribute remaining
    remaining.forEach((u, i) => {
      const dayOffset = Math.min(daysLeft - 1, Math.floor(i / perDay));
      const d = new Date(today);
      d.setDate(d.getDate() + dayOffset);
      const key = toDateKey(d);
      const todayKey = toDateKey(today);
      let status: ScheduleStatus;
      if (key < todayKey) status = "overdue";
      else if (key === todayKey) status = "today";
      else status = "upcoming";
      items.push({
        unitId: u.id,
        unitTitle: u.title,
        unitOrder: u.order,
        scheduledDate: key,
        status,
      });
    });

    return items.sort((a, b) => a.unitOrder - b.unitOrder);
  },

  /**
   * Aggregated notifications across all of a user's active study plans.
   * Returns units that are overdue or due today (and not yet completed).
   */
  notifications: (userId: string) => {
    const plans = StudyPlans.forUser(userId);
    const out: Array<{
      courseId: string;
      courseTitle: string;
      examDate: string;
      item: ScheduleItem;
    }> = [];
    plans.forEach((p) => {
      const course = Courses.byId(p.courseId);
      if (!course) return;
      const sched = StudyPlans.schedule(userId, p.courseId);
      const prefs = NotificationPrefs.get(userId);
      sched
        .filter((s) => {
          if (s.status === "today") return prefs.channels.today;
          if (s.status === "overdue") return prefs.channels.overdue;
          return false;
        })
        .forEach((item) =>
          out.push({ courseId: p.courseId, courseTitle: course.title, examDate: p.examDate, item }),
        );
    });
    return out;
  },
};

// ---------- Notification preferences ----------
export const NotificationPrefs = {
  get: (userId: string): NotificationPrefsType => {
    const all = read<Record<string, NotificationPrefsType>>(K.notifPrefs, {});
    const existing = all[userId];
    if (existing) return existing;
    return {
      userId,
      ...DEFAULT_NOTIFICATION_PREFS,
      updatedAt: new Date().toISOString(),
    };
  },
  set: (userId: string, patch: Partial<Omit<NotificationPrefsType, "userId" | "updatedAt">>) => {
    const all = read<Record<string, NotificationPrefsType>>(K.notifPrefs, {});
    const current = NotificationPrefs.get(userId);
    const next: NotificationPrefsType = {
      ...current,
      ...patch,
      channels: { ...current.channels, ...(patch.channels || {}) },
      quietHours: { ...current.quietHours, ...(patch.quietHours || {}) },
      updatedAt: new Date().toISOString(),
    };
    all[userId] = next;
    write(K.notifPrefs, all);
    return next;
  },
};

export function isInQuietHours(prefs: NotificationPrefsType, now: Date = new Date()): boolean {
  if (!prefs.quietHours.enabled) return false;
  const toMin = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = toMin(prefs.quietHours.start);
  const end = toMin(prefs.quietHours.end);
  if (start === end) return false;
  // Wrap window (e.g. 22:00 → 07:00)
  if (start > end) return cur >= start || cur < end;
  return cur >= start && cur < end;
}

// ---------- Realtime notifier (in-memory pub/sub) ----------
export interface NotifierEvent {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  courseId?: string;
  unitId?: string;
}
type NotifierHandler = (e: NotifierEvent) => void;
const notifierSubs = new Set<NotifierHandler>();

export const Notifier = {
  emit: (e: NotifierEvent) => {
    notifierSubs.forEach((fn) => {
      try { fn(e); } catch { /* ignore */ }
    });
  },
  subscribe: (fn: NotifierHandler) => {
    notifierSubs.add(fn);
    return () => notifierSubs.delete(fn);
  },
};



