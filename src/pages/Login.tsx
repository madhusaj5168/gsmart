import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import SEO from "@/components/SEO";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name.split(" ")[0]}!`);
      nav(u.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fill = (role: "admin" | "student") => {
    setEmail(role === "admin" ? "admin@learn.com" : "student@learn.com");
    setPassword(role === "admin" ? "admin123" : "student123");
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-subtle p-4">
      <SEO
        title="Sign in — SequentialLearn"
        description="Sign in to your SequentialLearn account to continue your courses, notes, and saved PDFs."
        path="/login"
      />
      <Card className="w-full max-w-md p-8 shadow-elegant bg-gradient-card">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl">Sequential<span className="text-gradient">Learn</span></span>
        </Link>
        <h1 className="text-2xl font-bold text-center mb-1">Welcome back</h1>
        <p className="text-center text-muted-foreground text-sm mb-6">Log in to continue learning</p>
        <form onSubmit={handle} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-primary hover:opacity-90 shadow-glow h-11">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">Try a demo account</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fill("student")}>Student demo</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => fill("admin")}>Admin demo</Button>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6">
          New here? <Link to="/register" className="text-primary hover:underline font-medium">Create account</Link>
        </p>
      </Card>
    </div>
  );
}
