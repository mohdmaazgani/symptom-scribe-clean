import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Set the top scroll coordinates to 0
  // set behavior to 'smooth'
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <div className={cn(
      "fixed bottom-8 right-8 z-50 transition-all duration-300",
      isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-50 pointer-events-none"
    )}>
      <Button
        variant="default"
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg border border-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all duration-300"
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <ArrowUp className="h-6 w-6" />
      </Button>
    </div>
  );
};
