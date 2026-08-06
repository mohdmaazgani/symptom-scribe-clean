import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaPending, setMfaPending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const applyAssuranceLevel = async (nextSession: Session | null) => {
      if (!nextSession) {
        if (!isMounted) return;
        setSession(null);
        setMfaPending(false);
        setLoading(false);
        return;
      }

      // Enforce AAL2 whenever the account has a verified MFA factor. A session
      // restored from a refresh token or a new tab is only AAL1 — without this
      // check a 2FA user could reach protected pages without a second factor.
      const { data: aalData } =
        (await supabase.auth.mfa?.getAuthenticatorAssuranceLevel()) ?? { data: null };
      const pendingMfa =
        aalData?.nextLevel === "aal2" && aalData.currentLevel !== aalData.nextLevel;

      if (!isMounted) return;
      setSession(nextSession);
      setMfaPending(pendingMfa);
      setLoading(false);
    };

    const initializeSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        if (!isMounted) return;
        setAuthError(error.message);
        setLoading(false);
        return;
      }

      await applyAssuranceLevel(data.session);
    };

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setAuthError(null);
      applyAssuranceLevel(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div className="max-w-md space-y-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <h1 className="text-xl font-semibold text-foreground">Unable to verify your session</h1>
          <p className="text-sm leading-6 text-muted-foreground">{authError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (mfaPending) {
    return <Navigate to="/auth?mfa=1" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
