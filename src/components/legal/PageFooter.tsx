import { Link } from "react-router-dom";

const PageFooter = () => (
  <div className="border-t border-border">
    <div className="max-w-4xl mx-auto px-6 py-6 flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
      {[
        { label: "Privacy", to: "/privacy" },
        { label: "Terms", to: "/terms" },
        { label: "Disclaimer", to: "/disclaimer" },
        { label: "Accessibility", to: "/accessibility" },
      ].map(({ label, to }) => (
        <Link
          key={to}
          to={to}
          aria-label={label}
          className="hover:text-primary transition-colors"
        >
          {label}
        </Link>
      ))}
    </div>
  </div>
);

export default PageFooter;

