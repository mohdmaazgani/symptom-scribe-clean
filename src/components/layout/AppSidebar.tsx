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
  Trophy,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Health Assistant", url: "/ai-health-assistant", icon: Bot },
  { title: "Health Metrics", url: "/metrics", icon: Activity },
  { title: "History", url: "/history", icon: History },
  { title: "Challenges", url: "/gamification", icon: Trophy },
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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== "undefined" && window.isGameActive) {
      const confirmLeave = window.confirm(
        "Are you sure you want to leave? Your active game progress will be lost."
      );
      if (!confirmLeave) {
        e.preventDefault();
        return;
      }
      window.isGameActive = false;
    }
    handleMobileNavClick();
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

  return (
    <Sidebar collapsible="icon">
      <div className="flex h-14 items-center justify-between px-4 border-b border-border">
        <NavLink to="/" className="flex items-center" onClick={handleNavClick}>
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
          {/* ✨ updated: letter-spacing + slightly smaller weight for section label */}
          <SidebarGroupLabel className="tracking-wide text-[11px] text-sidebar-foreground/50">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {/* ✨ updated: small gap between rows so the tinted active state has breathing room */}
            <SidebarMenu className="px-1">
              {menuItems.map((item) => {
                // Active tab gets a tinted pill + left accent border. Inactive
                // items use a subtle neutral hover fade (like the Sign Out
                // button's transition-colors), distinct from the active accent.
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`py-2 rounded-md transition-colors${
                        isActive
                          ? " bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-ring"
                          : " hover:!bg-sidebar-foreground/5"
                      }`}
                    >
                      <NavLink to={item.url} end onClick={handleNavClick}>
                        <item.icon className="h-[17px] w-[17px]" />
                        {!isCollapsed && <span className="text-[13.5px]">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  {/* ✨ updated: matching rounded-md + transition-colors for consistency with nav items */}
                  <SidebarMenuButton className="rounded-md transition-colors hover:bg-destructive/10 text-destructive py-2">
                    <LogOut className="h-[17px] w-[17px]" />{" "}
                    {!isCollapsed && <span className="text-[13.5px]">Sign Out</span>}
                  </SidebarMenuButton>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle> Confirm Sign Out</AlertDialogTitle>

                    <AlertDialogDescription>
                      Are you sure you want to sign out? You will need to sign in again to access
                      your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                    <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
