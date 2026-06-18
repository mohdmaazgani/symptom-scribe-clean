// src/pages/NotFound.tsx
// Clean, centered, production-grade 404 page

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">

      {/* Brand */}
      <div className="mb-10">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-primary">
          Smart Health Tracker
        </h1>
        <p className="mt-3 text-base sm:text-lg text-muted-foreground tracking-wide">
          Health • AI • Wellness Platform
        </p>
      </div>

      {/* Icon */}
      <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-2xl border border-border bg-muted shadow-soft">
        <HeartPulse className="h-14 w-14 text-primary" />
      </div>

      {/* Copy */}
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          404 — Page not found
        </p>

        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          Nothing here.
        </h2>

        <p className="max-w-lg text-base sm:text-lg text-muted-foreground leading-relaxed">
          The page{" "}
          <code className="rounded bg-muted px-2 py-1 font-mono text-foreground">
            {location.pathname}
          </code>{" "}
          doesn’t exist or may have been moved.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button asChild className="rounded-xl px-6 py-5 text-base">
          <Link to="/dashboard">
            <Home className="mr-2 h-5 w-5" />
            Go to Dashboard
          </Link>
        </Button>

        <Button
          variant="outline"
          className="rounded-xl px-6 py-5 text-base"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Go back
        </Button>
      </div>
    </div>
  );
};

export default NotFound;