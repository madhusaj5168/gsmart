import Navbar from "@/components/Navbar";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Courses, Enrollments } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Loader2, ArrowRight, RefreshCw, LifeBuoy, Receipt, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

type Status = "processing" | "success" | "failed";

export default function PaymentStatus() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const course = id ? Courses.byId(id) : null;

  const state = (loc.state || {}) as { txnId?: string; outcome?: "success" | "failed"; reason?: string };
  const txnId = state.txnId || "—";
  const forced = state.outcome;

  const [status, setStatus] = useState<Status>("processing");
  const [reason, setReason] = useState<string | undefined>(state.reason);
  const [redirectIn, setRedirectIn] = useState(5);

  const stamp = useMemo(() => new Date().toLocaleString(), []);

  useEffect(() => {
    if (!course || !user) return;
    const t = setTimeout(() => {
      const ok = forced ? forced === "success" : true;
      if (ok) {
        Enrollments.enroll(user.id, course.id);
        setStatus("success");
      } else {
        setReason(reason || "We couldn't match this transaction to a recent payment.");
        setStatus("failed");
      }
    }, 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-redirect to dashboard after successful verification
  useEffect(() => {
    if (status !== "success") return;
    setRedirectIn(5);
    const tick = setInterval(() => {
      setRedirectIn((s) => {
        if (s <= 1) {
          clearInterval(tick);
          nav("/dashboard");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [status, nav]);

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-semibold">Course not found</h2>
          <Button asChild className="mt-6"><Link to="/courses">Back to courses</Link></Button>
        </div>
      </div>
    );
  }

  const total = course.price;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <div className="container py-12 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden shadow-elegant">
            {/* Header banner */}
            <div
              className={
                "p-8 text-center " +
                (status === "success"
                  ? "bg-gradient-to-br from-success/15 via-success/5 to-background"
                  : status === "failed"
                  ? "bg-gradient-to-br from-destructive/15 via-destructive/5 to-background"
                  : "bg-gradient-to-br from-primary/10 via-secondary/30 to-background")
              }
            >
              <motion.div
                key={status}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-background shadow-card"
              >
                {status === "processing" && <Loader2 className="h-10 w-10 text-primary animate-spin" />}
                {status === "success" && <CheckCircle2 className="h-12 w-12 text-success" />}
                {status === "failed" && <XCircle className="h-12 w-12 text-destructive" />}
              </motion.div>

              <Badge variant="outline" className="mb-3">
                {status === "processing" && "Verifying payment"}
                {status === "success" && "Payment verified"}
                {status === "failed" && "Verification failed"}
              </Badge>

              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {status === "processing" && "Checking your transaction…"}
                {status === "success" && "You're all set!"}
                {status === "failed" && "We couldn't verify that payment"}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                {status === "processing" && "Hang tight while we confirm your UPI transaction. This usually takes a few seconds."}
                {status === "success" && `You're enrolled in "${course.title}". Redirecting to your dashboard in ${redirectIn}s…`}
                {status === "failed" && (reason || "Please retry the payment or contact support with your UTR ID.")}
              </p>
            </div>

            {/* Receipt */}
            <div className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Transaction details</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <Row label="Course" value={course.title} />
                <Row label="Amount" value={`$${total.toFixed(2)}`} />
                <Row label="UTR / Txn ID" value={<span className="font-mono">{txnId}</span>} />
                <Row label="Date" value={stamp} />
                <Row label="Method" value="UPI / QR" />
                <Row
                  label="Status"
                  value={
                    <span
                      className={
                        status === "success"
                          ? "text-success font-medium"
                          : status === "failed"
                          ? "text-destructive font-medium"
                          : "text-primary font-medium"
                      }
                    >
                      {status === "success" ? "Paid" : status === "failed" ? "Failed" : "Processing"}
                    </span>
                  }
                />
              </div>

              <Separator className="my-6" />

              {/* Next steps */}
              <h3 className="font-semibold mb-3">What's next?</h3>
              {status === "success" && (
                <div className="space-y-3">
                  <Step n={1} title="Jump into Unit 1" desc="Your first unit is unlocked and ready to go." />
                  <Step n={2} title="Take notes as you learn" desc="Use voice or text — they save to your Library." />
                  <Step n={3} title="Pass each quiz" desc="Score above the passing mark to unlock the next unit." />
                  <div className="flex flex-wrap gap-3 pt-4">
                    <Button onClick={() => nav("/dashboard")} className="bg-gradient-primary hover:opacity-90 shadow-glow">
                      Go to dashboard now <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button asChild variant="outline">
                      <Link to={`/learn/${course.id}`}>Start learning</Link>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">Auto-redirecting in {redirectIn}s…</p>
                </div>
              )}

              {status === "failed" && (
                <div className="space-y-3">
                  <Step n={1} title="Double-check the UTR ID" desc="Open your UPI app and copy the exact 12-digit reference." />
                  <Step n={2} title="Retry the payment" desc="If the amount was not debited, scan the QR code again." />
                  <Step n={3} title="Contact support" desc="If money was deducted but not verified, reach out with your UTR." />
                  <div className="flex flex-wrap gap-3 pt-4">
                    <Button onClick={() => nav(`/pay/${course.id}`)} className="bg-gradient-primary hover:opacity-90">
                      <RefreshCw className="h-4 w-4" /> Try again
                    </Button>
                    <Button asChild variant="outline">
                      <a href="mailto:support@sequential.learn"><LifeBuoy className="h-4 w-4" /> Contact support</a>
                    </Button>
                    <Button asChild variant="ghost"><Link to="/courses">Back to courses</Link></Button>
                  </div>
                </div>
              )}

              {status === "processing" && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  Preparing your course materials…
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right truncate">{value}</span>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">
        {n}
      </span>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
