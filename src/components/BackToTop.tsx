import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Priority: use the scroll container in Layout (if present), falls back to window
      const container = document.querySelector('main.overflow-auto');
      const scrollY = container ? container.scrollTop : window.scrollY;
      
      if (scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Attach listeners to both window and the main container
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    
    // Also check the specific container used in Layout.tsx
    const container = document.querySelector('main.overflow-auto');
    if (container) {
      container.addEventListener("scroll", toggleVisibility, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      if (container) {
        container.removeEventListener("scroll", toggleVisibility);
      }
    };
  }, []);

  const scrollToTop = () => {
    const container = document.querySelector('main.overflow-auto');
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 z-50 rounded-full shadow-lg transition-all duration-300 transform",
        isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-90 pointer-events-none"
      )}
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      <ChevronUp className="h-5 w-5" />
    </Button>
  );
};
