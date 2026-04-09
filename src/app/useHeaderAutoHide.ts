import { useEffect, useRef, useState } from 'react';

const HEADER_HIDE_THRESHOLD = 80;
const HEADER_SHOW_THRESHOLD = 36;
const HEADER_SHOW_TOP_OFFSET = 24;

interface UseHeaderAutoHideOptions {
  enabled: boolean;
  forcedVisible?: boolean;
  routeKey?: string;
}

export const APP_SCROLL_REGION_ATTRIBUTE = 'data-app-scroll-region';

export const useHeaderAutoHide = ({
  enabled,
  forcedVisible = false,
  routeKey,
}: UseHeaderAutoHideOptions) => {
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const activeRegionRef = useRef<EventTarget | null>(null);
  const lastScrollTopRef = useRef(0);
  const accumulatedDownRef = useRef(0);
  const accumulatedUpRef = useRef(0);
  const resetFrameRef = useRef<number | null>(null);

  const resetTrackingState = () => {
    activeRegionRef.current = null;
    lastScrollTopRef.current = 0;
    accumulatedDownRef.current = 0;
    accumulatedUpRef.current = 0;
  };

  const scheduleVisibleReset = () => {
    if (resetFrameRef.current !== null) {
      window.cancelAnimationFrame(resetFrameRef.current);
    }

    resetFrameRef.current = window.requestAnimationFrame(() => {
      setIsHeaderHidden(false);
      resetFrameRef.current = null;
    });
  };

  useEffect(() => {
    resetTrackingState();
    scheduleVisibleReset();
  }, [routeKey]);

  useEffect(() => {
    if (!enabled || forcedVisible) {
      resetTrackingState();
      scheduleVisibleReset();
      return;
    }

    const handleScroll = (event: Event) => {
      const scrollRegion = event.target;
      if (!(scrollRegion instanceof HTMLElement)) return;
      if (!scrollRegion.hasAttribute(APP_SCROLL_REGION_ATTRIBUTE)) return;

      if (activeRegionRef.current !== scrollRegion) {
        activeRegionRef.current = scrollRegion;
        lastScrollTopRef.current = scrollRegion.scrollTop;
        accumulatedDownRef.current = 0;
        accumulatedUpRef.current = 0;
        return;
      }

      const currentScrollTop = scrollRegion.scrollTop;
      const delta = currentScrollTop - lastScrollTopRef.current;
      lastScrollTopRef.current = currentScrollTop;

      if (currentScrollTop <= HEADER_SHOW_TOP_OFFSET) {
        accumulatedDownRef.current = 0;
        accumulatedUpRef.current = 0;
        setIsHeaderHidden(false);
        return;
      }

      if (Math.abs(delta) < 2) {
        return;
      }

      if (delta > 0) {
        accumulatedDownRef.current += delta;
        accumulatedUpRef.current = 0;
        if (accumulatedDownRef.current >= HEADER_HIDE_THRESHOLD) {
          setIsHeaderHidden(true);
          accumulatedDownRef.current = 0;
        }
        return;
      }

      accumulatedUpRef.current += Math.abs(delta);
      accumulatedDownRef.current = 0;
      if (accumulatedUpRef.current >= HEADER_SHOW_THRESHOLD) {
        setIsHeaderHidden(false);
        accumulatedUpRef.current = 0;
      }
    };

    document.addEventListener('scroll', handleScroll, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [enabled, forcedVisible]);

  useEffect(
    () => () => {
      if (resetFrameRef.current !== null) {
        window.cancelAnimationFrame(resetFrameRef.current);
      }
    },
    []
  );

  return {
    isHeaderHidden,
  };
};
