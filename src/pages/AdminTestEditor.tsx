import Navbar from "@/components/Navbar";
import { Tests, TestAttempts, Users } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { Plus, Trash2, Save, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Question, RetakePolicy, TestSeries } from "@/lib/seed";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const blankQuestion = (): Question => ({
  id: crypto.randomUUID(),
  text: "",
  options: ["", "", "", ""],
  correctOptionIndex: 0,
  explanation: "",
});

export default function AdminTestEditor() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const isNew = !id || id === "new";

  const existing = !isNew ? Tests.byId(id!) : null;
  const [test, setTest] = useState<TestSeries>(
    existing || {
      id: "",
      title: "",
      description: "",
      category: "General",
      durationMin: 30,
      passingScore: 60,
      questions: [],
      assignedUserIds: [],
      status: "draft",
      createdBy: user?.id || "",
      createdAt: "",
      maxAttempts: 1,
      retakePolicy: "on_fail",
      cooldownHours: 0,
    }
  );

  const students = useMemo(() => Users.all().filter((u) => u.role === "student"), []);
  const submissions = useMemo(() => (isNew ? [] : TestAttempts.forTest(id!)), [id, isNew]);

  if (!isNew && !existing) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <div className="container py-20 text-center">
          <h2 className="text-2xl mb-3">Test not found</h2>
          <Button asChild><Link to="/admin/tests">Back to tests</Link></Button>
        </div>
      </div>
    );
  }

  const update = (patch: Partial<TestSeries>) => setTest((t) => ({ ...t, ...patch }));

  const updateQ = (qi: number, patch: Partial<Question>) =>
    setTest((t) => ({ ...t, questions: t.questions.map((q, i) => (i === qi ? { ...q, ...patch } : q)) }));

  const addQuestion = () => update({ questions: [...test.questions, blankQuestion()] });
  const removeQuestion = (qi: number) =>
    update({ questions: test.questions.filter((_, i) => i !== qi) });

  const toggleAssign = (uid: string) => {
    const assigned = test.assignedUserIds.includes(uid)
      ? test.assignedUserIds.filter((x) => x !== uid)
      : [...test.assignedUserIds, uid];
    update({ assignedUserIds: assigned });
  };

  const assignAll = () => update({ assignedUserIds: students.map((s) => s.id) });
  const clearAssigned = () => update({ assignedUserIds: [] });

  const validate = (publish: boolean): string | null => {
    if (!test.title.trim()) return "Title is required";
    if (test.durationMin <= 0) return "Duration must be > 0";
    if (test.passingScore < 0 || test.passingScore > 100) return "Passing score must be 0–100";
    if (publish && test.questions.length === 0) return "Add at least one question before publishing";
    for (let i = 0; i < test.questions.length; i++) {
      const q = test.questions[i];
      if (!q.text.trim()) return `Question ${i + 1}: text required`;
      if (q.options.some((o) => !o.trim())) return `Question ${i + 1}: all options must be filled`;
    }
    return null;
  };

  const save = (publish?: boolean) => {
    const status = publish ? "published" : test.status;
    const err = validate(publish || false);
    if (err) { toast.error(err); return; }
    if (isNew) {
      const created = Tests.create({ ...test, status });
      toast.success("Test series created");
      nav(`/admin/tests/${created.id}`, { replace: true });
    } else {
      Tests.save({ ...test, status });
      toast.success(publish ? "Published" : "Saved");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <div className="container py-10 max-w-5xl">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
              <Link to="/admin/tests"><ArrowLeft className="h-4 w-4 mr-1" /> All test series</Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">{isNew ? "New test series" : test.title || "Untitled"}</h1>
            {!isNew && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={test.status === "published" ? "default" : "secondary"} className={test.status === "published" ? "bg-success/15 text-success border-success/20" : ""}>
                  {test.status}
                </Badge>
                <span className="text-sm text-muted-foreground">{test.questions.length} questions · {test.assignedUserIds.length} assigned</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => save(false)}><Save className="h-4 w-4 mr-1.5" /> Save draft</Button>
            <Button onClick={() => save(true)} className="bg-gradient-primary hover:opacity-90 shadow-glow">Publish</Button>
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="questions">Questions ({test.questions.length})</TabsTrigger>
            <TabsTrigger value="assign">Assign ({test.assignedUserIds.length})</TabsTrigger>
            <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-6">
            <Card className="p-6 space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={test.title} onChange={(e) => update({ title: e.target.value })} placeholder="e.g. React Fundamentals — Mock Test 1" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={test.description} onChange={(e) => update({ description: e.target.value })} placeholder="What this test covers, instructions for students…" className="mt-1.5" rows={3} />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cat">Category</Label>
                  <Input id="cat" value={test.category} onChange={(e) => update({ category: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="dur">Duration (minutes)</Label>
                  <Input id="dur" type="number" min={1} value={test.durationMin} onChange={(e) => update({ durationMin: parseInt(e.target.value) || 0 })} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="pass">Passing score (%)</Label>
                  <Input id="pass" type="number" min={0} max={100} value={test.passingScore} onChange={(e) => update({ passingScore: parseInt(e.target.value) || 0 })} className="mt-1.5" />
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold">Attempts & retake rules</h3>
                <p className="text-sm text-muted-foreground">Control how often students can retake this test.</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="max">Max attempts</Label>
                  <Input id="max" type="number" min={0} value={test.maxAttempts} onChange={(e) => update({ maxAttempts: parseInt(e.target.value) || 0 })} className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">0 = unlimited</p>
                </div>
                <div>
                  <Label htmlFor="policy">Retake policy</Label>
                  <Select value={test.retakePolicy} onValueChange={(v) => update({ retakePolicy: v as RetakePolicy })}>
                    <SelectTrigger id="policy" className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_fail">Only after failing</SelectItem>
                      <SelectItem value="always">Always (even after pass)</SelectItem>
                      <SelectItem value="never">Never (one attempt only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cd">Cooldown (hours)</Label>
                  <Input id="cd" type="number" min={0} value={test.cooldownHours} onChange={(e) => update({ cooldownHours: parseInt(e.target.value) || 0 })} className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">Wait time between attempts</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4 mt-6">
            {test.questions.map((q, qi) => (
              <Card key={q.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Question {qi + 1}</h3>
                  <Button variant="ghost" size="sm" onClick={() => removeQuestion(qi)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea value={q.text} onChange={(e) => updateQ(qi, { text: e.target.value })} placeholder="Question text" rows={2} />
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQ(qi, { correctOptionIndex: oi })}
                        className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-base shrink-0 ${
                          q.correctOptionIndex === oi ? "bg-success text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                        }`}
                        aria-label={`Mark option ${oi + 1} as correct`}
                      >
                        {String.fromCharCode(65 + oi)}
                      </button>
                      <Input
                        value={opt}
                        onChange={(e) => updateQ(qi, { options: q.options.map((o, i) => (i === oi ? e.target.value : o)) })}
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                      />
                    </div>
                  ))}
                </div>
                <Textarea value={q.explanation} onChange={(e) => updateQ(qi, { explanation: e.target.value })} placeholder="Explanation (shown after submission)" rows={2} />
              </Card>
            ))}
            <Button onClick={addQuestion} variant="outline" className="w-full"><Plus className="h-4 w-4 mr-1.5" /> Add question</Button>
          </TabsContent>

          <TabsContent value="assign" className="space-y-4 mt-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold">Assign students</h3>
                  <p className="text-sm text-muted-foreground">Selected students will see this test on their dashboard once published.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={assignAll}>Select all</Button>
                  <Button variant="outline" size="sm" onClick={clearAssigned}>Clear</Button>
                </div>
              </div>
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No students registered yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {students.map((s) => {
                    const checked = test.assignedUserIds.includes(s.id);
                    return (
                      <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-base ${checked ? "border-primary/40 bg-primary/5" : "hover:bg-secondary/40"}`}>
                        <Checkbox checked={checked} onCheckedChange={() => toggleAssign(s.id)} />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{s.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4 mt-6">
            <Card className="overflow-hidden">
              <div className="px-5 py-3 border-b text-sm font-semibold">Student submissions</div>
              {submissions.length === 0 ? (
                <p className="text-sm text-muted-foreground p-6 text-center">No submissions yet.</p>
              ) : (
                <div className="divide-y">
                  {submissions
                    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
                    .map((a) => {
                      const stu = Users.byId(a.userId);
                      return (
                        <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                          <div className={`grid h-9 w-9 place-items-center rounded-lg shrink-0 ${a.passed ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                            {a.passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{stu?.name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground truncate">{stu?.email}</div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${a.passed ? "text-success" : "text-destructive"}`}>{a.score}%</div>
                            <div className="text-[10px] text-muted-foreground">{new Date(a.submittedAt).toLocaleString()}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
