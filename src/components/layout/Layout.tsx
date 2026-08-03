import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
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
          {/* ✅ Header only renders on mobile now — on desktop it had no content and was just leaving an empty h-14 bar at the top of every page */}
          <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
            <div className="ml-auto flex items-center">
              <SidebarTrigger />
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