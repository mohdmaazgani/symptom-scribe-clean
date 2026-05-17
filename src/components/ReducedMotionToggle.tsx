import { useEffect, useState } from 'react';

export function ReducedMotionToggle() {
  const [reduceMotion, setReduceMotion] = useState(() => {
    const stored = localStorage.getItem('reduceMotion');
    return stored === 'true' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Apply/remove class on <html> element
  useEffect(() => {
    const html = document.documentElement;
    if (reduceMotion) {
      html.classList.add('reduced-motion');
    } else {
      html.classList.remove('reduced-motion');
    }
    localStorage.setItem('reduceMotion', reduceMotion.toString());
  }, [reduceMotion]);

  const toggle = () => setReduceMotion((prev) => !prev);

  return (
    <label className="flex items-center gap-1 cursor-pointer" title="Reduced motion (disable animations)">
      <input
        type="checkbox"
        checked={reduceMotion}
        onChange={toggle}
        className="form-checkbox h-4 w-4 text-primary focus:ring-primary"
        aria-label="Reduced motion"
      />
      <span className="text-sm text-muted-foreground">Reduced motion</span>
    </label>
  );
}

export default ReducedMotionToggle;
