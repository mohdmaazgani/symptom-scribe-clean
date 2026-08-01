import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AnimatedThemeToggler } from "@/components/theme/components/AnimatedThemeToggler";
import { AccessibilityTriggerButton } from "@/components/accessibility/AccessibilityTriggerButton";
import { useAccessibility } from "@/components/accessibility/AccessibilityContext.tsx";
import { BackToTop } from "@/components/navigation/BackToTop";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { announcement } = useAccessibility();

  return (
    <SidebarProvider>
      {/* Screen Reader Announcement Live Region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <div className="min-h-screen overflow-hidden flex w-full max-w-full bg-background">
        {/* Keyboard Navigation Skip Link */}
        <a
          href="#main-scroll"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>

        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <header
            className="flex h-14 items-center justify-between border-b border-border bg-card px-4"
            role="banner"
          >
            <div className="ml-auto flex items-center"></div>

            <div className="flex items-center gap-2">
              <AccessibilityTriggerButton />
              <AnimatedThemeToggler />

              {/* ✅ Visible ONLY on mobile. Hidden on laptop/desktop. */}
              <div className="md:hidden">
                <SidebarTrigger />
              </div>
            </div>
          </header>
          <main
            id="main-scroll"
            className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4 md:p-6"
            role="main"
            tabIndex={-1}
          >
            {children}
          </main>
          <BackToTop />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
