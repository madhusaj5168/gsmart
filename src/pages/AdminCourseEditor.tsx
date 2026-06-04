import Navbar from "@/components/Navbar";
import { useNavigate, useParams } from "react-router-dom";
import { Courses } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Course, Unit } from "@/lib/seed";
import { ArrowLeft, Plus, Trash2, Mic, MicOff, Download, Bold, Italic, List, GripVertical, FileText, Image as ImageIcon, Quote, Lightbulb, FileDown, Save, Underline, Heading1, Heading2, Heading3, FileX } from "lucide-react";
import html2canvas from "html2canvas";
import { COVER_TEMPLATES, THEMES, getCover, getTheme, type CoverContext } from "@/lib/pdfPresets";
import jsPDF from "jspdf";

const blank = (createdBy: string): Course => ({
  id: `c-${Date.now()}`,
  title: "Untitled course",
  slug: `course-${Date.now()}`,
  description: "",
  category: "Web Development",
  difficulty: "Beginner",
  price: 0,
  thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
  introVideo: "",
  outcomes: [],
  prerequisites: [],
  duration: "1 hour",
  status: "draft",
  units: [],
  createdBy,
  rating: 0,
  studentsCount: 0,
  createdAt: new Date().toISOString(),
});

export default function AdminCourseEditor() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [tab, setTab] = useState("details");

  useEffect(() => {
    if (!user) return;
    if (id === "new") setCourse(blank(user.id));
    else if (id) setCourse(Courses.byId(id) || null);
  }, [id, user]);

  if (!course) return <div className="min-h-screen"><Navbar /><div className="container py-20 text-center">Loading...</div></div>;

  const save = () => {
    Courses.save(course);
    toast.success("Course saved");
    if (id === "new") nav(`/admin/courses/${course.id}`);
  };

  const update = (patch: Partial<Course>) => setCourse({ ...course, ...patch });

  const addUnit = () => {
    const order = course.units.length + 1;
    const unitId = `${course.id}-u${order}-${Date.now()}`;
    const newUnit: Unit = {
      id: unitId,
      courseId: course.id,
      order,
      title: `New Unit ${order}`,
      description: "",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      readingHtml: "<p>Add lesson content here...</p>",
      duration: "10 min",
      resources: [],
      quiz: { id: `${unitId}-quiz`, unitId, passingScore: 60, questions: [] },
    };
    update({ units: [...course.units, newUnit] });
  };

  const updateUnit = (unitId: string, patch: Partial<Unit>) => {
    update({ units: course.units.map((u) => (u.id === unitId ? { ...u, ...patch } : u)) });
  };

  const deleteUnit = (unitId: string) => {
    update({ units: course.units.filter((u) => u.id !== unitId).map((u, i) => ({ ...u, order: i + 1 })) });
  };

  const reorder = (from: number, to: number) => {
    const arr = [...course.units];
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    update({ units: arr.map((u, i) => ({ ...u, order: i + 1 })) });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => nav("/admin")}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            <h1 className="text-2xl font-bold">{id === "new" ? "Create course" : "Edit course"}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { update({ status: course.status === "published" ? "draft" : "published" }); }}>
              {course.status === "published" ? "Unpublish" : "Publish"}
            </Button>
            <Button onClick={save} className="bg-gradient-primary hover:opacity-90 shadow-glow">Save</Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="units">Units ({course.units.length})</TabsTrigger>
            <TabsTrigger value="quiz">Quiz Builder</TabsTrigger>
            <TabsTrigger value="pdf">PDF Builder</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <Card className="p-6 space-y-5 max-w-3xl">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Title</Label><Input className="mt-1.5" value={course.title} onChange={(e) => update({ title: e.target.value })} /></div>
                <div><Label>Price ($)</Label><Input className="mt-1.5" type="number" value={course.price} onChange={(e) => update({ price: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Description</Label><Textarea className="mt-1.5" rows={3} value={course.description} onChange={(e) => update({ description: e.target.value })} /></div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div><Label>Category</Label><Input className="mt-1.5" value={course.category} onChange={(e) => update({ category: e.target.value })} /></div>
                <div><Label>Difficulty</Label>
                  <Select value={course.difficulty} onValueChange={(v) => update({ difficulty: v as Course["difficulty"] })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Duration</Label><Input className="mt-1.5" value={course.duration} onChange={(e) => update({ duration: e.target.value })} /></div>
              </div>
              <div><Label>Thumbnail URL</Label><Input className="mt-1.5" value={course.thumbnail} onChange={(e) => update({ thumbnail: e.target.value })} /></div>
              <div><Label>Intro video URL</Label><Input className="mt-1.5" value={course.introVideo} onChange={(e) => update({ introVideo: e.target.value })} /></div>
              <div><Label>Learning outcomes (comma separated)</Label>
                <Input className="mt-1.5" value={course.outcomes.join(", ")} onChange={(e) => update({ outcomes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </div>
              <div><Label>Prerequisites (comma separated)</Label>
                <Input className="mt-1.5" value={course.prerequisites.join(", ")} onChange={(e) => update({ prerequisites: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="units" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">Drag to reorder. Students must pass each unit's quiz to unlock the next.</p>
              <Button onClick={addUnit} className="bg-gradient-primary"><Plus className="h-4 w-4 mr-1" /> Add unit</Button>
            </div>
            <div className="space-y-3">
              {course.units.map((u, idx) => (
                <UnitEditor key={u.id} unit={u} idx={idx} total={course.units.length}
                  onChange={(p) => updateUnit(u.id, p)}
                  onDelete={() => deleteUnit(u.id)}
                  onMove={(dir) => reorder(idx, idx + dir)}
                />
              ))}
              {course.units.length === 0 && (
                <Card className="p-12 text-center text-muted-foreground">No units yet. Click "Add unit" to start building.</Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="quiz" className="mt-6">
            <QuizBuilder course={course} onSave={(units) => update({ units })} />
          </TabsContent>

          <TabsContent value="pdf" className="mt-6">
            <PdfBuilder course={course} onSaveUnits={(units) => update({ units })} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function UnitEditor({ unit, idx, total, onChange, onDelete, onMove }:
  { unit: Unit; idx: number; total: number; onChange: (p: Partial<Unit>) => void; onDelete: () => void; onMove: (dir: number) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const [rec, setRec] = useState(false);

  useEffect(() => { if (editorRef.current) editorRef.current.innerHTML = unit.readingHtml; }, [unit.id]);

  const exec = (c: string, v?: string) => { document.execCommand(c, false, v); editorRef.current?.focus(); };

  const toggleRec = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice not supported in this browser"); return; }
    if (rec) { recRef.current?.stop(); setRec(false); return; }
    const r = new SR(); r.continuous = true; r.interimResults = false; r.lang = "en-US";
    r.onresult = (e: any) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript + " ";
      if (t) { document.execCommand("insertText", false, t); commit(); }
    };
    r.onend = () => setRec(false);
    recRef.current = r; r.start(); setRec(true);
    toast.success("Listening...");
  };

  const commit = () => { if (editorRef.current) onChange({ readingHtml: editorRef.current.innerHTML }); };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => onMove(-1)} className="h-6 w-6 p-0">↑</Button>
          <span className="text-xs font-bold">{unit.order}</span>
          <Button variant="ghost" size="sm" disabled={idx === total - 1} onClick={() => onMove(1)} className="h-6 w-6 p-0">↓</Button>
        </div>
        <div className="flex-1 space-y-3">
          <div className="grid sm:grid-cols-[1fr_120px_auto] gap-2">
            <Input value={unit.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Unit title" />
            <Input value={unit.duration} onChange={(e) => onChange({ duration: e.target.value })} placeholder="Duration" />
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </div>
          <Textarea value={unit.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Short description" rows={2} />
          <Input value={unit.videoUrl} onChange={(e) => onChange({ videoUrl: e.target.value })} placeholder="Video URL" />
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-1 p-1.5 border-b bg-secondary/40">
              <Button variant="ghost" size="sm" onClick={() => exec("bold")}><Bold className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" onClick={() => exec("italic")}><Italic className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" onClick={() => exec("insertUnorderedList")}><List className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" onClick={() => exec("formatBlock", "h3")}>H3</Button>
              <Button variant={rec ? "destructive" : "ghost"} size="sm" onClick={toggleRec} className="ml-auto gap-1.5">
                {rec ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                <span className="text-xs">{rec ? "Stop" : "Voice to text"}</span>
              </Button>
            </div>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={commit}
              onInput={commit}
              className="min-h-[120px] p-3 focus:outline-none prose prose-sm max-w-none dark:prose-invert"
            />
          </div>
          <div className="text-xs text-muted-foreground">Quiz: {unit.quiz.questions.length} questions • {unit.quiz.passingScore}% to pass</div>
        </div>
      </div>
    </Card>
  );
}

function QuizBuilder({ course, onSave }: { course: Course; onSave: (units: Unit[]) => void }) {
  const [unitId, setUnitId] = useState(course.units[0]?.id || "");
  const unit = course.units.find((u) => u.id === unitId);

  const update = (patch: Partial<Unit["quiz"]>) => {
    if (!unit) return;
    const updated = course.units.map((u) => u.id === unitId ? { ...u, quiz: { ...u.quiz, ...patch } } : u);
    onSave(updated);
  };

  const addQuestion = () => {
    if (!unit) return;
    update({
      questions: [...unit.quiz.questions, {
        id: crypto.randomUUID(), text: "New question", options: ["Option A", "Option B", "Option C", "Option D"],
        correctOptionIndex: 0, explanation: "",
      }],
    });
  };

  const updateQ = (qid: string, patch: any) => {
    if (!unit) return;
    update({ questions: unit.quiz.questions.map((q) => q.id === qid ? { ...q, ...patch } : q) });
  };

  const deleteQ = (qid: string) => {
    if (!unit) return;
    update({ questions: unit.quiz.questions.filter((q) => q.id !== qid) });
  };

  if (course.units.length === 0) return <Card className="p-8 text-center text-muted-foreground">Add units first.</Card>;
  if (!unit) return null;

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center gap-3 flex-wrap">
        <Label>Editing quiz for:</Label>
        <Select value={unitId} onValueChange={setUnitId}>
          <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
          <SelectContent>{course.units.map((u) => <SelectItem key={u.id} value={u.id}>Unit {u.order}: {u.title}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex items-center gap-2 ml-auto">
          <Label>Passing %</Label>
          <Input type="number" className="w-20" value={unit.quiz.passingScore} onChange={(e) => update({ passingScore: Number(e.target.value) })} />
          <Button onClick={addQuestion} className="bg-gradient-primary"><Plus className="h-4 w-4 mr-1" /> Question</Button>
        </div>
      </Card>
      {unit.quiz.questions.map((q, i) => (
        <Card key={q.id} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Q{i + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => deleteQ(q.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </div>
          <Textarea rows={2} value={q.text} onChange={(e) => updateQ(q.id, { text: e.target.value })} />
          <div className="grid sm:grid-cols-2 gap-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input type="radio" name={`q-${q.id}`} checked={q.correctOptionIndex === oi} onChange={() => updateQ(q.id, { correctOptionIndex: oi })} />
                <Input value={opt} onChange={(e) => {
                  const opts = [...q.options]; opts[oi] = e.target.value;
                  updateQ(q.id, { options: opts });
                }} />
              </div>
            ))}
          </div>
          <Input placeholder="Explanation" value={q.explanation} onChange={(e) => updateQ(q.id, { explanation: e.target.value })} />
        </Card>
      ))}
      {unit.quiz.questions.length === 0 && <Card className="p-8 text-center text-muted-foreground">No questions yet.</Card>}
    </div>
  );
}

function PdfBuilder({ course, onSaveUnits }: { course: Course; onSaveUnits: (units: Unit[]) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<any>(null);
  const [rec, setRec] = useState(false);
  const [unitId, setUnitId] = useState(course.units[0]?.id || "");
  const [html, setHtml] = useState("");
  const [generating, setGenerating] = useState(false);
  const [coverId, setCoverId] = useState<string>(course.units[0]?.pdfCoverTemplate || COVER_TEMPLATES[0].id);
  const [themeId, setThemeId] = useState<string>(course.units[0]?.pdfTheme || THEMES[0].id);
  const [wmEnabled, setWmEnabled] = useState<boolean>(course.units[0]?.pdfWatermark?.enabled ?? false);
  const [wmText, setWmText] = useState<string>(course.units[0]?.pdfWatermark?.text || "CONFIDENTIAL");
  const [wmOpacity, setWmOpacity] = useState<number>(course.units[0]?.pdfWatermark?.opacity ?? 0.12);
  const [wmDiagonal, setWmDiagonal] = useState<boolean>(course.units[0]?.pdfWatermark?.diagonal ?? true);
  const [pageNumStyle, setPageNumStyle] = useState<Unit["pdfPageNumberStyle"]>(course.units[0]?.pdfPageNumberStyle || "minimal");
  const unit = course.units.find((u) => u.id === unitId);
  const theme = getTheme(themeId);
  const cover = getCover(coverId);

  // Load unit content + presets when unit changes
  useEffect(() => {
    if (!unit) return;
    const initial = unit.pdfHtml || unit.readingHtml || "<p>Add lesson content...</p>";
    setHtml(initial);
    if (editorRef.current) editorRef.current.innerHTML = initial;
    setCoverId(unit.pdfCoverTemplate || COVER_TEMPLATES[0].id);
    setThemeId(unit.pdfTheme || THEMES[0].id);
    setWmEnabled(unit.pdfWatermark?.enabled ?? false);
    setWmText(unit.pdfWatermark?.text || "CONFIDENTIAL");
    setWmOpacity(unit.pdfWatermark?.opacity ?? 0.12);
    setWmDiagonal(unit.pdfWatermark?.diagonal ?? true);
    setPageNumStyle(unit.pdfPageNumberStyle || "minimal");
  }, [unitId]); // eslint-disable-line

  if (course.units.length === 0) {
    return <Card className="p-8 text-center text-muted-foreground">Add a unit first, then build its PDF lesson here.</Card>;
  }
  if (!unit) return null;

  const sync = () => { if (editorRef.current) setHtml(editorRef.current.innerHTML); };
  const exec = (c: string, v?: string) => { document.execCommand(c, false, v); editorRef.current?.focus(); sync(); };
  const insertHTML = (h: string) => { document.execCommand("insertHTML", false, h); sync(); };

  const insertCallout = () => {
    const [r, g, b] = theme.primary;
    insertHTML(
      `<div style="background:${theme.accentLight};border-left:4px solid rgb(${r},${g},${b});padding:12px 16px;border-radius:8px;margin:12px 0;color:rgb(${Math.round(r * 0.5)},${Math.round(g * 0.5)},${Math.round(b * 0.5)})">💡 <strong>Callout:</strong> Add your important note here.</div><p></p>`
    );
  };
  const insertHighlight = () => exec("hiliteColor", "#fef08a");
  const insertPageBreak = () => insertHTML(`<div data-pdf-pagebreak="true" style="border-top:2px dashed #c7d2fe;margin:24px 0;padding-top:6px;color:#6366f1;font-size:11px;text-align:center">— Page Break —</div>`);
  const insertTable = () => insertHTML(
    `<table style="border-collapse:collapse;width:100%;margin:12px 0"><thead><tr><th style="border:1px solid #e5e7eb;padding:8px;background:#f3f4f6;text-align:left">Header</th><th style="border:1px solid #e5e7eb;padding:8px;background:#f3f4f6;text-align:left">Header</th></tr></thead><tbody><tr><td style="border:1px solid #e5e7eb;padding:8px">Cell</td><td style="border:1px solid #e5e7eb;padding:8px">Cell</td></tr></tbody></table><p></p>`
  );

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error("Image too large (max 4MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => insertHTML(`<p><img src="${reader.result}" style="max-width:100%;border-radius:8px;margin:8px 0" alt="" /></p>`);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const toggleRec = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice not supported in this browser"); return; }
    if (rec) { recRef.current?.stop(); setRec(false); return; }
    const r = new SR(); r.continuous = true; r.interimResults = false; r.lang = "en-US";
    r.onresult = (e: any) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript + " ";
      if (t) insertHTML(t);
    };
    r.onend = () => setRec(false);
    recRef.current = r; r.start(); setRec(true);
    toast.success("Listening... dictate your lesson");
  };

  const saveToUnit = () => {
    const updated = course.units.map((u) => u.id === unitId ? { ...u, pdfHtml: html, pdfCoverTemplate: coverId, pdfTheme: themeId, pdfWatermark: { enabled: wmEnabled, text: wmText, opacity: wmOpacity, diagonal: wmDiagonal }, pdfPageNumberStyle: pageNumStyle } : u);
    onSaveUnits(updated);
    toast.success("Lesson PDF saved to unit");
  };

  const loadFromReading = () => {
    if (!unit) return;
    setHtml(unit.readingHtml);
    if (editorRef.current) editorRef.current.innerHTML = unit.readingHtml;
    toast.success("Loaded reading content into editor");
  };

  const clearEditor = () => {
    if (!confirm("Clear all editor content?")) return;
    setHtml("<p></p>");
    if (editorRef.current) editorRef.current.innerHTML = "<p></p>";
  };

  // Build a single styled page node and paginate by capturing it then slicing into A4 sections.
  const generate = async () => {
    if (!previewRef.current) return;
    setGenerating(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = 595;
      const pageHeight = 842;

      // ----- Cover page (theme + template) -----
      const coverCtx: CoverContext = {
        unitTitle: unit.title,
        unitOrder: unit.order,
        unitDuration: unit.duration,
        courseTitle: course.title,
        description: unit.description,
        theme,
      };
      cover.drawPdf(doc, coverCtx, pageWidth, pageHeight);

      // ----- Content pages: render HTML at fixed width, slice into pages -----
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      const contentWidthPt = pageWidth - 80; // 40pt margin each side
      const imgHeightPt = (canvas.height * contentWidthPt) / canvas.width;
      const pxPerPt = canvas.width / contentWidthPt;
      const contentPageHeightPt = pageHeight - 100; // 50pt top + 50pt bottom margin
      const sliceHeightPx = contentPageHeightPt * pxPerPt;

      let renderedPx = 0;
      while (renderedPx < canvas.height) {
        doc.addPage();
        const remaining = canvas.height - renderedPx;
        const sliceH = Math.min(sliceHeightPx, remaining);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceH;
        const ctx = pageCanvas.getContext("2d");
        if (!ctx) break;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

        const imgData = pageCanvas.toDataURL("image/jpeg", 0.92);
        const sliceHeightPt = (sliceH / pxPerPt);
        doc.addImage(imgData, "JPEG", 40, 50, contentWidthPt, sliceHeightPt);
        renderedPx += sliceH;
      }

      // ----- Watermark + footer pass (skip cover page = 1) -----
      const totalPages = doc.getNumberOfPages();
      const [tr, tg, tb] = theme.primary;
      const [mr, mg, mb] = theme.muted;
      const toRoman = (n: number) => {
        const map: [number, string][] = [[1000,"m"],[900,"cm"],[500,"d"],[400,"cd"],[100,"c"],[90,"xc"],[50,"l"],[40,"xl"],[10,"x"],[9,"ix"],[5,"v"],[4,"iv"],[1,"i"]];
        let r = ""; let v = n;
        for (const [n2, s] of map) while (v >= n2) { r += s; v -= n2; }
        return r;
      };

      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);

        // Watermark on every page (including cover) when enabled
        if (wmEnabled && wmText.trim()) {
          const anyDoc = doc as any;
          const gs = anyDoc.GState ? new anyDoc.GState({ opacity: Math.max(0.02, Math.min(0.5, wmOpacity)) }) : null;
          if (gs && anyDoc.setGState) anyDoc.setGState(gs);
          doc.setTextColor(tr, tg, tb);
          doc.setFont("helvetica", "bold");
          if (wmDiagonal) {
            doc.setFontSize(72);
            doc.text(wmText.toUpperCase(), pageWidth / 2, pageHeight / 2, { align: "center", angle: -30 } as any);
          } else {
            doc.setFontSize(56);
            doc.text(wmText.toUpperCase(), pageWidth / 2, pageHeight / 2, { align: "center" } as any);
          }
          if (gs && anyDoc.setGState) anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
          doc.setFont("helvetica", "normal");
        }

        if (p === 1) continue; // skip footer on cover

        const contentPage = p - 1;
        const contentTotal = totalPages - 1;
        const label = `Page ${contentPage} of ${contentTotal}`;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(mr, mg, mb);
        doc.text(`${course.title} — Unit ${unit.order}`, 40, pageHeight - 20);

        const cx = pageWidth - 40;
        const cy = pageHeight - 24;

        if (pageNumStyle === "minimal") {
          doc.setDrawColor(tr, tg, tb);
          doc.setLineWidth(0.6);
          doc.line(40, pageHeight - 34, pageWidth - 40, pageHeight - 34);
          doc.text(label, cx, pageHeight - 20, { align: "right" } as any);
        } else if (pageNumStyle === "pill") {
          const txt = `${contentPage} / ${contentTotal}`;
          doc.setFontSize(9);
          const tw = doc.getTextWidth(txt) + 18;
          doc.setFillColor(tr, tg, tb);
          doc.roundedRect(cx - tw, cy - 11, tw, 16, 8, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.text(txt, cx - tw / 2, cy, { align: "center" } as any);
        } else if (pageNumStyle === "dots") {
          const max = Math.min(contentTotal, 12);
          const step = 10;
          const startX = cx - (max - 1) * step;
          for (let i = 0; i < max; i++) {
            const active = i === contentPage - 1 || (contentTotal > 12 && i === max - 1 && contentPage > 12);
            if (active) doc.setFillColor(tr, tg, tb); else doc.setFillColor(mr + 80, mg + 80, mb + 80);
            doc.circle(startX + i * step, pageHeight - 22, active ? 2.6 : 1.8, "F");
          }
          doc.setTextColor(mr, mg, mb);
          doc.text(`${contentPage}/${contentTotal}`, cx, pageHeight - 34, { align: "right" } as any);
        } else if (pageNumStyle === "roman") {
          doc.setDrawColor(tr, tg, tb);
          doc.setLineWidth(0.4);
          doc.line(40, pageHeight - 34, pageWidth - 40, pageHeight - 34);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(tr, tg, tb);
          doc.text(`— ${toRoman(contentPage)} of ${toRoman(contentTotal)} —`, cx, pageHeight - 20, { align: "right" } as any);
          doc.setFont("helvetica", "normal");
        } else if (pageNumStyle === "bar") {
          const barW = pageWidth - 80;
          const pct = contentPage / contentTotal;
          doc.setFillColor(230, 230, 235);
          doc.roundedRect(40, pageHeight - 36, barW, 3, 1.5, 1.5, "F");
          doc.setFillColor(tr, tg, tb);
          doc.roundedRect(40, pageHeight - 36, Math.max(4, barW * pct), 3, 1.5, 1.5, "F");
          doc.setTextColor(mr, mg, mb);
          doc.text(label, cx, pageHeight - 20, { align: "right" } as any);
        }
      }

      const filename = `${unit.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;

      // Save the PDF object URL + presets back to the unit for student download
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const updated = course.units.map((u) => u.id === unitId
        ? { ...u, pdfHtml: html, pdfUrl: url, pdfCoverTemplate: coverId, pdfTheme: themeId,
            pdfWatermark: { enabled: wmEnabled, text: wmText, opacity: wmOpacity, diagonal: wmDiagonal },
            pdfPageNumberStyle: pageNumStyle }
        : u);
      onSaveUnits(updated);

      doc.save(filename);
      toast.success("PDF generated and downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap items-center gap-3">
        <FileText className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold leading-tight">PDF Builder</h3>
          <p className="text-xs text-muted-foreground">Author rich lesson PDFs per unit. Preview in A4 and export.</p>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <Label className="text-xs">Unit:</Label>
          <Select value={unitId} onValueChange={setUnitId}>
            <SelectTrigger className="w-72 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {course.units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  Unit {u.order}: {u.title} {u.pdfHtml ? "•" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadFromReading}>Load reading</Button>
          <Button variant="outline" size="sm" onClick={saveToUnit}><Save className="h-3.5 w-3.5 mr-1.5" />Save</Button>
          <Button onClick={generate} disabled={generating} className="bg-gradient-primary hover:opacity-90 shadow-glow">
            <FileDown className="h-4 w-4 mr-1.5" /> {generating ? "Generating..." : "Export PDF"}
          </Button>
        </div>
      </Card>

      {/* Cover & Theme pickers */}
      <Card className="p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cover template</Label>
            <span className="text-xs text-muted-foreground">{cover.hint}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {COVER_TEMPLATES.map((c) => {
              const selected = c.id === coverId;
              return (
                <button
                  key={c.id}
                  onClick={() => setCoverId(c.id)}
                  className={`text-left rounded-lg border-2 p-2 transition-base hover:border-primary/60 ${selected ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                >
                  <div className="scale-[0.55] origin-top-left h-[140px] w-[180%] -mb-12 pointer-events-none">
                    <c.Preview ctx={{
                      unitTitle: unit.title,
                      unitOrder: unit.order,
                      unitDuration: unit.duration,
                      courseTitle: course.title,
                      description: unit.description,
                      theme,
                    }} />
                  </div>
                  <div className="text-xs font-medium mt-1">{c.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Color theme</Label>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => {
              const selected = t.id === themeId;
              const [r, g, b] = t.primary;
              const [r2, g2, b2] = t.secondary;
              return (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={`flex items-center gap-2 rounded-full border-2 pl-1 pr-3 py-1 transition-base hover:border-primary/60 ${selected ? "border-primary" : "border-border"}`}
                  title={t.name}
                >
                  <span
                    className="h-6 w-6 rounded-full ring-2 ring-background"
                    style={{ background: `linear-gradient(135deg, rgb(${r},${g},${b}), rgb(${r2},${g2},${b2}))` }}
                  />
                  <span className="text-xs font-medium">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Watermark + Page numbering */}
        <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Watermark</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{wmEnabled ? "On" : "Off"}</span>
                <Switch checked={wmEnabled} onCheckedChange={setWmEnabled} />
              </div>
            </div>
            <Input
              value={wmText}
              onChange={(e) => setWmText(e.target.value)}
              placeholder="e.g. CONFIDENTIAL, DRAFT, © SequentialLearn"
              disabled={!wmEnabled}
              maxLength={40}
            />
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">Opacity</span>
                  <span className="text-[11px] font-mono text-muted-foreground">{Math.round(wmOpacity * 100)}%</span>
                </div>
                <Slider
                  value={[wmOpacity * 100]}
                  onValueChange={(v) => setWmOpacity((v[0] || 0) / 100)}
                  min={2} max={50} step={1}
                  disabled={!wmEnabled}
                />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <Switch checked={wmDiagonal} onCheckedChange={setWmDiagonal} disabled={!wmEnabled} id="wm-diag" />
                <Label htmlFor="wm-diag" className="text-xs">Diagonal</Label>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground block">Page number style</Label>
            <div className="grid grid-cols-5 gap-2">
              {([
                { id: "minimal", label: "Minimal" },
                { id: "pill", label: "Pill" },
                { id: "dots", label: "Dots" },
                { id: "roman", label: "Roman" },
                { id: "bar", label: "Bar" },
              ] as { id: NonNullable<Unit["pdfPageNumberStyle"]>; label: string }[]).map((opt) => {
                const selected = pageNumStyle === opt.id;
                const [r, g, b] = theme.primary;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPageNumStyle(opt.id)}
                    className={`rounded-md border-2 p-2 text-left transition-base hover:border-primary/60 ${selected ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                  >
                    <div className="h-8 flex items-end justify-end gap-0.5">
                      {opt.id === "minimal" && (
                        <div className="w-full">
                          <div className="h-px w-full" style={{ background: `rgb(${r},${g},${b})` }} />
                          <div className="text-[9px] text-right text-muted-foreground mt-1">3 of 8</div>
                        </div>
                      )}
                      {opt.id === "pill" && (
                        <span className="ml-auto text-[9px] text-white px-2 py-0.5 rounded-full" style={{ background: `rgb(${r},${g},${b})` }}>3/8</span>
                      )}
                      {opt.id === "dots" && (
                        <div className="flex items-center gap-1 ml-auto">
                          {[0,1,2,3,4].map((i) => (
                            <span key={i} className="rounded-full" style={{
                              width: i === 2 ? 6 : 4, height: i === 2 ? 6 : 4,
                              background: i === 2 ? `rgb(${r},${g},${b})` : "hsl(var(--muted-foreground) / 0.4)"
                            }} />
                          ))}
                        </div>
                      )}
                      {opt.id === "roman" && (
                        <div className="ml-auto text-[10px] italic" style={{ color: `rgb(${r},${g},${b})` }}>— iii of viii —</div>
                      )}
                      {opt.id === "bar" && (
                        <div className="w-full">
                          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                            <div className="h-full" style={{ width: "40%", background: `rgb(${r},${g},${b})` }} />
                          </div>
                          <div className="text-[9px] text-right text-muted-foreground mt-1">3 of 8</div>
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] font-medium mt-2">{opt.label}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cover page is never numbered. Numbering counts content pages only.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Editor */}
        <Card className="overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b bg-secondary/40 flex items-center flex-wrap gap-1">
            <Button variant="ghost" size="sm" onClick={() => exec("formatBlock", "h1")} title="Heading 1"><Heading1 className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => exec("formatBlock", "h2")} title="Heading 2"><Heading2 className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => exec("formatBlock", "h3")} title="Heading 3"><Heading3 className="h-3.5 w-3.5" /></Button>
            <div className="h-5 w-px bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={() => exec("bold")}><Bold className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => exec("italic")}><Italic className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => exec("underline")}><Underline className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={insertHighlight} title="Highlight"><span className="h-3.5 w-3.5 rounded-sm bg-yellow-300 inline-block" /></Button>
            <div className="h-5 w-px bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={() => exec("insertUnorderedList")}><List className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => exec("formatBlock", "blockquote")}><Quote className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={insertCallout} title="Themed callout"><Lightbulb className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={insertTable} title="Table">⊞</Button>
            <div className="h-5 w-px bg-border mx-1" />
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />
            <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} title="Insert image"><ImageIcon className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={insertPageBreak} title="Page break"><FileX className="h-3.5 w-3.5" /></Button>
            <Button variant={rec ? "destructive" : "ghost"} size="sm" onClick={toggleRec} className="gap-1.5">
              {rec ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              <span className="text-xs">{rec ? "Stop" : "Voice"}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={clearEditor} className="ml-auto text-destructive">Clear</Button>
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={sync}
            onBlur={sync}
            className="min-h-[520px] p-5 focus:outline-none prose prose-sm max-w-none dark:prose-invert"
          />
        </Card>

        {/* Live A4 preview */}
        <Card className="overflow-hidden flex flex-col bg-secondary/30">
          <div className="px-3 py-2 border-b bg-secondary/40 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Live A4 preview</span>
            <span className="ml-auto text-xs text-muted-foreground">{cover.name} · {theme.name}</span>
          </div>
          <div className="overflow-auto p-4 flex justify-center">
            <div className="w-full max-w-[560px]">
              {/* Cover preview (chosen template) */}
              <cover.Preview ctx={{
                unitTitle: unit.title,
                unitOrder: unit.order,
                unitDuration: unit.duration,
                courseTitle: course.title,
                description: unit.description,
                theme,
              }} />
              {/* Content preview — captured for PDF */}
              <div
                ref={previewRef}
                className="bg-white p-8 rounded-md shadow-card prose prose-sm max-w-none"
                style={{
                  minHeight: 600,
                  fontFamily: theme.bodyFont,
                  color: `rgb(${theme.ink[0]},${theme.ink[1]},${theme.ink[2]})`,
                  // Inject a themed accent for prose headings/links/blockquote via CSS variables
                  ['--tw-prose-headings' as any]: `rgb(${theme.primary[0]},${theme.primary[1]},${theme.primary[2]})`,
                  ['--tw-prose-links' as any]: `rgb(${theme.primary[0]},${theme.primary[1]},${theme.primary[2]})`,
                  ['--tw-prose-quote-borders' as any]: `rgb(${theme.primary[0]},${theme.primary[1]},${theme.primary[2]})`,
                  ['--tw-prose-bullets' as any]: `rgb(${theme.primary[0]},${theme.primary[1]},${theme.primary[2]})`,
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

