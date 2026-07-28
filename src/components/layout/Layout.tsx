import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AnimatedThemeToggler } from "@/components/theme/components/AnimatedThemeToggler";
import { BackToTop } from "@/components/navigation/BackToTop";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen overflow-hidden flex w-full max-w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
            <div className="ml-auto flex items-center"></div>

            <div className="flex items-center gap-2">
              <AnimatedThemeToggler />

              {/* ✅ Visible ONLY on mobile. Hidden on laptop/desktop. */}
              <div className="md:hidden">
                <SidebarTrigger />
              </div>
            </div>
          </header>
          <main id="main-scroll" className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
          <BackToTop />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
