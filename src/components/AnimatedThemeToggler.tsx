import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { Sun, Moon } from 'lucide-react';
import { getSafeLocalStorage, setSafeLocalStorage } from '@/lib/storage';
import './animated-theme-toggler.css';

export function AnimatedThemeToggler({ className = '' }) {
  const [theme, setTheme] = useState(() => {
    return getSafeLocalStorage('theme', 'light');
  });

  const isDark = theme === 'dark';
  const duration = 400;

  useEffect(() => {
    // Initial theme setup on mount without animation
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.dataset.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.dataset.theme = 'light';
    }
  }, []); // Run only once to apply existing theme on mount

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const nextTheme = isDark ? 'light' : 'dark';

    const applyTheme = () => {
      setTheme(nextTheme);
      setSafeLocalStorage('theme', nextTheme);

      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.dataset.theme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.dataset.theme = 'light';
      }
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
