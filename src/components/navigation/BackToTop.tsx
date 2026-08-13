import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const scrollerRef = useRef<HTMLElement | Window | null>(null);

  // The app shell scrolls inside <main id="main-scroll">, falling back to the
  // window for any context where that container isn't present.
  const getScroller = useCallback((): HTMLElement | Window =>
    document.getElementById("main-scroll") ?? window,
  []);

  const getScrollTop = useCallback((scroller: HTMLElement | Window) =>
    scroller instanceof Window ? scroller.scrollY : scroller.scrollTop,
  []);

  const scrollToTop = () => {
    getScroller().scrollTo({ top: 0, behavior: "smooth" });
  };

 useEffect(() => {
  scrollerRef.current = getScroller();

  const toggleVisibility = () => {
    if (scrollerRef.current) {
      setIsVisible(getScrollTop(scrollerRef.current) > 300);
    }
  };

  toggleVisibility();

  scrollerRef.current?.addEventListener("scroll", toggleVisibility);

  return () => {
    scrollerRef.current?.removeEventListener("scroll", toggleVisibility);
  };
}, [getScroller, getScrollTop]);

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
