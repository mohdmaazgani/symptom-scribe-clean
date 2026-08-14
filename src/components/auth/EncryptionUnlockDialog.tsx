import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  subscribeEncryptionLock,
  unlockEncryptionWithPassword,
} from "@/lib/encryption";

/**
 * App-level dialog shown whenever a session exists but no persisted master
 * seed is available (issue #1056). Keys must never be derived from public
 * material (e.g. the user id), so the user is asked to re-enter their
 * password, which re-derives and persists the seed. Pre-seed records are
 * migrated onto the new key during the unlock.
 *
 * The dialog is intentionally non-dismissible: while the keys are locked the
 * app cannot read or write encrypted data.
 */
export default function EncryptionUnlockDialog() {
  const [locked, setLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeEncryptionLock(setLocked), []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await unlockEncryptionWithPassword(password);
      if (!result.ok) {
        setError(result.error ?? "Failed to unlock your data.");
        return;
      }
      setPassword("");
    } catch {
      setError("Failed to unlock your data. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Escape hatch for users who forgot their password: signing out clears the
  // session, which dismisses the lock and returns them to the sign-in page
  // (they can reset the password from there).
  const handleSignOut = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await supabase.auth.signOut();
    } catch {
      setError("Failed to sign out. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={locked} onOpenChange={() => {}}>
      <DialogContent
        hideCloseButton
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Unlock your encrypted data
          </DialogTitle>
          <DialogDescription>
            Your encryption key isn&apos;t available on this device. Enter your
            account password to re-derive it and continue securely. Your data
            never leaves this browser.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unlock-password">Password</Label>
            <Input
              id="unlock-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={submitting}
              required
            />
          </div>
          {error && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !password}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unlocking...
              </>
            ) : (
              "Unlock"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleSignOut}
            disabled={submitting}
          >
            {submitting ? "Signing out..." : "Forgot your password? Sign out"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
