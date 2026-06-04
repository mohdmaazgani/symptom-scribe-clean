import {
  LayoutDashboard,
  MessageSquare,
  Activity,
  History,
  User,
  Phone,
  LogOut,
  Brain,
  Sparkles,
  Settings,
  Bot,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Health Assistant", url: "/ai-health-assistant", icon: Bot },
  { title: "Health Metrics", url: "/metrics", icon: Activity },
  { title: "History", url: "/history", icon: History },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Emergency", url: "/emergency", icon: Phone },
  { title: "Brain Games", url: "/brain-games", icon: Brain },
  { title: "Health Facts", url: "/health-facts", icon: Sparkles },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isCollapsed = state === "collapsed";

  const handleMobileNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50";

  return (
    <Sidebar collapsible="icon">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <NavLink to="/" className="flex items-center" onClick={handleMobileNavClick}>
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-sidebar-foreground cursor-pointer">
              Health Tracker
            </h2>
          )}
        </NavLink>

        {/* ✅ Hidden on mobile, visible on laptop/desktop */}
        <div className="hidden md:block">
          <SidebarTrigger />
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls} onClick={handleMobileNavClick}>
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleSignOut}
                  className="hover:bg-destructive/10 text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                  {!isCollapsed && <span>Sign Out</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
