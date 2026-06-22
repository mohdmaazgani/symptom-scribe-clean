import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import '../styles/animated-theme-toggler.css';

export function AnimatedThemeToggler({ className = '' }) {
  // next-themes is the single source of truth for theme state/persistence.
  // `resolvedTheme` is what's actually applied (system -> light/dark).
  const { resolvedTheme, setTheme } = useTheme();

  // next-themes' inline script sets the `dark` class on <html> before
  // React mounts (preventing a page-wide flash). Seed local mount state
  // from that class so the icon itself doesn't flash to the wrong state
  // during the brief window before `resolvedTheme` is available.
  const [mounted, setMounted] = useState(false);
  const [preMountIsDark, setPreMountIsDark] = useState(false);
  useEffect(() => {
    setPreMountIsDark(document.documentElement.classList.contains('dark'));
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : preMountIsDark;
  const duration = 400;

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const nextTheme = isDark ? 'light' : 'dark';

    const applyTheme = () => {
      // Delegate entirely to next-themes: it updates the `class`
      // attribute on <html> and writes to localStorage itself.
      setTheme(nextTheme);
    };

    if (!button) {
      applyTheme();
      return;
    }

    const { top, left, width, height } = button.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    );

    // Fallback for browsers that don't support View Transitions API
    if (typeof document.startViewTransition !== 'function') {
      applyTheme();
      return;
    }

    const transition = document.startViewTransition(() => {
      flushSync(applyTheme);
    });

    transition?.ready?.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  return (
    <button
      type="button"
      className={`animated-theme-toggler ${className}`.trim()}
      onClick={handleToggle}
      aria-label="Toggle color theme"
    >
      <span className="att-icons" aria-hidden="true">
        <span className={`att-icon att-sun ${isDark ? 'att-show' : ''}`.trim()}>
          <Sun className="h-5 w-5" />
        </span>
        <span className={`att-icon att-moon ${!isDark ? 'att-show' : ''}`.trim()}>
          <Moon className="h-5 w-5" />
        </span>
      </span>
    </button>
  );
}