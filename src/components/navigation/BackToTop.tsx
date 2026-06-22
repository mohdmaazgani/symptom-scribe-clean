import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // The app shell scrolls inside <main id="main-scroll">, falling back to the
  // window for any context where that container isn't present.
  const getScroller = (): HTMLElement | Window =>
    document.getElementById("main-scroll") ?? window;

  const getScrollTop = (scroller: HTMLElement | Window) =>
    scroller instanceof Window ? scroller.scrollY : scroller.scrollTop;

  const scrollToTop = () => {
    getScroller().scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const scroller = getScroller();
    const toggleVisibility = () => setIsVisible(getScrollTop(scroller) > 300);

    toggleVisibility();
    scroller.addEventListener("scroll", toggleVisibility);
    return () => scroller.removeEventListener("scroll", toggleVisibility);
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
