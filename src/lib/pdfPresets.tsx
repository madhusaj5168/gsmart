// Cover templates and themes for the per-unit PDF builder.
// Each cover renders into a jsPDF doc (page already added) and into a React preview node.
import type jsPDF from "jspdf";

export type RGB = [number, number, number];

export interface PdfTheme {
  id: string;
  name: string;
  primary: RGB;       // main brand color (cover, headings accent)
  secondary: RGB;     // secondary gradient stop or accent
  ink: RGB;           // body text
  muted: RGB;         // captions / footer
  accentLight: string; // CSS hex/hsl for callouts in preview
  headingFont: string; // CSS font for preview content headings
  bodyFont: string;    // CSS font for preview body
}

export const THEMES: PdfTheme[] = [
  {
    id: "indigo",
    name: "Indigo",
    primary: [99, 91, 255],
    secondary: [139, 92, 246],
    ink: [24, 24, 40],
    muted: [120, 120, 140],
    accentLight: "#eef2ff",
    headingFont: "'Plus Jakarta Sans', 'Inter', sans-serif",
    bodyFont: "Inter, sans-serif",
  },
  {
    id: "emerald",
    name: "Emerald",
    primary: [16, 122, 87],
    secondary: [45, 175, 130],
    ink: [18, 36, 28],
    muted: [110, 130, 120],
    accentLight: "#ecfdf5",
    headingFont: "'Plus Jakarta Sans', 'Inter', sans-serif",
    bodyFont: "Inter, sans-serif",
  },
  {
    id: "rose",
    name: "Rose",
    primary: [225, 60, 110],
    secondary: [244, 114, 182],
    ink: [40, 18, 30],
    muted: [140, 110, 120],
    accentLight: "#fff1f5",
    headingFont: "'Plus Jakarta Sans', 'Inter', sans-serif",
    bodyFont: "Inter, sans-serif",
  },
  {
    id: "ocean",
    name: "Ocean",
    primary: [12, 90, 158],
    secondary: [45, 175, 195],
    ink: [16, 28, 44],
    muted: [110, 125, 145],
    accentLight: "#ecf6ff",
    headingFont: "'Plus Jakarta Sans', 'Inter', sans-serif",
    bodyFont: "Inter, sans-serif",
  },
  {
    id: "noir",
    name: "Noir",
    primary: [20, 20, 22],
    secondary: [60, 60, 65],
    ink: [22, 22, 22],
    muted: [120, 120, 120],
    accentLight: "#f4f4f5",
    headingFont: "'Plus Jakarta Sans', 'Inter', sans-serif",
    bodyFont: "Inter, sans-serif",
  },
  {
    id: "amber",
    name: "Amber",
    primary: [196, 110, 14],
    secondary: [234, 160, 30],
    ink: [44, 28, 12],
    muted: [140, 120, 100],
    accentLight: "#fff8eb",
    headingFont: "'Plus Jakarta Sans', 'Inter', sans-serif",
    bodyFont: "Inter, sans-serif",
  },
];

export interface CoverContext {
  unitTitle: string;
  unitOrder: number;
  unitDuration: string;
  courseTitle: string;
  description?: string;
  theme: PdfTheme;
}

export interface CoverTemplate {
  id: string;
  name: string;
  hint: string;
  drawPdf: (doc: jsPDF, ctx: CoverContext, pageWidth: number, pageHeight: number) => void;
  Preview: React.FC<{ ctx: CoverContext }>;
}

