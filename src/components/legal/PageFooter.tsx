import { Link } from "react-router-dom";
import { HeartPulse } from "lucide-react";

const footerLinks = [
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "Disclaimer", to: "/disclaimer" },
  { label: "Accessibility", to: "/accessibility" },
];

const PageFooter = () => (
  <footer className="border-t border-border bg-card/40">
    <div className="mx-auto flex max-w-4xl flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-center gap-3 sm:justify-start">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10"
          aria-hidden="true"
        >
          <HeartPulse className="h-4 w-4 text-primary" />
        </div>

        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold text-foreground">Symptom Scribe</p>
          <p className="text-xs text-muted-foreground">
            Health insights with clarity and care.
          </p>
        </div>
      </div>

      <nav
        aria-label="Legal footer navigation"
        className="flex flex-wrap items-center justify-center gap-2 sm:justify-end"
      >
        {footerLinks.map(({ label, to }) => (
          <Link
            key={to}
            to={to}
            aria-label={label}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  </footer>
);

export default PageFooter;