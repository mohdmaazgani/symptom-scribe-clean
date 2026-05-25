import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BackToTop } from "@/components/BackToTop";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Removed the entire header */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
          <BackToTop />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;