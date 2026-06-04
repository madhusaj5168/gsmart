import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Download, Save, Clock, Bold, Italic, List, Highlighter, Circle, Square, Trash2 } from "lucide-react";
import { Notes } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface Props {
  courseId: string;
  unitId: string;
  unitTitle: string;
  getVideoTime?: () => number;
}

// Minimal SpeechRecognition typing
type SR = any;

export default function Notemaker({ courseId, unitId, unitTitle, getVideoTime }: Props) {
  const { user } = useAuth();
  const editorRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SR>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recStartRef = useRef<number>(0);
  const [recording, setRecording] = useState(false);
  const [audioRecording, setAudioRecording] = useState(false);
  const [audioElapsed, setAudioElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [audioDuration, setAudioDuration] = useState<number | undefined>(undefined);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    if (!user || !editorRef.current) return;
    const existing = Notes.find(user.id, courseId, unitId);
    editorRef.current.innerHTML = existing?.htmlContent || `<p>Start taking notes for <strong>${unitTitle}</strong>...</p>`;
    setAudioUrl(existing?.audioUrl);
    setAudioDuration(existing?.audioDurationSec);
  }, [user, courseId, unitId, unitTitle]);

  // Audio elapsed timer
  useEffect(() => {
    if (!audioRecording) return;
    const t = setInterval(() => setAudioElapsed(Math.floor((Date.now() - recStartRef.current) / 1000)), 250);
    return () => clearInterval(t);
  }, [audioRecording]);

  // Auto-save (debounced) — content
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      if (editorRef.current && !saved) {
        Notes.save({ userId: user.id, courseId, unitId, htmlContent: editorRef.current.innerHTML });
        setSaved(true);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [saved, user, courseId, unitId]);

  const handleInput = () => setSaved(false);

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    setSaved(false);
  };

  const insertHTML = (html: string) => {
    document.execCommand("insertHTML", false, html);
    setSaved(false);
  };

  const toggleRecord = () => {
    const SpeechRecognition: SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input not supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const r = new SpeechRecognition();
    r.continuous = true;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (e: any) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) txt += e.results[i][0].transcript + " ";
      }
      if (txt) insertHTML(txt);
    };
    r.onerror = () => { setRecording(false); toast.error("Voice input error"); };
    r.onend = () => setRecording(false);
    recognitionRef.current = r;
    r.start();
    setRecording(true);
    toast.success("Listening... speak naturally");
  };

  const toggleAudioRec = async () => {
    if (audioRecording) {
      mediaRecRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Microphone not available in this browser");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const dur = Math.max(1, Math.round((Date.now() - recStartRef.current) / 1000));
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setAudioUrl(dataUrl);
          setAudioDuration(dur);
          if (user && editorRef.current) {
            Notes.save({
              userId: user.id,
              courseId,
              unitId,
              htmlContent: editorRef.current.innerHTML,
              audioUrl: dataUrl,
              audioDurationSec: dur,
            });
            setSaved(true);
            toast.success("Audio note saved");
          }
        };
        reader.readAsDataURL(blob);
        setAudioRecording(false);
        setAudioElapsed(0);
      };
      mediaRecRef.current = mr;
      recStartRef.current = Date.now();
      mr.start();
      setAudioRecording(true);
      toast.success("Recording audio note...");
    } catch (err) {
      console.error(err);
      toast.error("Microphone permission denied");
    }
  };

  const deleteAudio = () => {
    if (!user || !editorRef.current) return;
    if (!confirm("Delete the recorded audio for this note?")) return;
    setAudioUrl(undefined);
    setAudioDuration(undefined);
    // Persist a save with audio cleared by saving fresh fields explicitly
    const existing = Notes.find(user.id, courseId, unitId);
    if (existing) {
      const cleared = { ...existing, audioUrl: undefined, audioDurationSec: undefined, htmlContent: editorRef.current.innerHTML, updatedAt: new Date().toISOString() };
      // Write directly through Notes.save by passing undefineds — but Notes.save falls back to existing, so wipe manually
      const all = Notes.all().filter((n) => n.id !== existing.id);
      localStorage.setItem("lms.notes", JSON.stringify([...all, cleared]));
    }
    toast.success("Audio removed");
  };

  const addTimestamp = () => {
    const t = getVideoTime?.() || 0;
    const mm = Math.floor(t / 60).toString().padStart(2, "0");
    const ss = Math.floor(t % 60).toString().padStart(2, "0");
    insertHTML(`<span style="display:inline-block;background:hsl(var(--primary)/.12);color:hsl(var(--primary));padding:2px 8px;border-radius:6px;font-size:12px;font-weight:600;margin-right:6px">⏱ ${mm}:${ss}</span> `);
  };

  const exportPDF = () => {
    if (!editorRef.current) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const text = editorRef.current.innerText;
    doc.setFontSize(18);
    doc.text(`Notes — ${unitTitle}`, 40, 50);
    doc.setFontSize(11);
    doc.setTextColor(80);
    const lines = doc.splitTextToSize(text, 515);
    doc.text(lines, 40, 80);
    doc.save(`notes-${unitTitle.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    toast.success("Notes exported as PDF");
  };

  const saveNow = () => {
    if (!user || !editorRef.current) return;
    Notes.save({
      userId: user.id,
      courseId,
      unitId,
      htmlContent: editorRef.current.innerHTML,
      audioUrl,
      audioDurationSec: audioDuration,
    });
    setSaved(true);
    toast.success("Notes saved");
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-card">
        <Button variant="ghost" size="sm" onClick={() => exec("bold")} aria-label="Bold"><Bold className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="sm" onClick={() => exec("italic")} aria-label="Italic"><Italic className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="sm" onClick={() => exec("insertUnorderedList")} aria-label="Bulleted list"><List className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="sm" onClick={() => exec("hiliteColor", "#fef08a")} aria-label="Highlight"><Highlighter className="h-3.5 w-3.5" /></Button>
        <div className="h-5 w-px bg-border mx-1" />
        <Button variant="ghost" size="sm" onClick={addTimestamp} className="gap-1.5" aria-label="Insert video timestamp"><Clock className="h-3.5 w-3.5" /><span className="text-xs">Stamp</span></Button>
        <Button variant={recording ? "destructive" : "ghost"} size="sm" onClick={toggleRecord} className="gap-1.5" aria-label={recording ? "Stop voice to text" : "Start voice to text"}>
          {recording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          <span className="text-xs">{recording ? "Stop" : "Voice→Text"}</span>
        </Button>
        <Button variant={audioRecording ? "destructive" : "ghost"} size="sm" onClick={toggleAudioRec} className="gap-1.5" aria-label={audioRecording ? "Stop audio recording" : "Record audio note"}>
          {audioRecording ? <Square className="h-3.5 w-3.5 fill-current" /> : <Circle className="h-3.5 w-3.5 fill-current text-destructive" />}
          <span className="text-xs">{audioRecording ? `Stop ${fmt(audioElapsed)}` : "Record audio"}</span>
        </Button>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{saved ? "Saved" : "Saving..."}</span>
          <Button variant="ghost" size="sm" onClick={saveNow} aria-label="Save notes"><Save className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={exportPDF} aria-label="Export notes as PDF"><Download className="h-3.5 w-3.5" /></Button>
        </div>
      </div>


      {audioUrl && (
        <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
          <audio controls src={audioUrl} className="h-8 flex-1 min-w-0" />
          {audioDuration && <span className="text-[11px] text-muted-foreground font-mono">{fmt(audioDuration)}</span>}
          <Button variant="ghost" size="sm" onClick={deleteAudio} className="text-destructive shrink-0" aria-label="Delete audio note">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
        className="flex-1 overflow-auto p-4 focus:outline-none prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold"
      />
    </div>
  );
}
