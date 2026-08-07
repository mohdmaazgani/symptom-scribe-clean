import { format } from "date-fns";
import { History, Trash2, Bell, AlarmClock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useReminders, type ReminderHistoryEntry } from "@/hooks/useReminders";
import { useToast } from "@/hooks/use-toast";

function actionIcon(action: ReminderHistoryEntry["action"]) {
  if (action === "fired") return <Bell className="w-3.5 h-3.5 text-cyan-400" />;
  if (action === "snoozed") return <AlarmClock className="w-3.5 h-3.5 text-amber-400" />;
  return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
}

function actionBadge(action: ReminderHistoryEntry["action"]) {
  if (action === "fired")
    return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
  if (action === "snoozed")
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-green-500/20 text-green-400 border-green-500/30";
}

function actionLabel(entry: ReminderHistoryEntry): string {
  if (entry.action === "snoozed" && entry.snoozeMinutes) {
    return `Snoozed ${entry.snoozeMinutes}m`;
  }
  return entry.action.charAt(0).toUpperCase() + entry.action.slice(1);
}

export default function ReminderHistory() {
  const { history, clearHistory } = useReminders();
  const { toast } = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  function handleClear() {
    clearHistory();
    setShowClearConfirm(false);
    toast({ title: "History Cleared", description: "Reminder history has been cleared." });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Reminder History
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            A log of recent reminder events.
          </p>
        </div>
        {history.length > 0 && (
          <Button
            id="clear-history-btn"
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/40 hover:bg-destructive/10"
            onClick={() => setShowClearConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear History
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <History className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No history yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Reminder events will appear here once your reminders fire.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => (
            <Card key={entry.id} className="py-0">
              <CardContent className="flex items-center gap-4 py-3">
                <div className="shrink-0">{actionIcon(entry.action)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {entry.reminderLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.firedAt), "MMM d, yyyy · HH:mm")}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${actionBadge(entry.action)}`}
                >
                  {actionLabel(entry)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Reminder History?</AlertDialogTitle>
            <AlertDialogDescription>
              All reminder history entries will be permanently removed. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              id="confirm-clear-history"
              onClick={handleClear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
