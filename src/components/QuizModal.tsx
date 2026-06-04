import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Trophy, RotateCcw, ArrowRight } from "lucide-react";
import type { Quiz } from "@/lib/seed";
import { Attempts, Enrollments } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  quiz: Quiz;
  courseId: string;
  unitId: string;
  unitTitle: string;
  onPassed: () => void;
}

export default function QuizModal({ open, onClose, quiz, courseId, unitId, unitTitle, onPassed }: Props) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const reset = () => { setAnswers([]); setCurrent(0); setSubmitted(false); setScore(0); };

  const handleSelect = (idx: number) => {
    const next = [...answers];
    next[current] = idx;
    setAnswers(next);
  };

  const submit = () => {
    if (!user) return;
    const correct = quiz.questions.reduce((s, q, i) => s + (answers[i] === q.correctOptionIndex ? 1 : 0), 0);
    const pct = Math.round((correct / quiz.questions.length) * 100);
    const passed = pct >= quiz.passingScore;
    setScore(pct);
    setSubmitted(true);
    Attempts.record({ userId: user.id, courseId, unitId, score: pct, passed, answers });
    if (passed) {
      Enrollments.passUnit(user.id, courseId, unitId);
      toast.success(`Passed with ${pct}%! Next unit unlocked.`);
    } else {
      toast.error(`Scored ${pct}%. Need ${quiz.passingScore}% — review and try again.`);
    }
  };

  const close = () => { reset(); onClose(); };
  const passed = score >= quiz.passingScore;
  const q = quiz.questions[current];
  const allAnswered = quiz.questions.every((_, i) => answers[i] !== undefined);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Unit Quiz: {unitTitle}</DialogTitle>
        </DialogHeader>

        {!submitted ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Question {current + 1} of {quiz.questions.length}</span>
              <span className="text-muted-foreground">Pass: {quiz.passingScore}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-gradient-primary transition-smooth" style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
            </div>
            <Card className="p-5">
              <h3 className="font-semibold text-base mb-4">{q.text}</h3>
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-lg border-2 transition-base hover:border-primary/50",
                      answers[current] === i ? "border-primary bg-primary/5" : "border-border bg-card"
                    )}
                  >
                    <span className="font-medium mr-2 text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
            </Card>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}>Previous</Button>
              {current < quiz.questions.length - 1 ? (
                <Button onClick={() => setCurrent(current + 1)} disabled={answers[current] === undefined} className="bg-gradient-primary">
                  Next <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={!allAnswered} className="bg-gradient-primary hover:opacity-90 shadow-glow">
                  Submit quiz
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className={cn("p-6 rounded-xl text-center", passed ? "bg-success/10" : "bg-destructive/10")}>
              {passed ? <Trophy className="h-12 w-12 mx-auto text-success mb-2" /> : <RotateCcw className="h-12 w-12 mx-auto text-destructive mb-2" />}
              <h3 className={cn("text-2xl font-bold mb-1", passed ? "text-success" : "text-destructive")}>
                {passed ? "You passed!" : "Not yet"}
              </h3>
              <p className="text-3xl font-bold mb-1">{score}%</p>
              <p className="text-sm text-muted-foreground">
                {passed ? "The next unit is now unlocked." : `You need ${quiz.passingScore}% to advance. Review the unit and try again.`}
              </p>
            </div>
            <div className="space-y-3 max-h-64 overflow-auto">
              {quiz.questions.map((qq, i) => {
                const correct = answers[i] === qq.correctOptionIndex;
                return (
                  <Card key={qq.id} className="p-4">
                    <div className="flex items-start gap-2 mb-2">
                      {correct ? <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />}
                      <div className="text-sm font-medium">{qq.text}</div>
                    </div>
                    <div className="text-xs text-muted-foreground ml-7">
                      Correct: <span className="font-medium text-foreground">{qq.options[qq.correctOptionIndex]}</span>
                      <div className="mt-1 italic">{qq.explanation}</div>
                    </div>
                  </Card>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              {passed ? (
                <Button onClick={() => { close(); onPassed(); }} className="bg-gradient-primary hover:opacity-90 shadow-glow">
                  Continue to next unit <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={close}>Review unit</Button>
                  <Button onClick={reset} className="bg-gradient-primary hover:opacity-90">Retry quiz</Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
