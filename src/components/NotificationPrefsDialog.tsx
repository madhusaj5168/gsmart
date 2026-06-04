import { useState } from "react";
import { Settings, AlertCircle, Clock, CheckCircle2, Moon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { NotificationPrefs } from "@/lib/store";

interface Props {
  userId: string;
  trigger?: React.ReactNode;
  onSaved?: () => void;
}

export default function NotificationPrefsDialog({ userId, trigger, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(() => NotificationPrefs.get(userId));

  const save = () => {
    NotificationPrefs.set(userId, {
      channels: prefs.channels,
      quietHours: prefs.quietHours,
    });
    toast.success("Notification preferences saved");
    onSaved?.();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setPrefs(NotificationPrefs.get(userId));
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" /> Preferences
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Notification preferences</DialogTitle>
          <DialogDescription>
            Choose which study reminders you want, and set quiet hours to mute toasts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Reminder types
          </h4>
          <PrefRow
            icon={<Clock className="h-4 w-4 text-warning" />}
            label="Due today"
            description="Units scheduled for today"
            checked={prefs.channels.today}
            onChange={(v) =>
              setPrefs({ ...prefs, channels: { ...prefs.channels, today: v } })
            }
          />
          <PrefRow
            icon={<AlertCircle className="h-4 w-4 text-destructive" />}
            label="Overdue"
            description="Units past their scheduled date"
            checked={prefs.channels.overdue}
            onChange={(v) =>
              setPrefs({ ...prefs, channels: { ...prefs.channels, overdue: v } })
            }
          />
          <PrefRow
            icon={<CheckCircle2 className="h-4 w-4 text-success" />}
            label="Unit completed"
            description="Confirmation when you pass a unit quiz"
            checked={prefs.channels.completed}
            onChange={(v) =>
              setPrefs({ ...prefs, channels: { ...prefs.channels, completed: v } })
            }
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Quiet hours</Label>
                <p className="text-xs text-muted-foreground">Mute toast pop-ups during this window</p>
              </div>
            </div>
            <Switch
              checked={prefs.quietHours.enabled}
              onCheckedChange={(v) =>
                setPrefs({ ...prefs, quietHours: { ...prefs.quietHours, enabled: v } })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Start</Label>
              <Input
                type="time"
                value={prefs.quietHours.start}
                disabled={!prefs.quietHours.enabled}
                onChange={(e) =>
                  setPrefs({ ...prefs, quietHours: { ...prefs.quietHours, start: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">End</Label>
              <Input
                type="time"
                value={prefs.quietHours.end}
                disabled={!prefs.quietHours.enabled}
                onChange={(e) =>
                  setPrefs({ ...prefs, quietHours: { ...prefs.quietHours, end: e.target.value } })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} className="bg-gradient-primary hover:opacity-90">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrefRow({
  icon, label, description, checked, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="mt-0.5">{icon}</div>
        <div className="min-w-0">
          <div className="text-sm font-medium leading-tight">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
