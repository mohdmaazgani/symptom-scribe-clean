import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Subscribe to auth events BEFORE resolving the initial session so no
    // event (INITIAL_SESSION / SIGNED_IN / ...) can be missed while the
    // snapshot is being loaded. The listener is the single source of truth
    // for the session state; relying on a getSession() snapshot alone can
    // leave the provider with a stale (null) session right after sign-in,
    // which bounces ProtectedRoute back to /auth (issue #1192).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      setInitialized(true);
    });

    // Fallback for the edge case where the initial event has not been
    // delivered yet (e.g. a session restored from storage). Publishes the
    // persisted session so `loading` resolves promptly, and never writes a
    // stale `null` over state the listener has already published.
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted || !data.session) return;

      setSession(data.session);
      setUser(data.session.user ?? null);
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};