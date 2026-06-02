import { Link } from "react-router-dom";
import { ArrowLeft, LucideIcon } from "lucide-react";
import PageFooter from "@/components/legal/PageFooter";

interface LegalPageLayoutProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

const LegalPageLayout = ({ title, icon: Icon, children }: LegalPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            to="/"
            aria-label="Back to Home"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-14 pb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20" aria-hidden="true">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-primary text-sm font-medium tracking-widest uppercase">Legal</p>
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">Last updated: May 2026</p>
      </div>

      {/* Page Content */}
      <div className="max-w-4xl mx-auto px-6 pb-20 space-y-6">
        {children}
      </div>

      <PageFooter />
    </div>
  );
};

export default LegalPageLayout;

