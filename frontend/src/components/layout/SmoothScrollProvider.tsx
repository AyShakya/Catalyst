import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import '../../styles/smoothScroll.css';

/**
 * Global smooth scroll provider using Lenis.
 * It wraps the entire application content, ensuring smooth scrolling on all pages.
 * On mobile devices, it falls back to native scrolling for better responsiveness.
 */
const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const { pathname } = useLocation();

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isWorkspace = pathname.startsWith('/workspace');
  const isLenisActive = !isMobile && !isWorkspace;

  // Initialize Lenis dynamically based on active state and route
  useEffect(() => {
    if (!scrollRef.current) return;

    if (!isLenisActive) {
      // Clean up previous instance if any
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    // Initialize only if not already initialized
    if (!lenisRef.current) {
      const lenis = new Lenis({
        wrapper: scrollRef.current,
        content: scrollRef.current.firstElementChild as HTMLElement,
        duration: 0.8,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: true,
        autoResize: true,
      });
      lenisRef.current = lenis;

      let rafId: number;
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      return () => {
        cancelAnimationFrame(rafId);
        lenis.destroy();
        lenisRef.current = null;
      };
    }
  }, [isLenisActive]);

  // Reset scroll to top on route change (desktop and active Lenis only)
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [pathname]);

  return (
    <div 
      ref={scrollRef} 
      className={isLenisActive ? "smooth-scroll-wrapper min-h-screen overflow-hidden" : "min-h-screen"}
    >
      <div className={isLenisActive ? "smooth-scroll-content" : ""}>
        {children}
      </div>
    </div>
  );
};

export default SmoothScrollProvider;
