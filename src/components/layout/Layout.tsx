import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AnimatedThemeToggler } from "@/components/theme/components/AnimatedThemeToggler";
import { BackToTop } from "@/components/navigation/BackToTop";
import { useLocation, useNavigate } from "react-router-dom";
import { Bot } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide FAB if user is already on the AI Health Assistant page
  const showFab = location.pathname !== "/ai-health-assistant";

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

          {/* AI Health Assistant Floating Action Button (FAB) */}
          {showFab && (
            <button
              onClick={() => navigate("/ai-health-assistant")}
              className="fixed bottom-6 right-6 z-50 group flex items-center gap-2.5 bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white rounded-full p-4 shadow-lg shadow-teal-500/25 transition-all duration-300 hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer"
              aria-label="Open AI Health Assistant"
            >
              <div className="relative flex items-center justify-center">
                <Bot className="w-5.5 h-5.5" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
                </span>
              </div>

              {/* Slide-out text label on hover */}
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap text-sm font-semibold pr-1">
                Ask AI Assistant
              </span>
            </button>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
