import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, isBefore, startOfDay } from "date-fns";
import { CalendarIcon, AlertCircle, CheckCircle2, Clock, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { StudyPlans } from "@/lib/store";
import type { Course } from "@/lib/seed";

interface Props {
  userId: string;
  course: Course;
  trigger: React.ReactNode;
  onChange?: () => void;
}

export default function StudyPlanDialog({ userId, course, trigger, onChange }: Props) {
  const existing = StudyPlans.find(userId, course.id);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    existing ? new Date(existing.examDate) : undefined,
  );
  const [tick, setTick] = useState(0); // forces schedule recompute after save

  const schedule = useMemo(() => {
    void tick;
    return StudyPlans.schedule(userId, course.id);
  }, [tick, userId, course.id, open]);

  const save = () => {
    if (!date) {
      toast.error("Pick an exam date first");
      return;
    }
    if (isBefore(startOfDay(date), startOfDay(new Date()))) {
      toast.error("Exam date must be in the future");
      return;
    }
    StudyPlans.upsert(userId, course.id, date.toISOString());
    setTick((t) => t + 1);
    onChange?.();
    toast.success("Study plan saved");
  };

  const remove = () => {
    StudyPlans.remove(userId, course.id);
    setDate(undefined);
    setTick((t) => t + 1);
    onChange?.();
    toast.success("Plan removed");
  };

  const grouped = useMemo(() => {
    const map = new Map<string, typeof schedule>();
    schedule.forEach((s) => {
      const arr = map.get(s.scheduledDate) || [];
      arr.push(s);
      map.set(s.scheduledDate, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  }, [schedule]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Study plan · {course.title}
          </DialogTitle>
          <DialogDescription>
            Set your exam date. We'll spread the remaining units across your prep days and remind
            you what to study each day.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Exam date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(d) => isBefore(d, startOfDay(new Date()))}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={save} className="bg-gradient-primary hover:opacity-90">
            {existing ? "Update plan" : "Create plan"}
          </Button>
          {existing && (
            <Button variant="ghost" size="icon" onClick={remove} title="Remove plan">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>

        {schedule.length > 0 ? (
          <div className="rounded-lg border border-border/60 bg-background/40">
            <div className="px-4 py-2 border-b border-border/60 flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                Day-by-day schedule
              </span>
              <span className="text-muted-foreground">
                {schedule.filter((s) => s.status === "done").length} / {schedule.length} done
              </span>
            </div>
            <ScrollArea className="max-h-[300px]">
              <ul className="divide-y divide-border/60">
                {grouped.map(([day, items]) => (
                  <li key={day} className="px-4 py-3">
                    <div className="text-xs font-medium text-muted-foreground mb-1.5">
                      {format(new Date(day), "EEE, MMM d")}
                    </div>
                    <div className="space-y-1.5">
                      {items.map((it) => (
                        <div key={it.unitId} className="flex items-center gap-2 text-sm">
                          <StatusIcon status={it.status} />
                          <span
                            className={cn(
                              "flex-1 truncate",
                              it.status === "done" && "line-through text-muted-foreground",
                            )}
                          >
                            Unit {it.unitOrder}. {it.unitTitle}
                          </span>
                          <StatusBadge status={it.status} />
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Pick an exam date to generate your study schedule.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button asChild className="bg-gradient-primary hover:opacity-90">
            <Link to={`/learn/${course.id}`}>Open course</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-success shrink-0" />;
  if (status === "overdue") return <AlertCircle className="h-4 w-4 text-destructive shrink-0" />;
  if (status === "today") return <Clock className="h-4 w-4 text-warning shrink-0" />;
  return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "done") return <Badge variant="outline" className="text-xs">Done</Badge>;
  if (status === "overdue")
    return <Badge className="text-xs bg-destructive/15 text-destructive border-destructive/30">Overdue</Badge>;
  if (status === "today")
    return <Badge className="text-xs bg-warning/15 text-warning border-warning/30">Today</Badge>;
  return <Badge variant="outline" className="text-xs">Upcoming</Badge>;
}
