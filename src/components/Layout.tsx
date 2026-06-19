import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AnimatedThemeToggler } from "@/components/AnimatedThemeToggler";
import { BackToTop } from "@/components/BackToTop";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen overflow-hidden flex w-full max-w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <header className="h-14 shrink-0 border-b border-border flex items-center px-4 bg-card min-w-0">
            <div className="font-semibold text-lg truncate">
              Health Tracker
            </div>

            <div className="ml-auto flex items-center gap-2 flex-shrink-0">
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
