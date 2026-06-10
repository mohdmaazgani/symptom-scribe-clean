// src/pages/NotFound.tsx
// Fix #2: Styled 404 page that matches the app's design system

import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, HeartPulse } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      {/* Icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-muted shadow-soft">
        <HeartPulse className="h-10 w-10 text-primary" />
      </div>

      {/* Copy */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          404 — Page not found
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Nothing here.
        </h1>
        <p className="max-w-sm text-muted-foreground">
          The page <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground">{location.pathname}</code> doesn't exist or has been moved.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="rounded-xl">
          <Link to="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Link>
        </Button>
        <Button variant="outline" className="rounded-xl" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
