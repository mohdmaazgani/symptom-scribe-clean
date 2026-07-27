import { useEffect, useRef } from "react";

export function useFocusTrap(active = true) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;

      // Find all focusable elements inside the container
      const focusableSelector =
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const allFocusable = Array.from(
        container.querySelectorAll(focusableSelector)
      ) as HTMLElement[];

      // Filter out elements that are disabled or hidden
      const focusableElements = allFocusable.filter((el) => {
        const style = window.getComputedStyle(el);
        const isVisible =
          el.offsetWidth > 0 &&
          el.offsetHeight > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none";
        const isNotDisabled =
          !el.hasAttribute("disabled") &&
          !("disabled" in el && (el as unknown as { disabled: boolean }).disabled === true);
        return isVisible && isNotDisabled;
      });

      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab (Backward)
        if (activeElement === firstElement || !focusableElements.includes(activeElement)) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab (Forward)
        if (activeElement === lastElement || !focusableElements.includes(activeElement)) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    // Initial focus: Focus the first focusable element inside the modal on open
    const focusTimer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const focusableSelector =
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const allFocusable = Array.from(
        container.querySelectorAll(focusableSelector)
      ) as HTMLElement[];

      const focusableElements = allFocusable.filter((el) => {
        const style = window.getComputedStyle(el);
        const isVisible =
          el.offsetWidth > 0 &&
          el.offsetHeight > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none";
        const isNotDisabled =
          !el.hasAttribute("disabled") &&
          !("disabled" in el && (el as unknown as { disabled: boolean }).disabled === true);
        return isVisible && isNotDisabled;
      });

      if (focusableElements.length > 0) {
        if (!container.contains(document.activeElement)) {
          focusableElements[0].focus();
        }
      }
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      clearTimeout(focusTimer);
    };
  }, [active]);

  return containerRef;
}