const rgb = (c: RGB, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const splitTitle = (doc: jsPDF, title: string, maxWidth: number) => doc.splitTextToSize(title, maxWidth);

import React from "react";

export const COVER_TEMPLATES: CoverTemplate[] = [
  {
    id: "gradient",
    name: "Gradient Hero",
    hint: "Vivid full-bleed gradient band",
    drawPdf: (doc, ctx, w) => {
      const { primary, secondary } = ctx.theme;
      // Simulate gradient with stacked rectangles
      const steps = 60;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const r = Math.round(primary[0] * (1 - t) + secondary[0] * t);
        const g = Math.round(primary[1] * (1 - t) + secondary[1] * t);
        const b = Math.round(primary[2] * (1 - t) + secondary[2] * t);
        doc.setFillColor(r, g, b);
        doc.rect(0, (320 / steps) * i, w, 320 / steps + 1, "F");
      }
      doc.setTextColor(255);
      doc.setFontSize(11);
      doc.text("SEQUENTIALLEARN • LESSON", 40, 60);
      doc.setFontSize(36);
      doc.setFont("helvetica", "bold");
      doc.text(splitTitle(doc, ctx.unitTitle, 480), 40, 190);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);
      doc.setTextColor(240, 240, 255);
      doc.text(ctx.courseTitle, 40, 270);
      doc.setTextColor(60);
      doc.setFontSize(11);
      doc.text(`Unit ${ctx.unitOrder} • ${ctx.unitDuration}`, 40, 360);
      if (ctx.description) {
        doc.setFontSize(12);
        doc.setTextColor(80);
        doc.text(doc.splitTextToSize(ctx.description, 515), 40, 400);
      }
    },
    Preview: ({ ctx }) => (
      <div className="rounded-md overflow-hidden mb-4 bg-white text-gray-900 shadow-sm border">
        <div
          className="p-6 text-white"
          style={{ background: `linear-gradient(135deg, ${rgb(ctx.theme.primary)}, ${rgb(ctx.theme.secondary)})` }}
        >
          <div className="text-[10px] tracking-widest opacity-80 mb-3">SEQUENTIALLEARN • LESSON</div>
          <div className="text-2xl font-bold leading-tight mb-3" style={{ fontFamily: ctx.theme.headingFont }}>{ctx.unitTitle}</div>
          <div className="text-sm opacity-90">{ctx.courseTitle}</div>
        </div>
        <div className="p-5">
          <div className="text-xs text-gray-500 mb-1">Unit {ctx.unitOrder} • {ctx.unitDuration}</div>
          <div className="text-sm text-gray-700">{ctx.description || "No description"}</div>
        </div>
      </div>
    ),
  },
  {
    id: "minimal",
    name: "Minimal Editorial",
    hint: "Thin rule, generous white space",
    drawPdf: (doc, ctx, w, h) => {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, w, h, "F");
      // Top rule
      doc.setDrawColor(...ctx.theme.primary);
      doc.setLineWidth(3);
      doc.line(40, 110, 120, 110);
      doc.setTextColor(...ctx.theme.muted);
      doc.setFontSize(10);
      doc.text(`UNIT ${ctx.unitOrder} • ${ctx.unitDuration}`, 40, 140);
      doc.setTextColor(...ctx.theme.ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(42);
      doc.text(splitTitle(doc, ctx.unitTitle, 480), 40, 260);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(...ctx.theme.muted);
      doc.text(ctx.courseTitle, 40, 330);
      if (ctx.description) {
        doc.setFontSize(12);
        doc.setTextColor(70, 70, 80);
        doc.text(doc.splitTextToSize(ctx.description, 480), 40, 390);
      }
      // Bottom mark
      doc.setDrawColor(...ctx.theme.primary);
      doc.setLineWidth(1);
      doc.line(40, h - 80, w - 40, h - 80);
      doc.setFontSize(9);
      doc.setTextColor(...ctx.theme.muted);
      doc.text("SequentialLearn", 40, h - 60);
    },
    Preview: ({ ctx }) => (
      <div className="rounded-md overflow-hidden mb-4 bg-white text-gray-900 shadow-sm border p-6">
        <div className="h-[3px] w-16 mb-5" style={{ background: rgb(ctx.theme.primary) }} />
        <div className="text-[10px] tracking-widest mb-2" style={{ color: rgb(ctx.theme.muted) }}>
          UNIT {ctx.unitOrder} • {ctx.unitDuration}
        </div>
        <div className="text-3xl font-bold leading-tight mb-3" style={{ color: rgb(ctx.theme.ink), fontFamily: ctx.theme.headingFont }}>
          {ctx.unitTitle}
        </div>
        <div className="text-sm" style={{ color: rgb(ctx.theme.muted) }}>{ctx.courseTitle}</div>
        {ctx.description && <p className="text-sm mt-3 text-gray-700">{ctx.description}</p>}
        <div className="border-t mt-6 pt-3 text-[10px]" style={{ color: rgb(ctx.theme.muted), borderColor: rgb(ctx.theme.primary, 0.4) }}>
          SequentialLearn
        </div>
      </div>
    ),
  },
  {
    id: "split",
    name: "Split Block",
    hint: "Color side panel + title block",
    drawPdf: (doc, ctx, w, h) => {
      doc.setFillColor(...ctx.theme.primary);
      doc.rect(0, 0, 200, h, "F");
      doc.setTextColor(255);
      doc.setFontSize(11);
      doc.text("LESSON", 30, 60);
      doc.setFontSize(64);
      doc.setFont("helvetica", "bold");
      doc.text(String(ctx.unitOrder).padStart(2, "0"), 30, 140);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(ctx.unitDuration, 30, 165);
      // Right block
      doc.setTextColor(...ctx.theme.ink);
      doc.setFontSize(12);
      doc.text(ctx.courseTitle.toUpperCase(), 230, 100);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(32);
      doc.text(splitTitle(doc, ctx.unitTitle, 320), 230, 180);
      doc.setFont("helvetica", "normal");
      if (ctx.description) {
        doc.setFontSize(11);
        doc.setTextColor(70, 70, 80);
        doc.text(doc.splitTextToSize(ctx.description, 320), 230, 320);
      }
    },
    Preview: ({ ctx }) => (
      <div className="rounded-md overflow-hidden mb-4 bg-white text-gray-900 shadow-sm border grid grid-cols-[35%_1fr]">
        <div className="p-5 text-white flex flex-col justify-between" style={{ background: rgb(ctx.theme.primary), minHeight: 220 }}>
          <div className="text-[10px] tracking-widest opacity-90">LESSON</div>
          <div>
            <div className="text-5xl font-extrabold leading-none" style={{ fontFamily: ctx.theme.headingFont }}>
              {String(ctx.unitOrder).padStart(2, "0")}
            </div>
            <div className="text-[11px] opacity-90 mt-1">{ctx.unitDuration}</div>
          </div>
        </div>
        <div className="p-5">
          <div className="text-[10px] tracking-widest text-gray-500 mb-2">{ctx.courseTitle.toUpperCase()}</div>
          <div className="text-xl font-bold leading-tight" style={{ color: rgb(ctx.theme.ink), fontFamily: ctx.theme.headingFont }}>
            {ctx.unitTitle}
          </div>
          {ctx.description && <p className="text-xs mt-2 text-gray-600 line-clamp-3">{ctx.description}</p>}
        </div>
      </div>
    ),
  },
  {
    id: "bold",
    name: "Bold Statement",
    hint: "Oversized typography on tinted background",
    drawPdf: (doc, ctx, w, h) => {
      const tint: RGB = [
        Math.round(ctx.theme.primary[0] * 0.1 + 245 * 0.9),
        Math.round(ctx.theme.primary[1] * 0.1 + 245 * 0.9),
        Math.round(ctx.theme.primary[2] * 0.1 + 250 * 0.9),
      ];
      doc.setFillColor(...tint);
      doc.rect(0, 0, w, h, "F");
      doc.setFillColor(...ctx.theme.primary);
      doc.circle(w - 80, 80, 50, "F");
      doc.setTextColor(...ctx.theme.muted);
      doc.setFontSize(11);
      doc.text(`UNIT ${ctx.unitOrder}`, 40, 80);
      doc.setTextColor(...ctx.theme.ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(56);
      doc.text(splitTitle(doc, ctx.unitTitle, 500), 40, 260);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(...ctx.theme.muted);
      doc.text(ctx.courseTitle, 40, 360);
      doc.setFontSize(11);
      doc.setTextColor(...ctx.theme.muted);
      doc.text(ctx.unitDuration, 40, 380);
    },
    Preview: ({ ctx }) => (
      <div
        className="rounded-md overflow-hidden mb-4 shadow-sm border p-6 relative"
        style={{ background: rgb(ctx.theme.primary, 0.06) }}
      >
        <div className="absolute top-4 right-4 h-12 w-12 rounded-full" style={{ background: rgb(ctx.theme.primary) }} />
        <div className="text-[10px] tracking-widest mb-2" style={{ color: rgb(ctx.theme.muted) }}>UNIT {ctx.unitOrder}</div>
        <div className="text-4xl font-extrabold leading-[1.05] mb-4" style={{ color: rgb(ctx.theme.ink), fontFamily: ctx.theme.headingFont }}>
          {ctx.unitTitle}
        </div>
        <div className="text-sm" style={{ color: rgb(ctx.theme.muted) }}>{ctx.courseTitle}</div>
        <div className="text-xs mt-1" style={{ color: rgb(ctx.theme.muted) }}>{ctx.unitDuration}</div>
      </div>
    ),
  },
];

export const getTheme = (id?: string) => THEMES.find((t) => t.id === id) || THEMES[0];
export const getCover = (id?: string) => COVER_TEMPLATES.find((c) => c.id === id) || COVER_TEMPLATES[0];
