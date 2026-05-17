import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BackToTop } from "@/components/BackToTop";
import { ReducedMotionToggle } from "@/components/ReducedMotionToggle";


interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border flex items-center px-4 bg-card">
            <div className="font-semibold text-lg">
              Health Tracker
            </div>

            <div className="ml-auto flex items-center gap-2">
              <AnimatedThemeToggler />
              <ReducedMotionToggle />
              <SidebarTrigger />
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
        <BackToTop />
      </div>
    </SidebarProvider>
  );
};

export default Layout;
