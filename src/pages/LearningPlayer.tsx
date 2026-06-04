import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Courses, Enrollments } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Lock, PlayCircle, FileText, ClipboardList, BookOpen, Sparkles, Download } from "lucide-react";
import QuizModal from "@/components/QuizModal";
import Notemaker from "@/components/Notemaker";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

export default function LearningPlayer() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const course = id ? Courses.byId(id) : null;
  const enrollment = user && course ? Enrollments.find(user.id, course.id) : null;
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Deep-link support: /learn/:id?unit=<unitId>
  useEffect(() => {
    if (!course || !enrollment) return;
    const requested = searchParams.get("unit");
    if (requested) {
      const unit = course.units.find((u) => u.id === requested);
      if (!unit) {
        toast.error("That unit no longer exists");
      } else if (!enrollment.unlockedUnits.includes(unit.id)) {
        toast.warning(`Unit ${unit.order} is still locked — complete earlier units first`);
        setActiveUnitId(course.units[0]?.id ?? null);
      } else {
        setActiveUnitId(unit.id);
      }
      // Clear the param so refreshes don't re-trigger toasts
      const next = new URLSearchParams(searchParams);
      next.delete("unit");
      setSearchParams(next, { replace: true });
      return;
    }
    if (!activeUnitId) {
      const last = enrollment.unlockedUnits[enrollment.unlockedUnits.length - 1];
      setActiveUnitId(last || course.units[0]?.id);
    }
  }, [course, enrollment, activeUnitId, searchParams, setSearchParams]);

  const activeUnit = useMemo(
    () => course?.units.find((u) => u.id === activeUnitId) || null,
    [course, activeUnitId]
  );

  if (!course || !enrollment) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <div className="container py-20 text-center">
          <h2 className="text-2xl mb-2">You're not enrolled in this course</h2>
          <Button onClick={() => nav(`/courses/${id}`)} className="mt-4 bg-gradient-primary">View course</Button>
        </div>
      </div>
    );
  }

  if (!activeUnit) return null;

  const isUnlocked = enrollment.unlockedUnits.includes(activeUnit.id);
  const isCompleted = enrollment.completedUnits.includes(activeUnit.id);

  const handleMarkComplete = () => {
    if (!isUnlocked) {
      toast.error("Unit is locked");
      return;
    }
    setQuizOpen(true);
  };

  const handlePassed = () => {
    rerender();
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1800);
    const next = course.units.find((u) => u.order === activeUnit.order + 1);
    if (next) setTimeout(() => setActiveUnitId(next.id), 800);
  };

  const downloadPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(22);
    doc.text(activeUnit.title, 40, 60);
    doc.setFontSize(11);
    doc.setTextColor(120);
    doc.text(`${course.title} — Unit ${activeUnit.order}`, 40, 80);
    doc.setTextColor(40);
    doc.setFontSize(12);
    const div = document.createElement("div");
    div.innerHTML = activeUnit.readingHtml;
    const text = div.innerText;
    const lines = doc.splitTextToSize(text, 515);
    doc.text(lines, 40, 120);
    doc.save(`${activeUnit.title}.pdf`);
    toast.success("Lesson PDF downloaded");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Progress header */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground mb-0.5">{course.title}</div>
              <div className="font-semibold truncate">Unit {activeUnit.order}: {activeUnit.title}</div>
            </div>
            <div className="flex items-center gap-3 min-w-[180px]">
              <Progress value={enrollment.progressPercent} className="h-2 flex-1" />
              <span className="text-sm font-medium tabular-nums">{enrollment.progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6 grid lg:grid-cols-[280px_1fr_360px] gap-5">
        {/* Sidebar: Units */}
        <aside className="lg:sticky lg:top-20 self-start max-h-[calc(100vh-6rem)] overflow-auto">
          <Card className="p-3 bg-gradient-card">
            <div className="px-2 py-1.5 mb-1 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Course units</h3>
              <span className="text-xs text-muted-foreground">{enrollment.completedUnits.length}/{course.units.length}</span>
            </div>
            <div className="space-y-1">
              {course.units.map((u) => {
                const unlocked = enrollment.unlockedUnits.includes(u.id);
                const done = enrollment.completedUnits.includes(u.id);
                const active = u.id === activeUnitId;
                return (
                  <button
                    key={u.id}
                    disabled={!unlocked}
                    onClick={() => setActiveUnitId(u.id)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-base group",
                      active && "bg-primary/10 border border-primary/30",
                      !active && unlocked && "hover:bg-secondary",
                      !unlocked && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "grid h-7 w-7 place-items-center rounded-full flex-shrink-0 text-xs font-bold",
                      done ? "bg-success text-white" : unlocked ? (active ? "bg-primary text-primary-foreground" : "bg-secondary") : "bg-muted"
                    )}>
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : unlocked ? u.order : <Lock className="h-3 w-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={cn("text-sm font-medium truncate", active && "text-primary")}>{u.title}</div>
                      <div className="text-xs text-muted-foreground">{u.duration}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </aside>

        {/* Main: video + content */}
        <main className="space-y-4">
          <Card className="overflow-hidden bg-black border-0 shadow-elegant">
            <div className="aspect-video relative">
              <video ref={videoRef} key={activeUnit.id} src={activeUnit.videoUrl} controls poster={course.thumbnail}
                className="w-full h-full" />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Unit {activeUnit.order} • {activeUnit.duration}</div>
                <h1 className="text-2xl font-bold">{activeUnit.title}</h1>
                <p className="text-muted-foreground mt-1">{activeUnit.description}</p>
              </div>
              <Button
                onClick={handleMarkComplete}
                disabled={!isUnlocked}
                className={cn(
                  "shadow-glow whitespace-nowrap",
                  isCompleted ? "bg-success hover:bg-success/90" : "bg-gradient-primary hover:opacity-90"
                )}
              >
                {isCompleted ? <><CheckCircle2 className="h-4 w-4 mr-1.5" />Retake quiz</> : <>Mark complete → Quiz</>}
              </Button>
            </div>

            <Tabs defaultValue="reading" className="mt-2">
              <TabsList>
                <TabsTrigger value="reading"><BookOpen className="h-3.5 w-3.5 mr-1.5" />Reading</TabsTrigger>
                <TabsTrigger value="pdf"><FileText className="h-3.5 w-3.5 mr-1.5" />PDF</TabsTrigger>
                <TabsTrigger value="resources"><PlayCircle className="h-3.5 w-3.5 mr-1.5" />Resources</TabsTrigger>
                <TabsTrigger value="quiz"><ClipboardList className="h-3.5 w-3.5 mr-1.5" />Quiz</TabsTrigger>
              </TabsList>
              <TabsContent value="reading" className="mt-4">
                <article className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: activeUnit.readingHtml }} />
              </TabsContent>
              <TabsContent value="pdf" className="mt-4">
                <div className="rounded-lg border bg-gradient-subtle p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-destructive/10 text-destructive"><FileText className="h-5 w-5" /></div>
                      <div>
                        <div className="font-semibold">{activeUnit.title} — Lesson Notes</div>
                        <div className="text-xs text-muted-foreground">PDF • Generated from lesson content</div>
                      </div>
                    </div>
                    <Button onClick={downloadPDF} variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1.5" />Download</Button>
                  </div>
                  <article className="prose prose-sm max-w-none dark:prose-invert bg-card rounded-md p-6 border" dangerouslySetInnerHTML={{ __html: activeUnit.readingHtml }} />
                </div>
              </TabsContent>
              <TabsContent value="resources" className="mt-4">
                <div className="space-y-2">
                  {activeUnit.resources.map((r) => (
                    <a key={r.name} href={r.url} className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary transition-base">
                      <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{r.name}</span></div>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="quiz" className="mt-4">
                <div className="text-center p-8 rounded-lg border bg-gradient-subtle">
                  <ClipboardList className="h-10 w-10 mx-auto text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-1">Ready for the quiz?</h3>
                  <p className="text-sm text-muted-foreground mb-4">{activeUnit.quiz.questions.length} questions • {activeUnit.quiz.passingScore}% to pass</p>
                  <Button onClick={() => setQuizOpen(true)} disabled={!isUnlocked} className="bg-gradient-primary hover:opacity-90 shadow-glow">
                    Start quiz
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </main>

        {/* Right: Notemaker */}
        <aside className="lg:sticky lg:top-20 self-start max-h-[calc(100vh-6rem)]">
          <Card className="overflow-hidden flex flex-col h-[600px] lg:h-[calc(100vh-6rem)]">
            <div className="px-4 py-3 border-b bg-gradient-card">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">My Notes</h3>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <Notemaker
                courseId={course.id}
                unitId={activeUnit.id}
                unitTitle={activeUnit.title}
                getVideoTime={() => videoRef.current?.currentTime || 0}
              />
            </div>
          </Card>
        </aside>
      </div>

      <QuizModal
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        quiz={activeUnit.quiz}
        courseId={course.id}
        unitId={activeUnit.id}
        unitTitle={activeUnit.title}
        onPassed={handlePassed}
      />

      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 grid place-items-center pointer-events-none"
          >
            <div className="bg-gradient-primary text-primary-foreground px-8 py-6 rounded-2xl shadow-glow flex items-center gap-3">
              <Sparkles className="h-6 w-6" />
              <div>
                <div className="font-bold text-lg">Unit unlocked!</div>
                <div className="text-sm opacity-90">Great work — keep going.</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
