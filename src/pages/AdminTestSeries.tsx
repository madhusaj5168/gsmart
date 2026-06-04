import Navbar from "@/components/Navbar";
import { Tests, TestAttempts, Users } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Users as UsersIcon, ClipboardList, FileCheck2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminTestSeries() {
  const [, force] = useState(0);
  const nav = useNavigate();
  const tests = Tests.all();
  const students = Users.all().filter((u) => u.role === "student");

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    Tests.delete(id);
    toast.success("Test series deleted");
    force((n) => n + 1);
  };

  const togglePublish = (id: string) => {
    const t = Tests.byId(id);
    if (!t) return;
    if (t.status !== "published" && t.questions.length === 0) {
      toast.error("Add at least one question before publishing");
      return;
    }
    t.status = t.status === "published" ? "draft" : "published";
    Tests.save(t);
    toast.success(`Test ${t.status}`);
    force((n) => n + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <div className="container py-10">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Admin</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1">Test Series</h1>
            <p className="text-muted-foreground">Author tests, assign them to students, and review submissions.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/admin">Back to dashboard</Link></Button>
            <Button onClick={() => nav("/admin/tests/new")} className="bg-gradient-primary hover:opacity-90 shadow-glow h-11">
              <Plus className="h-4 w-4 mr-1.5" /> New test series
            </Button>
          </div>
        </div>

        {tests.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-card border-dashed">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">No test series yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first test series to assign to students.</p>
            <Button onClick={() => nav("/admin/tests/new")} className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-1.5" /> Create test series
            </Button>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">All test series</h2>
              <span className="text-sm text-muted-foreground">{tests.length} total · {students.length} students available</span>
            </div>
            <div className="divide-y">
              {tests.map((t) => {
                const submissions = TestAttempts.forTest(t.id).length;
                return (
                  <div key={t.id} className="px-6 py-4 flex items-center gap-4 hover:bg-secondary/40 transition-base">
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-sm shrink-0">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h3 className="font-semibold truncate">{t.title}</h3>
                        <Badge variant={t.status === "published" ? "default" : "secondary"} className={t.status === "published" ? "bg-success/15 text-success border-success/20" : ""}>
                          {t.status}
                        </Badge>
                        <Badge variant="outline" className="font-normal">{t.category}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                        <span>{t.questions.length} questions</span>
                        <span>{t.durationMin} min</span>
                        <span>Pass ≥ {t.passingScore}%</span>
                        <span className="inline-flex items-center gap-1"><UsersIcon className="h-3 w-3" /> {t.assignedUserIds.length} assigned</span>
                        <span className="inline-flex items-center gap-1"><FileCheck2 className="h-3 w-3" /> {submissions} submissions</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => togglePublish(t.id)}>
                      {t.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/tests/${t.id}`} aria-label="Edit"><Edit className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id, t.title)} className="text-destructive hover:text-destructive" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
