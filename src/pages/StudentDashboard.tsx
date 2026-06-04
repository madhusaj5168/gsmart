import Navbar from "@/components/Navbar";
import LibrarySection from "@/components/LibrarySection";
import StudyPlanDialog from "@/components/StudyPlanDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Attempts, Courses, Enrollments, Notes, NotificationPrefs, StudyPlans, isInQuietHours } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Award,
  TrendingUp,
  ArrowRight,
  Play,
  Clock,
  Flame,
  StickyNote,
  CheckCircle2,
  Target,
  Trophy,
  Sparkles,
  Lock,
  GraduationCap,
  CalendarDays,
  AlertCircle,
  BellRing,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function StudentDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const [planVersion, setPlanVersion] = useState(0);

  const allCourses = Courses.published();
  const enrollments = Enrollments.forUser(user.id);
  const attempts = Attempts.all().filter((a) => a.userId === user.id);
  const notes = Notes.all().filter((n) => n.userId === user.id);

  const myCourses = useMemo(
    () =>
      enrollments
        .map((e) => ({ enrollment: e, course: Courses.byId(e.courseId)! }))
        .filter((x) => x.course),
    [enrollments]
  );

  const notifications = useMemo(() => {
    void planVersion;
    return StudyPlans.notifications(user.id);
  }, [user.id, planVersion, enrollments.length]);

  const plansByCourse = useMemo(() => {
    void planVersion;
    const map = new Map<string, ReturnType<typeof StudyPlans.find>>();
    enrollments.forEach((e) => map.set(e.courseId, StudyPlans.find(user.id, e.courseId)));
    return map;
  }, [user.id, enrollments, planVersion]);

  // One-shot toast nudge when due/overdue items exist
  useEffect(() => {
    if (notifications.length === 0) return;
    const prefs = NotificationPrefs.get(user.id);
    if (isInQuietHours(prefs)) return;
    const overdue = prefs.channels.overdue
      ? notifications.filter((n) => n.item.status === "overdue").length
      : 0;
    const today = prefs.channels.today
      ? notifications.filter((n) => n.item.status === "today").length
      : 0;
    if (overdue === 0 && today === 0) return;
    const key = `lms.studynudge.${user.id}.${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    if (overdue > 0)
      toast.warning(`${overdue} study task${overdue > 1 ? "s" : ""} overdue`, {
        description: "Catch up to stay on schedule for your exam.",
      });
    else if (today > 0)
      toast(`${today} unit${today > 1 ? "s" : ""} scheduled for today`, {
        description: "Open the course to keep your prep on track.",
      });
  }, [notifications, user.id]);

  const completed = enrollments.filter((e) => e.progressPercent === 100).length;
  const inProgress = enrollments.length - completed;
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + e.progressPercent, 0) / enrollments.length)
    : 0;
  const passed = attempts.filter((a) => a.passed).length;
  const passRate = attempts.length ? Math.round((passed / attempts.length) * 100) : 0;

  // Study streak — distinct days from attempts + notes
  const streak = useMemo(() => {
    const days = new Set<string>();
    [...attempts.map((a) => a.createdAt), ...notes.map((n) => n.updatedAt)].forEach((d) => {
      days.add(new Date(d).toDateString());
    });
    // Count consecutive days back from today
    let count = 0;
    const cursor = new Date();
    while (days.has(cursor.toDateString())) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [attempts, notes]);

  // "Continue learning" hero — most recently active in-progress course
  const continueCourse = useMemo(() => {
    const active = myCourses.filter((c) => c.enrollment.progressPercent < 100);
    if (active.length === 0) return null;
    return active.sort((a, b) => (b.enrollment.createdAt > a.enrollment.createdAt ? 1 : -1))[0];
  }, [myCourses]);

  const nextUnit = continueCourse
    ? continueCourse.course.units.find((u) => u.order === continueCourse.enrollment.currentUnitOrder)
    : null;

  // Recent quiz attempts (latest 5)
  const recentAttempts = useMemo(
    () =>
      [...attempts]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 5)
        .map((a) => {
          const course = Courses.byId(a.courseId);
          const unit = course?.units.find((u) => u.id === a.unitId);
          return { attempt: a, course, unit };
        })
        .filter((x) => x.course && x.unit),
    [attempts]
  );

  // Recommended — published courses the student hasn't enrolled in
  const recommended = useMemo(() => {
    const enrolledIds = new Set(enrollments.map((e) => e.courseId));
    return allCourses.filter((c) => !enrolledIds.has(c.id)).slice(0, 3);
  }, [allCourses, enrollments]);

  // Achievements
  const achievements = [
    {
      icon: GraduationCap,
      label: "First steps",
      unlocked: enrollments.length >= 1,
      hint: "Enroll in your first course",
    },
    {
      icon: Target,
      label: "Quiz crusher",
      unlocked: passed >= 3,
      hint: "Pass 3 quizzes",
    },
    {
      icon: StickyNote,
      label: "Notetaker",
      unlocked: notes.length >= 1,
      hint: "Save your first note",
    },
    {
      icon: Flame,
      label: "On fire",
      unlocked: streak >= 3,
      hint: "3-day study streak",
    },
    {
      icon: Trophy,
      label: "Course champion",
      unlocked: completed >= 1,
      hint: "Complete a full course",
    },
    {
      icon: Sparkles,
      label: "Polymath",
      unlocked: enrollments.length >= 3,
      hint: "Enroll in 3 courses",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <div className="container py-8 md:py-10 space-y-8">
        {/* Greeting */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1">
              Welcome back, {user.name.split(" ")[0]} <span className="inline-block">👋</span>
            </h1>
            <p className="text-muted-foreground">
              {continueCourse
                ? "You're making great progress. Let's keep the momentum going."
                : "Browse the marketplace to start your learning journey."}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/courses">
              <BookOpen className="h-4 w-4 mr-1.5" /> Browse marketplace
            </Link>
          </Button>
        </div>

        {/* Study schedule notifications */}
        {notifications.length > 0 && (
          <Card className="p-5 border-warning/40 bg-warning/5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-warning/15 text-warning">
                <BellRing className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold leading-tight">
                  {notifications.some((n) => n.item.status === "overdue")
                    ? "You're behind on your exam prep"
                    : "Today's study plan"}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Stay on track to hit your exam date{notifications.length > 1 ? "s" : ""}.
                </p>
                <ul className="space-y-1.5">
                  {notifications.slice(0, 4).map(({ courseId, courseTitle, examDate, item }) => (
                    <li
                      key={`${courseId}-${item.unitId}`}
                      className="flex items-center gap-2 text-sm flex-wrap"
                    >
                      {item.status === "overdue" ? (
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-warning shrink-0" />
                      )}
                      <Link
                        to={`/learn/${courseId}?unit=${item.unitId}`}
                        className="font-medium hover:underline truncate"
                      >
                        Unit {item.unitOrder}. {item.unitTitle}
                      </Link>
                      <span className="text-xs text-muted-foreground truncate">
                        · {courseTitle} · exam {format(new Date(examDate), "MMM d")}
                      </span>
                      <Badge
                        className={
                          item.status === "overdue"
                            ? "ml-auto bg-destructive/15 text-destructive border-destructive/30"
                            : "ml-auto bg-warning/15 text-warning border-warning/30"
                        }
                      >
                        {item.status === "overdue" ? "Overdue" : "Today"}
                      </Badge>
                    </li>
                  ))}
                </ul>
                {notifications.length > 4 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    +{notifications.length - 4} more task{notifications.length - 4 > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Continue learning hero */}
        {continueCourse && nextUnit && (
          <Card className="overflow-hidden border-border/60 shadow-elegant bg-gradient-card">
            <div className="grid md:grid-cols-[1.1fr_1fr] gap-0">
              <div className="relative aspect-video md:aspect-auto md:min-h-[280px] overflow-hidden">
                <img
                  src={continueCourse.course.thumbnail}
                  alt={continueCourse.course.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-background/20 to-transparent md:bg-gradient-to-r" />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary/90 text-primary-foreground border-0 backdrop-blur">
                    Continue learning
                  </Badge>
                </div>
              </div>
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  {continueCourse.course.category}
                </div>
                <h2 className="text-2xl font-bold mb-1 leading-tight">{continueCourse.course.title}</h2>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {continueCourse.course.description}
                </p>

                <div className="rounded-lg border border-border/60 bg-background/60 p-4 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Play className="h-3.5 w-3.5 text-primary" />
                    Up next · Unit {nextUnit.order}
                  </div>
                  <div className="font-semibold leading-tight">{nextUnit.title}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {nextUnit.duration}
                    </span>
                    <span>
                      {continueCourse.enrollment.completedUnits.length} / {continueCourse.course.units.length} units done
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Course progress</span>
                    <span className="font-medium">{continueCourse.enrollment.progressPercent}%</span>
                  </div>
                  <Progress value={continueCourse.enrollment.progressPercent} className="h-2" />
                </div>

                <div className="flex gap-2">
                  <Button asChild className="bg-gradient-primary hover:opacity-90 shadow-glow">
                    <Link to={`/learn/${continueCourse.course.id}`}>
                      Resume <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to={`/course/${continueCourse.course.id}`}>Course details</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon: BookOpen, label: "Enrolled", value: enrollments.length, tint: "from-primary to-primary-glow" },
            { icon: Play, label: "In progress", value: inProgress, tint: "from-accent to-accent" },
            { icon: Award, label: "Completed", value: completed, tint: "from-success to-success" },
            { icon: TrendingUp, label: "Avg progress", value: `${avgProgress}%`, tint: "from-warning to-warning" },
            { icon: Target, label: "Quiz pass rate", value: `${passRate}%`, tint: "from-primary to-accent" },
            { icon: Flame, label: "Day streak", value: streak, tint: "from-warning to-destructive" },
          ].map((s) => (
            <Card key={s.label} className="p-4 bg-gradient-card border-border/60 shadow-card">
              <div
                className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${s.tint} text-white shadow-sm mb-3`}
              >
                <s.icon className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold leading-none">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* My Learning + side column */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* My Learning grid */}
          <section>
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">My learning</h2>
                <p className="text-sm text-muted-foreground">All courses you've enrolled in</p>
              </div>
              {myCourses.length > 0 && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/courses">
                    Explore more <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>

            {myCourses.length === 0 ? (
              <Card className="p-12 text-center bg-gradient-card border-dashed border-border/60">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No courses yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse the marketplace to start learning today.
                </p>
                <Button asChild className="bg-gradient-primary hover:opacity-90">
                  <Link to="/courses">Explore courses</Link>
                </Button>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                {myCourses.map(({ course, enrollment }) => {
                  const isDone = enrollment.progressPercent === 100;
                  const current = course.units.find((u) => u.order === enrollment.currentUnitOrder);
                  return (
                    <Card
                      key={course.id}
                      className="overflow-hidden bg-gradient-card border-border/60 shadow-card hover:shadow-elegant transition-smooth hover:-translate-y-0.5 flex flex-col"
                    >
                      <div className="aspect-video bg-muted overflow-hidden relative">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="h-full w-full object-cover"
                        />
                        {isDone && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-success text-success-foreground border-0 gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Completed
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                          {course.category}
                        </div>
                        <h3 className="font-semibold mb-3 line-clamp-1">{course.title}</h3>

                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{enrollment.progressPercent}%</span>
                          </div>
                          <Progress value={enrollment.progressPercent} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <span>
                            {enrollment.completedUnits.length} / {course.units.length} units
                          </span>
                          {!isDone && current && (
                            <span className="truncate ml-2">Next: {current.title}</span>
                          )}
                        </div>

                        {(() => {
                          const plan = plansByCourse.get(course.id);
                          return (
                            <div
                              className={`rounded-md border px-3 py-2 mb-3 flex items-center gap-2 text-xs ${
                                plan
                                  ? "border-primary/30 bg-primary/5"
                                  : "border-dashed border-border/60 bg-muted/30"
                              }`}
                            >
                              <CalendarDays
                                className={`h-3.5 w-3.5 shrink-0 ${plan ? "text-primary" : "text-muted-foreground"}`}
                              />
                              <span className="flex-1 truncate">
                                {plan
                                  ? `Exam ${format(new Date(plan.examDate), "MMM d, yyyy")}`
                                  : "No exam date set"}
                              </span>
                            </div>
                          );
                        })()}

                        <div className="flex gap-2 mt-auto">
                          <Button
                            asChild
                            className="flex-1 bg-gradient-primary hover:opacity-90 shadow-sm"
                          >
                            <Link to={`/learn/${course.id}`}>
                              {isDone ? "Review" : "Continue"} <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                          <StudyPlanDialog
                            userId={user.id}
                            course={course}
                            onChange={() => setPlanVersion((v) => v + 1)}
                            trigger={
                              <Button variant="outline" size="icon" title="Study plan">
                                <CalendarDays className="h-4 w-4" />
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right column */}
          <aside className="space-y-6">
            {/* Recent quiz attempts */}
            <Card className="p-5 bg-gradient-card border-border/60 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Recent quizzes</h3>
              </div>
              {recentAttempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No quiz attempts yet. Pass a unit quiz to unlock the next lesson.
                </p>
              ) : (
                <ul className="space-y-3">
                  {recentAttempts.map(({ attempt, course, unit }) => (
                    <li key={attempt.id} className="flex items-center gap-3">
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                          attempt.passed
                            ? "bg-success/15 text-success"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {attempt.passed ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{unit!.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {course!.title}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-bold ${
                            attempt.passed ? "text-success" : "text-destructive"
                          }`}
                        >
                          {attempt.score}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(attempt.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Achievements */}
            <Card className="p-5 bg-gradient-card border-border/60 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-warning" />
                <h3 className="font-semibold">Achievements</h3>
                <span className="ml-auto text-xs text-muted-foreground">
                  {achievements.filter((a) => a.unlocked).length} / {achievements.length}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {achievements.map((a) => (
                  <div
                    key={a.label}
                    title={a.hint}
                    className={`rounded-lg border p-3 text-center transition-base ${
                      a.unlocked
                        ? "bg-gradient-to-br from-warning/10 to-primary/10 border-warning/40"
                        : "bg-muted/40 border-border/60 opacity-60"
                    }`}
                  >
                    <a.icon
                      className={`h-5 w-5 mx-auto mb-1 ${
                        a.unlocked ? "text-warning" : "text-muted-foreground"
                      }`}
                    />
                    <div className="text-[10px] font-medium leading-tight">{a.label}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Notes summary */}
            <Card className="p-5 bg-gradient-card border-border/60 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="h-4 w-4 text-accent" />
                <h3 className="font-semibold">My notes</h3>
              </div>
              <div className="text-3xl font-bold leading-none mb-1">{notes.length}</div>
              <p className="text-xs text-muted-foreground">
                Notes saved across {new Set(notes.map((n) => n.courseId)).size} course(s).
              </p>
            </Card>
          </aside>
        </div>

        {/* Library — notes + saved PDFs */}
        <LibrarySection />



        {/* Recommended */}
        {recommended.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Recommended for you</h2>
                <p className="text-sm text-muted-foreground">Handpicked courses to expand your skills</p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/courses">
                  See all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {recommended.map((c) => (
                <Card
                  key={c.id}
                  className="overflow-hidden bg-gradient-card border-border/60 shadow-card hover:shadow-elegant transition-smooth hover:-translate-y-0.5"
                >
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img src={c.thumbnail} alt={c.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px]">
                        {c.difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{c.duration}</span>
                    </div>
                    <h3 className="font-semibold mb-1 line-clamp-1">{c.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{c.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">${c.price}</span>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/course/${c.id}`}>
                          View <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
