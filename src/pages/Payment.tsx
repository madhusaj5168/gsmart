import Navbar from "@/components/Navbar";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { Courses, Enrollments } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ShieldCheck, Lock, Smartphone, Copy, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";

// TODO: Replace this with your uploaded QR code image (place under src/assets/ and import)
const QR_IMAGE_URL = "";
const UPI_ID = "sequential@upi";
const MERCHANT_NAME = "Sequential Learning";

export default function Payment() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const course = id ? Courses.byId(id) : null;
  const [txnId, setTxnId] = useState("");
  const [verifying, setVerifying] = useState(false);

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

  if (!user) {
    nav("/login");
    return null;
  }

  const tax = +(course.price * 0.0).toFixed(2);
  const total = course.price + tax;

  const handleVerify = () => {
    if (txnId.trim().length < 6) {
      toast.error("Enter a valid transaction / UTR ID (min 6 chars).");
      return;
    }
    setVerifying(true);
    // Simulate gateway check: treat IDs starting with "FAIL" as failed for demo/testing
    const outcome: "success" | "failed" = txnId.trim().toUpperCase().startsWith("FAIL") ? "failed" : "success";
    setTimeout(() => {
      setVerifying(false);
      nav(`/pay/${course.id}/status`, {
        state: {
          txnId: txnId.trim(),
          outcome,
          reason: outcome === "failed" ? "Transaction ID was flagged by our verification system." : undefined,
        },
      });
    }, 600);
  };

  const copyUpi = async () => {
    await navigator.clipboard.writeText(UPI_ID);
    toast.success("UPI ID copied");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <div className="container py-10 max-w-6xl">
        <div className="mb-8">
          <Link to={`/courses/${course.id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to course</Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">Complete your payment</h1>
          <p className="text-muted-foreground">Scan the QR code below to enroll and unlock your learning journey.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
          {/* QR + instructions */}
          <Card className="p-8 shadow-elegant">
            <div className="flex items-center gap-2 mb-6">
              <Badge className="bg-gradient-primary text-primary-foreground border-0"><Smartphone className="h-3 w-3 mr-1" />UPI / QR Pay</Badge>
              <Badge variant="outline"><ShieldCheck className="h-3 w-3 mr-1" />Secure</Badge>
            </div>

            <div className="grid md:grid-cols-[280px_1fr] gap-8 items-start">
              {/* QR block */}
              <div className="flex flex-col items-center">
                <div className="relative rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-secondary/40 to-background p-4 shadow-card">
                  {QR_IMAGE_URL ? (
                    <img src={QR_IMAGE_URL} alt="Payment QR code" className="h-60 w-60 object-contain rounded-lg" />
                  ) : (
                    <div className="h-60 w-60 grid place-items-center rounded-lg bg-muted/60 text-center p-4">
                      <div>
                        <QrCode className="h-16 w-16 mx-auto text-muted-foreground/60 mb-3" />
                        <p className="text-xs text-muted-foreground">Drop your QR code image here.<br />Edit <code className="text-[10px]">QR_IMAGE_URL</code> in <code className="text-[10px]">Payment.tsx</code>.</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-3 py-0.5 rounded-full text-xs font-medium text-primary border border-primary/20">
                    Scan to pay
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground">Pays to</p>
                  <p className="font-semibold">{MERCHANT_NAME}</p>
                  <button onClick={copyUpi} className="mt-1 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <Copy className="h-3 w-3" />{UPI_ID}
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div>
                <h3 className="font-semibold mb-4">How to pay</h3>
                <ol className="space-y-3 text-sm">
                  {[
                    "Open any UPI app (GPay, PhonePe, Paytm, BHIM).",
                    `Scan the QR code or pay to ${UPI_ID}.`,
                    `Enter the exact amount: $${total.toFixed(2)}.`,
                    "Complete the payment and copy the Transaction / UTR ID.",
                    "Paste it below and click Verify to unlock the course.",
                  ].map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">{i + 1}</span>
                      <span className="text-muted-foreground">{s}</span>
                    </li>
                  ))}
                </ol>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <Label htmlFor="txn">Transaction / UTR ID</Label>
                  <Input
                    id="txn"
                    placeholder="e.g. 412589637421"
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    className="h-11 font-mono"
                  />
                  <Button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="w-full h-11 bg-gradient-primary hover:opacity-90 shadow-glow"
                  >
                    {verifying ? (<><Loader2 className="h-4 w-4 animate-spin" />Verifying payment...</>) : (<><Lock className="h-4 w-4" />Verify & Unlock Course</>)}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Order summary */}
          <Card className="p-6 shadow-card sticky top-24">
            <h3 className="font-semibold mb-4">Order summary</h3>
            <div className="flex gap-3 mb-4">
              <img src={course.thumbnail} alt={course.title} className="h-16 w-20 rounded-md object-cover" />
              <div className="min-w-0">
                <p className="font-medium text-sm line-clamp-2">{course.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{course.units.length} units • {course.duration}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${course.price.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${tax.toFixed(2)}</span></div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between items-baseline mb-6">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />Lifetime access to all units</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />Certificate on completion</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />30-day money-back guarantee</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
