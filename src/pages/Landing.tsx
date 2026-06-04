import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Trophy, Zap, Lock, Mic, FileText, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Courses } from "@/lib/store";

const features = [
  { icon: Lock, title: "Sequential unlocking", desc: "Students unlock units one at a time by passing instant quizzes — true mastery learning." },
  { icon: Mic, title: "Voice notemaker", desc: "Dictate notes while watching lessons. Auto-saved, timestamped, exportable." },
  { icon: FileText, title: "Rich PDF lessons", desc: "Admins author beautiful PDFs with images, callouts, and downloadable resources." },
  { icon: Trophy, title: "Pass to progress", desc: "60% quiz score required to advance. Retry after reviewing — no shortcuts." },
  { icon: Zap, title: "Distraction-free player", desc: "Cinema-quality video player with collapsible sidebar and integrated notes." },
  { icon: Sparkles, title: "Modern, beautiful UI", desc: "Designed for focus. Light and dark themes. Mobile responsive." },
];

export default function Landing() {
  const courses = Courses.published().slice(0, 3);
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <SEO
        title="SequentialLearn — Mastery-based LMS for deep learning"
        description="Watch lessons, take voice notes, pass the quiz, then unlock the next unit. A modern LMS built around sequential mastery."
        path="/"
      />
      <Navbar />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-[0.08] pointer-events-none" />
        <div className="absolute top-20 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="container relative py-24 md:py-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm shadow-sm mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Mastery-based learning, reimagined</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] mb-6">
              Learn deeply.<br />
              <span className="text-gradient">Unlock progress.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
              A modern LMS where every unit must be earned. Watch, take notes by voice, pass the quiz, advance to the next. No skipping ahead — just real understanding.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow text-base h-12 px-6">
                <Link to="/courses">Browse courses <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base h-12 px-6">
                <Link to="/register">Start free</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div><span className="font-bold text-foreground">4,300+</span> learners</div>
              <div className="h-4 w-px bg-border" />
              <div><span className="font-bold text-foreground">120+</span> courses</div>
              <div className="h-4 w-px bg-border" />
              <div><span className="font-bold text-foreground">4.8★</span> avg rating</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Built for mastery, not completion</h2>
          <p className="text-muted-foreground text-lg">Every feature is designed around one idea: students who truly understand each unit.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Card className="p-6 h-full bg-gradient-card border-border/60 shadow-card hover:shadow-elegant transition-smooth hover:-translate-y-1">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-primary text-primary-foreground mb-4 shadow-glow">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Courses */}
      <section className="container py-20 border-t">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured courses</h2>
            <p className="text-muted-foreground">Hand-picked paths to start mastering today.</p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/courses">View all <ChevronRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {courses.map((c) => (
            <Link key={c.id} to={`/courses/${c.id}`}>
              <Card className="overflow-hidden bg-card border-border/60 shadow-card hover:shadow-elegant transition-smooth hover:-translate-y-1 group">
                <div className="aspect-video overflow-hidden bg-muted">
                  <img src={c.thumbnail} alt={c.title} className="h-full w-full object-cover group-hover:scale-105 transition-smooth" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="rounded-full bg-secondary px-2 py-0.5">{c.category}</span>
                    <span>•</span>
                    <span>{c.difficulty}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-base">{c.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{c.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">★ {c.rating} <span className="text-muted-foreground">({c.studentsCount})</span></div>
                    <div className="font-bold text-lg">${c.price}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <Card className="overflow-hidden relative bg-gradient-hero text-primary-foreground border-0 p-12 md:p-16 text-center shadow-elegant">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2),_transparent_60%)]" />
          <div className="relative">
            <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-90" />
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to learn the right way?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">Join thousands of learners building real skills — one mastered unit at a time.</p>
            <Button asChild size="lg" variant="secondary" className="h-12 px-8 text-base">
              <Link to="/register">Create free account <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </Card>
      </section>

      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SequentialLearn. Built for mastery.
        </div>
      </footer>
    </div>
  );
}
