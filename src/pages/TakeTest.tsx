import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { getRetakeStatus, RetakeViolationError, TestAttempts, Tests } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, XCircle, Send, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function TakeTest() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const test = id ? Tests.byId(id) : null;

  const [startedAt] = useState(new Date().toISOString());
  const [answers, setAnswers] = useState<number[]>(() => (test ? Array(test.questions.length).fill(-1) : []));
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState<{ score: number; passed: boolean } | null>(null);
  const [remaining, setRemaining] = useState(test ? test.durationMin * 60 : 0);

  const isAssigned = user && test && test.assignedUserIds.includes(user.id) && test.status === "published";
  const retake = user && test ? getRetakeStatus(user.id, test.id) : null;

  const submit = useMemo(
    () => () => {
      if (!test || !user || submitted) return;
      try {
        const attempt = TestAttempts.record({
          testId: test.id,
          userId: user.id,
          answers,
          startedAt,
          submittedAt: new Date().toISOString(),
        });
        setSubmitted({ score: attempt.score, passed: attempt.passed });
        toast.success(attempt.passed ? `Passed with ${attempt.score}%` : `Scored ${attempt.score}% — try again`);
      } catch (err) {
        if (err instanceof RetakeViolationError) {
          toast.error(err.message);
          nav("/tests");
        } else {
          toast.error("Could not submit test. Please try again.");
        }
      }
    },
    [test, user, answers, startedAt, submitted, nav]
  );

  useEffect(() => {
    if (!test || submitted) return;
    const i = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(i);
          submit();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [test, submitted, submit]);

  if (!test) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <div className="container py-20 text-center">
          <h2 className="text-2xl mb-3">Test not found</h2>
          <Button asChild><Link to="/tests">Back to tests</Link></Button>
        </div>
      </div>
    );
  }

  if (!isAssigned) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <div className="container py-20 text-center">
          <h2 className="text-2xl mb-2">Not assigned</h2>
          <p className="text-muted-foreground mb-4">This test isn't assigned to you or isn't published yet.</p>
          <Button asChild><Link to="/tests">Back to tests</Link></Button>
        </div>
      </div>
    );
  }

  if (retake && !retake.canTake && !submitted) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <div className="container py-20 text-center max-w-lg mx-auto">
          <h2 className="text-2xl mb-2">You can't take this test right now</h2>
          <p className="text-muted-foreground mb-2">{retake.reason}</p>
          <p className="text-xs text-muted-foreground mb-4">
            Attempts used: {retake.attemptsUsed}
            {retake.attemptsRemaining !== null && ` · Remaining: ${retake.attemptsRemaining}`}
          </p>
          <Button asChild><Link to="/tests">Back to tests</Link></Button>
        </div>
      </div>
    );
  }

  const q = test.questions[current];
  const answeredCount = answers.filter((a) => a !== -1).length;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <div className="container py-10 max-w-3xl">
          <Card className="p-8 text-center bg-gradient-card border-border/60 shadow-elegant">
            <div className={`grid h-16 w-16 place-items-center rounded-full mx-auto mb-4 ${submitted.passed ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
              {submitted.passed ? <Trophy className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
            </div>
            <h1 className="text-3xl font-bold mb-2">{submitted.passed ? "Test passed!" : "Not quite there"}</h1>
            <p className="text-muted-foreground mb-6">
              You scored <span className="font-bold text-foreground">{submitted.score}%</span> · passing is {test.passingScore}%
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild variant="outline"><Link to="/tests">Back to tests</Link></Button>
              <Button asChild className="bg-gradient-primary hover:opacity-90"><Link to="/dashboard">Go to dashboard</Link></Button>
            </div>
          </Card>

          <Card className="p-6 mt-6">
            <h2 className="font-semibold mb-4">Review your answers</h2>
            <div className="space-y-4">
              {test.questions.map((qq, i) => {
                const picked = answers[i];
                const correct = picked === qq.correctOptionIndex;
                return (
                  <div key={qq.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      {correct ? <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
                      <div className="font-medium text-sm">{i + 1}. {qq.text}</div>
                    </div>
                    <div className="space-y-1 ml-6">
                      {qq.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`text-sm px-3 py-1.5 rounded ${
                            oi === qq.correctOptionIndex
                              ? "bg-success/10 text-success font-medium"
                              : oi === picked
                              ? "bg-destructive/10 text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}. {opt}
                        </div>
                      ))}
                    </div>
                    {qq.explanation && (
                      <p className="text-xs text-muted-foreground mt-2 ml-6 italic">{qq.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <div className="container py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
              <Link to="/tests"><ArrowLeft className="h-4 w-4 mr-1" /> Exit</Link>
            </Button>
            <h1 className="text-2xl font-bold leading-tight">{test.title}</h1>
            <p className="text-xs text-muted-foreground">Pass ≥ {test.passingScore}% · {test.questions.length} questions</p>
          </div>
          <Badge variant="outline" className="text-base px-3 py-1.5 gap-1.5">
            <Clock className="h-4 w-4" /> {mm}:{ss}
          </Badge>
        </div>

        <Progress value={((current + 1) / test.questions.length) * 100} className="h-1.5 mb-6" />

        <Card className="p-6 mb-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Question {current + 1} of {test.questions.length}
          </div>
          <h2 className="text-lg font-semibold mb-5">{q.text}</h2>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const picked = answers[current] === oi;
              return (
                <button
                  key={oi}
                  onClick={() => setAnswers((prev) => prev.map((a, i) => (i === current ? oi : a)))}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-base flex items-center gap-3 ${
                    picked ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
                  }`}
                >
                  <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold shrink-0 ${picked ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span className="text-sm">{opt}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-sm text-muted-foreground">
            {answeredCount} / {test.questions.length} answered
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            {current < test.questions.length - 1 ? (
              <Button onClick={() => setCurrent((c) => c + 1)} className="bg-gradient-primary hover:opacity-90">
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit} className="bg-gradient-primary hover:opacity-90 shadow-glow">
                <Send className="h-4 w-4 mr-1.5" /> Submit test
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
