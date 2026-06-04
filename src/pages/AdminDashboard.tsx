import Navbar from "@/components/Navbar";
import { Analytics, Courses } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Users, DollarSign, BookOpen, TrendingUp, Plus, Edit, Trash2, BarChart3, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminDashboard() {
  const [, force] = useState(0);
  const nav = useNavigate();
  const stats = Analytics.totals();
  const courses = Courses.all();

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    Courses.delete(id);
    toast.success("Course deleted");
    force((n) => n + 1);
  };

  const handleCreate = () => nav("/admin/courses/new");

  const togglePublish = (id: string) => {
    const c = Courses.byId(id);
    if (!c) return;
    c.status = c.status === "published" ? "draft" : "published";
    Courses.save(c);
    toast.success(`Course ${c.status}`);
    force((n) => n + 1);
  };

  const cards = [
    { icon: Users, label: "Students", value: stats.students, tint: "from-primary to-primary-glow" },
    { icon: DollarSign, label: "Revenue", value: `$${stats.revenue}`, tint: "from-success to-success" },
    { icon: BookOpen, label: "Enrollments", value: stats.enrollments, tint: "from-accent to-accent" },
    { icon: TrendingUp, label: "Quiz pass rate", value: `${stats.quizPassRate}%`, tint: "from-warning to-warning" },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <div className="container py-10">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1">Admin dashboard</h1>
            <p className="text-muted-foreground">Manage courses, content, and learners.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="h-11">
              <Link to="/admin/tests"><ClipboardList className="h-4 w-4 mr-1.5" /> Test Series</Link>
            </Button>
            <Button onClick={handleCreate} className="bg-gradient-primary hover:opacity-90 shadow-glow h-11">
              <Plus className="h-4 w-4 mr-1.5" /> New course
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((s) => (
            <Card key={s.label} className="p-5 bg-gradient-card border-border/60 shadow-card">
              <div className="flex items-center gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${s.tint} text-white shadow-glow`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 mb-6 bg-gradient-card">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Course performance</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-lg bg-card border">
              <div className="text-2xl font-bold">{stats.courses}</div>
              <div className="text-sm text-muted-foreground">Total courses</div>
            </div>
            <div className="p-4 rounded-lg bg-card border">
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <div className="text-sm text-muted-foreground">Avg completion</div>
            </div>
            <div className="p-4 rounded-lg bg-card border">
              <div className="text-2xl font-bold">{stats.attempts}</div>
              <div className="text-sm text-muted-foreground">Quiz attempts</div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">All courses</h2>
            <span className="text-sm text-muted-foreground">{courses.length} total</span>
          </div>
          <div className="divide-y">
            {courses.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-center gap-4 hover:bg-secondary/40 transition-base">
                <img src={c.thumbnail} alt={c.title} className="h-14 w-24 object-cover rounded-lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold truncate">{c.title}</h3>
                    <Badge variant={c.status === "published" ? "default" : "secondary"} className={c.status === "published" ? "bg-success/15 text-success border-success/20" : ""}>
                      {c.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{c.units.length} units • ${c.price} • {c.category}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => togglePublish(c.id)}>
                  {c.status === "published" ? "Unpublish" : "Publish"}
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/admin/courses/${c.id}`}><Edit className="h-4 w-4" /></Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id, c.title)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
