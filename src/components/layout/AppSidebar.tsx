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
  Palette,
  PanelLeftClose,
  Check,
} from "lucide-react";

import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import EmergencyQuickAccess from "@/components/layout/EmergencyQuickAccess";
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

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "cosmic", label: "Cosmic" },
  { value: "deep-blue", label: "Deep Blue" },
  { value: "forest", label: "Forest" },
  { value: "orange", label: "Orange" },
  { value: "pastel-pink", label: "Pastel Pink" },
];

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [themesOpen, setThemesOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isCollapsed = state === "collapsed";
  const themePopupRef = useRef<HTMLDivElement>(null);
  const themeTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Close the theme popup when clicking outside of it (but not when clicking the trigger, which toggles it itself)
  useEffect(() => {
    if (!themesOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        themePopupRef.current &&
        !themePopupRef.current.contains(target) &&
        themeTriggerRef.current &&
        !themeTriggerRef.current.contains(target)
      ) {
        setThemesOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [themesOpen]);

  const activeTheme = mounted ? (resolvedTheme ?? theme ?? "light") : "light";

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
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`py-2 transition-all duration-300 ease-in-out hover:scale-[1.03] hover:-translate-y-1 hover:shadow-md${
                        isActive
                          ? " bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-ring rounded-md"
                          : ""
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

              <SidebarMenuItem>
                <SidebarMenuButton
                  ref={themeTriggerRef}
                  onClick={() => setThemesOpen((prev) => !prev)}
                  className="py-2 transition-all duration-300 ease-in-out hover:scale-[1.03] hover:-translate-y-1 hover:shadow-md"
                  aria-label="Themes"
                >
                  <Palette className="h-[17px] w-[17px]" />
                  {!isCollapsed && <span className="text-[13.5px]">Themes</span>}
                  {!isCollapsed && (
                    <span className="ml-auto text-muted-foreground">
                      <PanelLeftClose className="h-4 w-4" />
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
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
      <SidebarFooter className="px-1 border-t border-sidebar-border/20 pt-2">
        <EmergencyQuickAccess />
      </SidebarFooter>
      {!isCollapsed &&
        themesOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={themePopupRef}
            className="fixed top-[5.5rem] z-[999] hidden h-auto w-56 rounded-2xl border border-border bg-popover p-3 shadow-lg md:block"
            style={{ left: 272 }}
          >
            <div className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Themes
            </div>
            <div className="flex flex-col gap-1.5">
              {themeOptions.map((option) => {
                const isActive = activeTheme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    aria-label={option.label}
                  >
                    <span>{option.label}</span>
                    {isActive ? <Check className="h-4 w-4" /> : null}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </Sidebar>
  );
}