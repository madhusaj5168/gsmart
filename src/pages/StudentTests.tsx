import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { getRetakeStatus, TestAttempts, Tests } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ClipboardList, Clock, Target, CheckCircle2, XCircle, ArrowRight, Lock, RefreshCw } from "lucide-react";

export default function StudentTests() {
  const { user } = useAuth();
  if (!user) return null;
  const assigned = Tests.forUser(user.id);
  const myAttempts = TestAttempts.forUser(user.id);

  const bestAttempt = (testId: string) =>
    myAttempts.filter((a) => a.testId === testId).sort((a, b) => b.score - a.score)[0];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-1">My Test Series</h1>
          <p className="text-muted-foreground">Tests your instructors have assigned to you.</p>
        </div>

        {assigned.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-card border-dashed">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">No tests assigned yet</h3>
            <p className="text-sm text-muted-foreground">Check back later — your instructor will assign tests here.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {assigned.map((t) => {
              const best = bestAttempt(t.id);
              const attemptCount = myAttempts.filter((a) => a.testId === t.id).length;
              const status = getRetakeStatus(user.id, t.id);
              const attemptsLabel =
                t.maxAttempts > 0 ? `${attemptCount} / ${t.maxAttempts} attempts` : `${attemptCount} attempt${attemptCount === 1 ? "" : "s"}`;
              return (
                <Card key={t.id} className="p-5 bg-gradient-card border-border/60 shadow-card hover:shadow-elegant transition-smooth flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow shrink-0">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.category}</div>
                      <h3 className="font-semibold leading-tight">{t.title}</h3>
                    </div>
                    {best && (
                      <Badge className={best.passed ? "bg-success/15 text-success border-success/20" : "bg-destructive/15 text-destructive border-destructive/20"} variant="outline">
                        {best.passed ? "Passed" : "Try again"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{t.description || "No description provided."}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                    <span className="inline-flex items-center gap-1"><ClipboardList className="h-3 w-3" /> {t.questions.length} Qs</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {t.durationMin} min</span>
                    <span className="inline-flex items-center gap-1"><Target className="h-3 w-3" /> Pass ≥ {t.passingScore}%</span>
                    <span className="inline-flex items-center gap-1"><RefreshCw className="h-3 w-3" /> {attemptsLabel}</span>
                  </div>
                  {best && (
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3 mb-3 flex items-center gap-2">
                      {best.passed ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      <div className="text-sm">Best score: <span className={`font-bold ${best.passed ? "text-success" : "text-destructive"}`}>{best.score}%</span></div>
                    </div>
                  )}
                  {!status.canTake && status.reason && (
                    <div className="rounded-lg border border-border/60 bg-muted/40 p-3 mb-3 flex items-start gap-2 text-xs text-muted-foreground">
                      <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{status.reason}</span>
                    </div>
                  )}
                  <Button asChild disabled={!status.canTake} className="mt-auto bg-gradient-primary hover:opacity-90 shadow-sm">
                    <Link to={status.canTake ? `/tests/${t.id}` : "#"} aria-disabled={!status.canTake} onClick={(e) => { if (!status.canTake) e.preventDefault(); }}>
                      {!status.canTake ? "Locked" : best ? "Retake test" : "Start test"} <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
