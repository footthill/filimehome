import { useEffect } from 'react';
import { useSidebarStore } from '../store/useSideStore';

function SidebarResizeListener() {
  const open = useSidebarStore((state) => state.open);
  const close = useSidebarStore((state) => state.close);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) open();
      else close();
    };

    mediaQuery.addEventListener('change', handleChange);

    // Set initial value in case of hydration mismatch
    if (mediaQuery.matches) open();
    else close();

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [open, close]);

  return null; // no UI
}

export default SidebarResizeListener;
