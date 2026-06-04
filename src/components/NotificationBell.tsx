import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bell, AlertCircle, Clock, CheckCircle2, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Notifier, NotificationPrefs, StudyPlans, isInQuietHours } from "@/lib/store";
import NotificationPrefsDialog from "@/components/NotificationPrefsDialog";
import { format } from "date-fns";

export default function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);

  // Refresh once a minute so "today/overdue" buckets stay accurate
  useEffect(() => {
    const i = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(i);
  }, []);

  // Subscribe to immediate notifier events (quiz pass, plan changes, etc.)
  useEffect(() => {
    const unsub = Notifier.subscribe((e) => {
      if (e.userId !== userId) return;
      const prefs = NotificationPrefs.get(userId);
      if (!prefs.channels[e.kind]) return;
      setTick((n) => n + 1);
      if (isInQuietHours(prefs)) return;
      const opts = {
        description: e.body,
        action: e.courseId
          ? {
              label: "Open",
              onClick: () => {
                window.location.href = e.unitId
                  ? `/learn/${e.courseId}?unit=${e.unitId}`
                  : `/learn/${e.courseId}`;
              },
            }
          : undefined,
      };
      if (e.kind === "overdue") toast.warning(e.title, opts);
      else if (e.kind === "completed") toast.success(e.title, opts);
      else toast(e.title, opts);
    });
    return () => { unsub(); };
  }, [userId]);

  const notifications = (() => {
    void tick;
    return StudyPlans.notifications(userId);
  })();

  const overdueCount = notifications.filter((n) => n.item.status === "overdue").length;
  const todayCount = notifications.filter((n) => n.item.status === "today").length;
  const total = notifications.length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Study reminders" className="relative">
          <Bell className="h-4 w-4" />
          {total > 0 && (
            <span
              className={
                "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full text-[10px] font-bold text-white " +
                (overdueCount > 0 ? "bg-destructive" : "bg-warning")
              }
            >
              {total > 9 ? "9+" : total}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2.5">
          <span className="font-semibold">Study reminders</span>
          {total > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              {overdueCount > 0 && `${overdueCount} overdue`}
              {overdueCount > 0 && todayCount > 0 && " · "}
              {todayCount > 0 && `${todayCount} today`}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {total === 0 ? (
          <div className="px-4 py-6 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto text-success mb-2" />
            <p className="text-sm font-medium">All caught up</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              No units due right now. Nice work!
            </p>
          </div>
        ) : (
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.map(({ courseId, courseTitle, examDate, item }) => (
              <Link
                key={`${courseId}-${item.unitId}`}
                to={`/learn/${courseId}?unit=${item.unitId}`}
                onClick={() => setOpen(false)}
                className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent transition-colors border-b border-border/40 last:border-0"
              >
                {item.status === "overdue" ? (
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                ) : (
                  <Clock className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-tight truncate">
                    Unit {item.unitOrder}. {item.unitTitle}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {courseTitle} · exam {format(new Date(examDate), "MMM d")}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    "shrink-0 text-[10px] " +
                    (item.status === "overdue"
                      ? "border-destructive/40 text-destructive"
                      : "border-warning/40 text-warning")
                  }
                >
                  {item.status === "overdue" ? "Overdue" : "Today"}
                </Badge>
              </Link>
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 flex justify-end">
          <NotificationPrefsDialog
            userId={userId}
            onSaved={() => setTick((n) => n + 1)}
            trigger={
              <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
                <Settings className="h-3.5 w-3.5" /> Preferences
              </Button>
            }
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
