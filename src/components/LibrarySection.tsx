import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Courses, Enrollments, Notes } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import {
  StickyNote,
  FileText,
  Search,
  ArrowRight,
  Download,
  Volume2,
  Mic,
  ExternalLink,
  BookOpen,
  Lock,
} from "lucide-react";
import type { Note, Unit, Course } from "@/lib/seed";

interface SavedPdf {
  course: Course;
  unit: Unit;
}

const fmt = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const htmlPreview = (html: string, max = 160) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  const txt = (div.textContent || "").replace(/\s+/g, " ").trim();
  return txt.length > max ? txt.slice(0, max) + "…" : txt;
};

export default function LibrarySection() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [openNote, setOpenNote] = useState<{
    note: Note;
    course: Course;
    unit: Unit;
  } | null>(null);

  const notes = useMemo(() => {
    if (!user) return [] as { note: Note; course: Course; unit: Unit }[];
    return Notes.all()
      .filter((n) => n.userId === user.id)
      .map((note) => {
        const course = Courses.byId(note.courseId);
        const unit = course?.units.find((u) => u.id === note.unitId);
        return course && unit ? { note, course, unit } : null;
      })
      .filter((x): x is { note: Note; course: Course; unit: Unit } => Boolean(x))
      .sort((a, b) => (a.note.updatedAt < b.note.updatedAt ? 1 : -1));
  }, [user]);

  const savedPdfs = useMemo(() => {
    if (!user) return [] as SavedPdf[];
    const enrollments = Enrollments.forUser(user.id);
    const result: SavedPdf[] = [];
    for (const e of enrollments) {
      const course = Courses.byId(e.courseId);
      if (!course) continue;
      const unlocked = new Set(e.unlockedUnits);
      for (const unit of course.units) {
        if (!unit.pdfUrl && !unit.pdfHtml) continue;
        if (!unlocked.has(unit.id)) continue;
        result.push({ course, unit });
      }
    }
    return result;
  }, [user]);

  const filteredNotes = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return notes;
    return notes.filter(
      ({ note, course, unit }) =>
        course.title.toLowerCase().includes(q) ||
        unit.title.toLowerCase().includes(q) ||
        htmlPreview(note.htmlContent, 9999).toLowerCase().includes(q)
    );
  }, [notes, query]);

  const filteredPdfs = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return savedPdfs;
    return savedPdfs.filter(
      ({ course, unit }) =>
        course.title.toLowerCase().includes(q) || unit.title.toLowerCase().includes(q)
    );
  }, [savedPdfs, query]);

  const audioCount = notes.filter((n) => n.note.audioUrl).length;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold">My library</h2>
          <p className="text-sm text-muted-foreground">
            Voice & text notes, audio recordings, and saved unit PDFs from your courses.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <StickyNote className="h-3.5 w-3.5" /> {notes.length} notes
          </span>
          <span className="inline-flex items-center gap-1">
            <Volume2 className="h-3.5 w-3.5" /> {audioCount} audio
          </span>
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" /> {savedPdfs.length} PDFs
          </span>
        </div>
      </div>

      <Card className="p-4 md:p-5 bg-gradient-card border-border/60 shadow-card">
        <Tabs defaultValue="notes" className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <TabsList>
              <TabsTrigger value="notes" className="gap-1.5">
                <StickyNote className="h-3.5 w-3.5" /> Notes
              </TabsTrigger>
              <TabsTrigger value="pdfs" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Saved PDFs
              </TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search library..."
                className="pl-8 h-9"
              />
            </div>
          </div>

          {/* Notes */}
          <TabsContent value="notes" className="mt-0">
            {filteredNotes.length === 0 ? (
              <EmptyState
                icon={<StickyNote className="h-10 w-10 text-muted-foreground" />}
                title={notes.length === 0 ? "No notes yet" : "No matches"}
                description={
                  notes.length === 0
                    ? "Open any unit and use the Notemaker to write or dictate notes. Audio recordings will appear here too."
                    : "Try a different search term."
                }
                cta={notes.length === 0 ? { to: "/dashboard", label: "Go to my courses" } : undefined}
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredNotes.slice(0, 9).map(({ note, course, unit }) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setOpenNote({ note, course, unit })}
                    className="text-left rounded-lg border border-border/60 bg-background/60 p-4 hover:border-primary/60 hover:shadow-card transition-base group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                          {course.title}
                        </div>
                        <div className="font-semibold text-sm truncate group-hover:text-primary transition-base">
                          {unit.title}
                        </div>
                      </div>
                      {note.audioUrl && (
                        <Badge variant="secondary" className="gap-1 text-[10px] shrink-0">
                          <Mic className="h-3 w-3" />
                          {note.audioDurationSec ? fmt(note.audioDurationSec) : "audio"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3em]">
                      {htmlPreview(note.htmlContent) || "Empty note"}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(note.updatedAt)}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-base" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PDFs */}
          <TabsContent value="pdfs" className="mt-0">
            {filteredPdfs.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-10 w-10 text-muted-foreground" />}
                title={savedPdfs.length === 0 ? "No saved PDFs yet" : "No matches"}
                description={
                  savedPdfs.length === 0
                    ? "Unit PDFs created by instructors will appear here once their unit is unlocked. Open a unit to view and download the lesson PDF."
                    : "Try a different search term."
                }
                cta={savedPdfs.length === 0 ? { to: "/courses", label: "Browse courses" } : undefined}
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPdfs.slice(0, 9).map(({ course, unit }) => (
                  <Card
                    key={unit.id}
                    className="overflow-hidden bg-background/60 border-border/60 hover:shadow-card transition-base group"
                  >
                    <div className="aspect-[4/3] relative bg-gradient-to-br from-primary/15 via-accent/10 to-background flex flex-col items-center justify-center p-4">
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-[10px]">
                          Unit {unit.order}
                        </Badge>
                      </div>
                      <FileText className="h-10 w-10 text-primary mb-2" />
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Lesson PDF
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                        {course.title}
                      </div>
                      <div className="font-semibold text-sm truncate mb-3">{unit.title}</div>
                      <div className="flex gap-2">
                        {unit.pdfUrl ? (
                          <Button asChild size="sm" variant="outline" className="flex-1">
                            <a href={unit.pdfUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="flex-1" disabled>
                            <Lock className="h-3.5 w-3.5 mr-1" /> Not exported
                          </Button>
                        )}
                        <Button asChild size="sm" className="bg-gradient-primary hover:opacity-90 shrink-0">
                          <Link to={`/learn/${course.id}`} title="Open in player">
                            <BookOpen className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Note viewer dialog */}
      <Dialog open={!!openNote} onOpenChange={(o) => !o && setOpenNote(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          {openNote && (
            <>
              <DialogHeader>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {openNote.course.title} · Unit {openNote.unit.order}
                </div>
                <DialogTitle className="text-xl">{openNote.unit.title}</DialogTitle>
                <div className="text-xs text-muted-foreground">
                  Last updated {formatDate(openNote.note.updatedAt)}
                </div>
              </DialogHeader>

              {openNote.note.audioUrl && (
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3 flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary shrink-0">
                    <Volume2 className="h-4 w-4" />
                  </div>
                  <audio controls src={openNote.note.audioUrl} className="h-9 flex-1 min-w-0" />
                  {openNote.note.audioDurationSec && (
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                      {fmt(openNote.note.audioDurationSec)}
                    </span>
                  )}
                </div>
              )}

              <div
                className="flex-1 overflow-auto prose prose-sm dark:prose-invert max-w-none rounded-lg border border-border/60 bg-background/60 p-4"
                dangerouslySetInnerHTML={{ __html: openNote.note.htmlContent }}
              />

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t">
                {openNote.note.audioUrl && (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={openNote.note.audioUrl}
                      download={`audio-note-${openNote.unit.title.replace(/\s+/g, "-").toLowerCase()}.webm`}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> Download audio
                    </a>
                  </Button>
                )}
                <Button asChild className="bg-gradient-primary hover:opacity-90">
                  <Link to={`/learn/${openNote.course.id}`}>
                    Open in player <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function EmptyState({
  icon,
  title,
  description,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta?: { to: string; label: string };
}) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-background/40 p-10 text-center">
      <div className="flex justify-center mb-3">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">{description}</p>
      {cta && (
        <Button asChild variant="outline">
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}
