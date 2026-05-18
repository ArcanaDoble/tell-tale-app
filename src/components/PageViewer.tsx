import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { saveReadingProgress } from '../utils/readingProgress';

interface PageViewerProps {
  pages: string[];
  initialPage?: number;
  resourceId?: string;
  title?: string;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const MIN_FIT_SCALE = 0.05;
const TAP_MOVE_TOLERANCE = 10;
const PAGE_PRELOAD_RADIUS = 3;
const readerSettingsKey = 'reader:settings';
const decodedPageCache = new Set<string>();
const pendingPagePreloads = new Map<string, Promise<void>>();

type ReaderTheme = 'night' | 'paper';

function decodeImageElement(image: HTMLImageElement): Promise<void> {
  if (typeof image.decode !== 'function') {
    return Promise.resolve();
  }

  return image.decode().catch(() => undefined);
}

function preloadPageImage(src: string): Promise<void> {
  if (decodedPageCache.has(src)) {
    return Promise.resolve();
  }

  const pending = pendingPagePreloads.get(src);
  if (pending != null) {
    return pending;
  }

  const preload = new Promise<void>((resolve) => {
    const image = new Image();
    const markReady = (): void => {
      decodedPageCache.add(src);
      resolve();
    };

    image.decoding = 'async';
    image.onload = () => {
      void decodeImageElement(image).then(markReady);
    };
    image.onerror = () => {
      resolve();
    };
    image.src = src;

    if (image.complete && image.naturalWidth > 0) {
      void decodeImageElement(image).then(markReady);
    }
  }).finally(() => {
    pendingPagePreloads.delete(src);
  });

  pendingPagePreloads.set(src, preload);
  return preload;
}

function PageViewer({ pages, initialPage = 0, resourceId, title = 'Lector' }: PageViewerProps): JSX.Element {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [loadedPageSrc, setLoadedPageSrc] = useState<string | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [scrollVersion, setScrollVersion] = useState(0);
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>(() => {
    if (typeof window === 'undefined') {
      return 'night';
    }
    return window.localStorage.getItem(readerSettingsKey) === 'paper' ? 'paper' : 'night';
  });

  const viewerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const hasUserAdjustedZoomRef = useRef(false);
  const zoomRef = useRef(zoom);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingScrollRef = useRef<{ left: number; top: number } | null>(null);
  const pointerState = useRef({
    active: new Map<number, { x: number; y: number }>(),
    startX: 0,
    startY: 0,
    tapStartX: 0,
    tapStartY: 0,
    hasMoved: false,
    hadPinch: false,
    scrollLeft: 0,
    scrollTop: 0,
    lastDistance: null as number | null
  });

  const clearHideControls = useCallback(() => {
    if (controlsTimeoutRef.current != null) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    clearHideControls();
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
      controlsTimeoutRef.current = null;
    }, 2500);
  }, [clearHideControls]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const toggleControls = useCallback(() => {
    clearHideControls();
    setControlsVisible((current) => {
      const next = !current;
      if (next) {
        controlsTimeoutRef.current = setTimeout(() => {
          setControlsVisible(false);
          controlsTimeoutRef.current = null;
        }, 2500);
      }
      return next;
    });
  }, [clearHideControls]);

  const isCenterTap = useCallback((position: { clientX: number; clientY: number }) => {
    const container = viewerRef.current;
    if (container == null) {
      return false;
    }

    const rect = container.getBoundingClientRect();
    const x = position.clientX - rect.left;
    const y = position.clientY - rect.top;
    const horizontalMargin = rect.width * 0.22;
    const verticalMargin = rect.height * 0.24;

    return (
      x >= horizontalMargin &&
      x <= rect.width - horizontalMargin &&
      y >= verticalMargin &&
      y <= rect.height - verticalMargin
    );
  }, []);

  const totalPages = pages.length;
  const clampedPage = useMemo(
    () => (totalPages > 0 ? Math.min(Math.max(currentPage, 0), totalPages - 1) : 0),
    [currentPage, totalPages]
  );
  const currentPageSrc = totalPages > 0 ? pages[clampedPage] : null;
  const isCurrentPageReady = currentPageSrc != null && loadedPageSrc === currentPageSrc;

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    if (resourceId != null && totalPages > 0) {
      saveReadingProgress(resourceId, clampedPage, totalPages);
    }
  }, [clampedPage, resourceId, totalPages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(readerSettingsKey, readerTheme);
    }
  }, [readerTheme]);

  useEffect(() => {
    if (totalPages <= 1) {
      return;
    }

    const preloadQueue: string[] = [];
    for (let distance = 1; distance <= PAGE_PRELOAD_RADIUS; distance += 1) {
      const nextIndex = clampedPage + distance;
      const previousIndex = clampedPage - distance;

      if (nextIndex < totalPages) {
        preloadQueue.push(pages[nextIndex]);
      }
      if (previousIndex >= 0) {
        preloadQueue.push(pages[previousIndex]);
      }
    }

    if (preloadQueue.length === 0) {
      return;
    }

    let cancelled = false;
    const runPreload = (): void => {
      if (cancelled) {
        return;
      }
      preloadQueue.forEach((src) => {
        void preloadPageImage(src);
      });
    };

    const timeoutId = window.setTimeout(runPreload, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [clampedPage, pages, totalPages]);

  const goToPage = (page: number): void => {
    hasUserAdjustedZoomRef.current = false;
    setCurrentPage(Math.min(Math.max(page, 0), totalPages - 1));
    const container = viewerRef.current;
    if (container != null) {
      container.scrollLeft = 0;
      container.scrollTop = 0;
    }
  };

  useEffect(() => {
    const isCompactViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches;
    if (!isCompactViewport) {
      showControls();
    }

    return () => {
      clearHideControls();
    };
  }, [clearHideControls, showControls]);

  const handleNext = (): void => {
    goToPage(clampedPage + 1);
  };

  const handlePrev = (): void => {
    goToPage(clampedPage - 1);
  };

  const handleZoom = useCallback((delta: number, focus?: { clientX: number; clientY: number }) => {
    const container = viewerRef.current;
    const image = imageRef.current;

    setZoom((current) => {
      const next = Math.min(Math.max(current + delta, MIN_ZOOM), MAX_ZOOM);
      const rounded = Math.round(next * 100) / 100;

      if (container != null && image != null && rounded !== current) {
        const { naturalWidth, naturalHeight } = image;
        const { clientWidth, clientHeight } = container;

        if (naturalWidth > 0 && naturalHeight > 0 && clientWidth > 0 && clientHeight > 0) {
          const containerRect = container.getBoundingClientRect();
          const focusX = focus != null ? focus.clientX - containerRect.left : clientWidth / 2;
          const focusY = focus != null ? focus.clientY - containerRect.top : clientHeight / 2;
          const currentWidth = naturalWidth * fitScale * current;
          const currentHeight = naturalHeight * fitScale * current;
          const currentCanvasWidth = Math.max(currentWidth, clientWidth);
          const currentCanvasHeight = Math.max(currentHeight, clientHeight);
          const currentImageLeft = (currentCanvasWidth - currentWidth) / 2;
          const currentImageTop = (currentCanvasHeight - currentHeight) / 2;
          const contentX = container.scrollLeft + focusX - currentImageLeft;
          const contentY = container.scrollTop + focusY - currentImageTop;
          const ratioX = currentWidth > 0 ? Math.min(Math.max(contentX / currentWidth, 0), 1) : 0.5;
          const ratioY = currentHeight > 0 ? Math.min(Math.max(contentY / currentHeight, 0), 1) : 0.5;
          const nextWidth = naturalWidth * fitScale * rounded;
          const nextHeight = naturalHeight * fitScale * rounded;
          const nextCanvasWidth = Math.max(nextWidth, clientWidth);
          const nextCanvasHeight = Math.max(nextHeight, clientHeight);
          const nextImageLeft = (nextCanvasWidth - nextWidth) / 2;
          const nextImageTop = (nextCanvasHeight - nextHeight) / 2;
          const maxScrollLeft = Math.max(nextCanvasWidth - clientWidth, 0);
          const maxScrollTop = Math.max(nextCanvasHeight - clientHeight, 0);
          const nextScrollLeft = Math.min(Math.max(nextImageLeft + nextWidth * ratioX - focusX, 0), maxScrollLeft);
          const nextScrollTop = Math.min(Math.max(nextImageTop + nextHeight * ratioY - focusY, 0), maxScrollTop);

          pendingScrollRef.current = { left: nextScrollLeft, top: nextScrollTop };
        }
      }

      hasUserAdjustedZoomRef.current = true;
      zoomRef.current = rounded;
      return rounded;
    });
  }, [fitScale]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const resetUserZoom = useCallback(() => {
    const rounded = 1;
    hasUserAdjustedZoomRef.current = false;
    zoomRef.current = rounded;
    setZoom(rounded);
  }, []);

  const calculateFitScale = useCallback(() => {
    const container = viewerRef.current;
    const image = imageRef.current;
    if (container == null || image == null) {
      return 1;
    }

    const { clientWidth, clientHeight } = container;
    const { naturalWidth, naturalHeight } = image;
    if (naturalWidth === 0 || naturalHeight === 0) {
      return 1;
    }

    const widthRatio = clientWidth / naturalWidth;
    const heightRatio = clientHeight / naturalHeight;
    const desiredScale = Math.min(widthRatio, heightRatio);
    const limitedScale = Math.max(desiredScale, MIN_FIT_SCALE);
    return Math.round(limitedScale * 1000) / 1000;
  }, []);

  const fitContentToScreen = useCallback(() => {
    const container = viewerRef.current;
    if (container == null) {
      return;
    }
    const fittedScale = calculateFitScale();
    setFitScale(fittedScale);
    resetUserZoom();
    const image = imageRef.current;
    if (image == null || image.naturalWidth === 0 || image.naturalHeight === 0) {
      container.scrollTo({ left: 0, top: 0 });
      return;
    }

    const displayWidth = image.naturalWidth * fittedScale;
    const displayHeight = image.naturalHeight * fittedScale;
    const canvasWidth = Math.max(displayWidth, container.clientWidth);
    const canvasHeight = Math.max(displayHeight, container.clientHeight);

    pendingScrollRef.current = {
      left: Math.max((canvasWidth - container.clientWidth) / 2, 0),
      top: Math.max((canvasHeight - container.clientHeight) / 2, 0)
    };
    setScrollVersion((current) => current + 1);
  }, [calculateFitScale, resetUserZoom]);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      showControls();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta, { clientX: event.clientX, clientY: event.clientY });
    },
    [handleZoom, showControls]
  );

  const zoomByStep = useCallback(
    (delta: number) => {
      handleZoom(delta);
    },
    [handleZoom]
  );

  useEffect(() => {
    const container = viewerRef.current;
    if (container == null) {
      return;
    }

    const handleNativeWheel = (event: WheelEvent): void => {
      handleWheel(event);
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [handleWheel]);

  const updatePointer = useCallback((pointerId: number, position: { x: number; y: number }) => {
    pointerState.current.active.set(pointerId, position);
  }, []);

  const removePointer = useCallback(
    (pointerId: number) => {
      pointerState.current.active.delete(pointerId);
      const remainingCount = pointerState.current.active.size;

      if (remainingCount >= 2) {
        const [first, second] = Array.from(pointerState.current.active.values());
        pointerState.current.lastDistance = Math.hypot(first.x - second.x, first.y - second.y);
        pointerState.current.hadPinch = true;
        setIsDragging(false);
        return;
      }

      pointerState.current.lastDistance = null;

      if (remainingCount === 1) {
        const [remaining] = Array.from(pointerState.current.active.values());
        pointerState.current.startX = remaining.x;
        pointerState.current.startY = remaining.y;
        const container = viewerRef.current;
        if (container != null) {
          pointerState.current.scrollLeft = container.scrollLeft;
          pointerState.current.scrollTop = container.scrollTop;
        }
        setIsDragging(true);
        return;
      }

      setIsDragging(false);
      if (controlsVisible) {
        scheduleHideControls();
      }
    },
    [controlsVisible, scheduleHideControls]
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      const container = viewerRef.current;
      if (container == null) {
        return;
      }

      if (event.pointerType !== 'touch') {
        showControls();
      }

      container.setPointerCapture(event.pointerId);
      updatePointer(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointerState.current.active.size === 1) {
        pointerState.current.startX = event.clientX;
        pointerState.current.startY = event.clientY;
        pointerState.current.tapStartX = event.clientX;
        pointerState.current.tapStartY = event.clientY;
        pointerState.current.hasMoved = false;
        pointerState.current.hadPinch = false;
        pointerState.current.scrollLeft = container.scrollLeft;
        pointerState.current.scrollTop = container.scrollTop;
        pointerState.current.lastDistance = null;
        setIsDragging(true);
      } else if (pointerState.current.active.size === 2) {
        const [first, second] = Array.from(pointerState.current.active.values());
        pointerState.current.lastDistance = Math.hypot(first.x - second.x, first.y - second.y);
        pointerState.current.hadPinch = true;
        setIsDragging(false);
      }

      if (event.pointerType === 'touch') {
        event.preventDefault();
      }
    },
    [showControls, updatePointer]
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const container = viewerRef.current;
      if (container == null || !pointerState.current.active.has(event.pointerId)) {
        return;
      }

      updatePointer(event.pointerId, { x: event.clientX, y: event.clientY });

      if (
        !pointerState.current.hasMoved &&
        Math.hypot(event.clientX - pointerState.current.tapStartX, event.clientY - pointerState.current.tapStartY) >
          TAP_MOVE_TOLERANCE
      ) {
        pointerState.current.hasMoved = true;
      }

      if (pointerState.current.active.size >= 2) {
        event.preventDefault();
        pointerState.current.hadPinch = true;
        const [first, second] = Array.from(pointerState.current.active.values());
        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        const previous = pointerState.current.lastDistance;
        if (previous != null) {
          const delta = (distance - previous) / 250;
          if (delta !== 0) {
            const midpoint = {
              clientX: (first.x + second.x) / 2,
              clientY: (first.y + second.y) / 2
            };
            handleZoom(delta, midpoint);
          }
        }
        pointerState.current.lastDistance = distance;
        return;
      }

      if (event.pointerType === 'mouse' && event.buttons !== 1) {
        return;
      }

      event.preventDefault();
      const deltaX = event.clientX - pointerState.current.startX;
      const deltaY = event.clientY - pointerState.current.startY;
      container.scrollLeft = pointerState.current.scrollLeft - deltaX;
      container.scrollTop = pointerState.current.scrollTop - deltaY;
      pointerState.current.scrollLeft = container.scrollLeft;
      pointerState.current.scrollTop = container.scrollTop;
      pointerState.current.startX = event.clientX;
      pointerState.current.startY = event.clientY;
    },
    [handleZoom, updatePointer]
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const container = viewerRef.current;
      const shouldToggleTouchControls =
        event.pointerType === 'touch' &&
        pointerState.current.active.size === 1 &&
        !pointerState.current.hasMoved &&
        !pointerState.current.hadPinch &&
        isCenterTap({ clientX: event.clientX, clientY: event.clientY });

      if (container != null && container.hasPointerCapture(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
      removePointer(event.pointerId);

      if (shouldToggleTouchControls) {
        toggleControls();
      } else if (event.pointerType !== 'touch') {
        showControls();
      }
    },
    [isCenterTap, removePointer, showControls, toggleControls]
  );

  const handlePointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== 'touch') {
        showControls();
      }
    },
    [showControls]
  );

  const zoomPercent = Math.round(zoom * 100);

  const displaySize = useMemo(() => {
    const hasDimensions = imageDimensions.width > 0 && imageDimensions.height > 0;
    return {
      width: hasDimensions ? imageDimensions.width * fitScale * zoom : 0,
      height: hasDimensions ? imageDimensions.height * fitScale * zoom : 0
    };
  }, [fitScale, imageDimensions.height, imageDimensions.width, zoom]);

  const canvasStyle = useMemo<CSSProperties>(() => {
    const width = Math.max(displaySize.width, viewportSize.width);
    const height = Math.max(displaySize.height, viewportSize.height);

    return {
      width: width > 0 ? `${width}px` : '100%',
      height: height > 0 ? `${height}px` : '100%'
    };
  }, [displaySize.height, displaySize.width, viewportSize.height, viewportSize.width]);

  const imageStyle = useMemo<CSSProperties>(() => {
    const widthValue = displaySize.width > 0 ? `${displaySize.width}px` : '0px';
    const heightValue = displaySize.height > 0 ? `${displaySize.height}px` : '0px';

    return {
      width: widthValue,
      height: heightValue,
      minWidth: widthValue,
      maxWidth: 'none',
      maxHeight: 'none',
      objectFit: 'contain',
      margin: 'auto'
    };
  }, [displaySize.height, displaySize.width]);

  useLayoutEffect(() => {
    const pendingScroll = pendingScrollRef.current;
    const container = viewerRef.current;
    if (pendingScroll == null || container == null) {
      return;
    }

    container.scrollTo({
      left: Math.min(Math.max(pendingScroll.left, 0), Math.max(container.scrollWidth - container.clientWidth, 0)),
      top: Math.min(Math.max(pendingScroll.top, 0), Math.max(container.scrollHeight - container.clientHeight, 0))
    });
    pendingScrollRef.current = null;
  }, [displaySize.height, displaySize.width, scrollVersion, viewportSize.height, viewportSize.width]);

  useEffect(() => {
    if (hasUserAdjustedZoomRef.current) {
      return;
    }

    const container = viewerRef.current;
    if (container == null) {
      return;
    }

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (!hasUserAdjustedZoomRef.current) {
        const { clientWidth, clientHeight } = container;
        setViewportSize({ width: clientWidth, height: clientHeight });
        fitContentToScreen();
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [fitContentToScreen]);

  const handleImageLoad = useCallback(() => {
    const image = imageRef.current;
    if (image != null && image.getAttribute('src') === currentPageSrc) {
      setImageDimensions({ width: image.naturalWidth, height: image.naturalHeight });
      setLoadedPageSrc(currentPageSrc);
    }
    if (!hasUserAdjustedZoomRef.current) {
      fitContentToScreen();
    }
  }, [currentPageSrc, fitContentToScreen]);

  useEffect(() => {
    setImageDimensions({ width: 0, height: 0 });
    setLoadedPageSrc(null);

    if (currentPageSrc == null) {
      return;
    }

    const container = viewerRef.current;
    if (container != null) {
      setViewportSize({ width: container.clientWidth, height: container.clientHeight });
    }

    const image = new Image();
    let cancelled = false;
    image.decoding = 'async';
    image.src = currentPageSrc;

    const handlePreload = async (): Promise<void> => {
      if (cancelled) {
        return;
      }
      await decodeImageElement(image);
      if (cancelled) {
        return;
      }
      decodedPageCache.add(currentPageSrc);
      const nextDimensions = { width: image.naturalWidth, height: image.naturalHeight };
      const currentContainer = viewerRef.current;
      const containerWidth = currentContainer?.clientWidth ?? viewportSize.width;
      const containerHeight = currentContainer?.clientHeight ?? viewportSize.height;
      const nextFitScale =
        nextDimensions.width > 0 && nextDimensions.height > 0 && containerWidth > 0 && containerHeight > 0
          ? Math.round(Math.max(Math.min(containerWidth / nextDimensions.width, containerHeight / nextDimensions.height), MIN_FIT_SCALE) * 1000) / 1000
          : 1;

      setImageDimensions(nextDimensions);
      setFitScale(nextFitScale);
      resetUserZoom();
      setLoadedPageSrc(currentPageSrc);

      if (currentContainer != null) {
        const displayWidth = nextDimensions.width * nextFitScale;
        const displayHeight = nextDimensions.height * nextFitScale;
        const canvasWidth = Math.max(displayWidth, currentContainer.clientWidth);
        const canvasHeight = Math.max(displayHeight, currentContainer.clientHeight);

        pendingScrollRef.current = {
          left: Math.max((canvasWidth - currentContainer.clientWidth) / 2, 0),
          top: Math.max((canvasHeight - currentContainer.clientHeight) / 2, 0)
        };
        setScrollVersion((current) => current + 1);
      }
    };

    if (image.complete && image.naturalWidth > 0) {
      void handlePreload();
    } else {
      image.addEventListener('load', () => {
        void handlePreload();
      }, { once: true });
    }

    return () => {
      cancelled = true;
      image.onload = null;
    };
  }, [currentPageSrc, resetUserZoom, viewportSize.height, viewportSize.width]);

  const themeClasses =
    readerTheme === 'paper'
      ? {
          shell: 'bg-[#f6f0e4] text-ink',
          frame: 'bg-[#fffaf1] border-ink/15',
          viewport: 'bg-[#eee3d0]',
          controls: 'border-ink/20 bg-paper text-ink hover:border-ink',
          primary: 'bg-ink text-paper hover:bg-primary',
          subtle: 'text-ink-soft'
        }
      : {
          shell: 'bg-reader-night text-paper',
          frame: 'bg-[#11100f] border-paper/10',
          viewport: 'bg-black',
          controls: 'border-paper/20 bg-paper/5 text-paper hover:border-paper',
          primary: 'bg-paper text-ink hover:bg-primary hover:text-paper',
          subtle: 'text-paper/55'
        };

  return (
    <section className={`flex h-full min-h-0 flex-1 flex-col ${themeClasses.shell}`}>
      <div className={`flex h-full min-h-0 flex-1 flex-col gap-0 xl:h-auto xl:gap-3 xl:border xl:p-4 ${themeClasses.frame}`}>
        <div className="hidden flex-wrap items-center justify-between gap-3 xl:flex">
          <div className="flex items-center gap-2 text-sm font-black uppercase">
            <button
              type="button"
              className={`inline-flex min-h-10 items-center gap-2 border px-3 transition disabled:cursor-not-allowed disabled:opacity-35 ${themeClasses.controls}`}
              onClick={handlePrev}
              disabled={clampedPage === 0}
            >
              <Icon name="chevronLeft" className="h-4 w-4" />
              Anterior
            </button>
            <button
              type="button"
              className={`inline-flex min-h-10 items-center gap-2 border px-3 transition disabled:cursor-not-allowed disabled:opacity-35 ${themeClasses.controls}`}
              onClick={handleNext}
              disabled={clampedPage >= totalPages - 1}
            >
              Siguiente
              <Icon name="chevronRight" className="h-4 w-4" />
            </button>
          </div>
          <div className={`min-w-0 flex-1 text-center text-sm font-semibold ${themeClasses.subtle}`}>
            <span className="line-clamp-1">{title}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-black uppercase">
            <button
              type="button"
              className={`inline-flex min-h-10 items-center gap-2 border px-3 transition ${themeClasses.controls}`}
              onClick={() => {
                setReaderTheme((current) => (current === 'night' ? 'paper' : 'night'));
              }}
              aria-label={readerTheme === 'night' ? 'Cambiar a modo papel' : 'Cambiar a modo noche'}
            >
              <Icon name={readerTheme === 'night' ? 'sun' : 'moon'} className="h-4 w-4" />
              {readerTheme === 'night' ? 'Papel' : 'Noche'}
            </button>
            <button
              type="button"
              className={`inline-flex min-h-10 items-center border px-3 transition ${themeClasses.controls}`}
              onClick={() => {
                fitContentToScreen();
              }}
              aria-label="Ajustar la página a la pantalla"
            >
              Ajustar vista
            </button>
            <button
              type="button"
              className={`grid min-h-10 w-10 place-items-center border transition ${themeClasses.controls}`}
              onClick={() => {
                zoomByStep(-0.1);
              }}
              aria-label="Reducir zoom"
            >
              <Icon name="zoomOut" className="h-4 w-4" />
            </button>
            <span className="w-12 text-center text-xs">{zoomPercent}%</span>
            <button
              type="button"
              className={`grid min-h-10 w-10 place-items-center border transition ${themeClasses.controls}`}
              onClick={() => {
                zoomByStep(0.1);
              }}
              aria-label="Ampliar zoom"
            >
              <Icon name="zoomIn" className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="relative flex min-h-0 flex-1 justify-center">
          <div
            ref={viewerRef}
            className={`reader-scrollbar relative h-full min-h-0 w-full flex-1 touch-none overflow-auto overscroll-none xl:border ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            } ${themeClasses.viewport}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerEnter={handlePointerEnter}
          >
            {totalPages === 0 ? (
              <div className={`flex h-full items-center justify-center ${themeClasses.subtle}`}>Sin páginas disponibles</div>
            ) : (
              <div className="flex items-center justify-center" style={canvasStyle}>
                {isCurrentPageReady && currentPageSrc != null ? (
                  <img
                    ref={imageRef}
                    key={currentPageSrc}
                    src={currentPageSrc}
                    alt={`Página ${clampedPage + 1}`}
                    className="block select-none"
                    style={imageStyle}
                    draggable={false}
                    onLoad={handleImageLoad}
                  />
                ) : null}
              </div>
            )}
          </div>
          {totalPages > 0 ? (
            <div
              className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${
                controlsVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Link
                className={`pointer-events-auto absolute left-3 top-3 grid h-12 w-12 place-items-center border-2 border-ink bg-primary text-paper shadow-[4px_4px_0_rgba(0,0,0,0.65)] transition active:scale-95 xl:hidden ${
                  controlsVisible ? 'opacity-100' : 'opacity-0'
                }`}
                to="/"
                aria-label="Volver a la biblioteca"
                onClick={() => {
                  clearHideControls();
                }}
              >
                <Icon name="book" className="h-5 w-5" />
              </Link>
              {totalPages > 1 ? (
                <button
                  type="button"
                  className={`pointer-events-auto absolute left-3 top-1/2 grid h-14 w-14 -translate-y-1/2 place-items-center border text-paper transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary xl:left-4 xl:h-12 xl:w-12 ${
                    clampedPage === 0 ? 'pointer-events-none opacity-0' : 'border-paper/20 bg-black/45 hover:bg-black/70'
                  }`}
                  onClick={handlePrev}
                  disabled={clampedPage === 0}
                  aria-label="Página anterior"
                >
                  <Icon name="chevronLeft" className="h-8 w-8" />
                </button>
              ) : null}
              {totalPages > 1 ? (
                <button
                  type="button"
                  className={`pointer-events-auto absolute right-3 top-1/2 grid h-14 w-14 -translate-y-1/2 place-items-center border text-paper transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary xl:right-4 xl:h-12 xl:w-12 ${
                    clampedPage >= totalPages - 1 ? 'pointer-events-none opacity-0' : 'border-paper/20 bg-black/45 hover:bg-black/70'
                  }`}
                  onClick={handleNext}
                  disabled={clampedPage >= totalPages - 1}
                  aria-label="Página siguiente"
                >
                  <Icon name="chevronRight" className="h-8 w-8" />
                </button>
              ) : null}
              <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center justify-center border border-paper/15 bg-black/70 px-3 py-1 text-xs font-black uppercase text-paper xl:flex xl:text-[0.65rem]">
                Página {clampedPage + 1} de {totalPages}
              </div>
              <div
                className={`absolute inset-x-3 bottom-3 flex flex-col gap-3 border border-paper/20 bg-black/78 p-3 text-paper shadow-lg backdrop-blur transition-opacity duration-200 xl:hidden ${
                  controlsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-xs font-black uppercase">
                  <span className="truncate">Página {clampedPage + 1} de {totalPages}</span>
                  <span>{zoomPercent}%</span>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    className="grid h-11 w-11 place-items-center border border-paper/30 bg-paper/10 transition active:scale-95"
                    onClick={() => {
                      zoomByStep(-0.15);
                    }}
                    aria-label="Reducir zoom"
                  >
                    <Icon name="zoomOut" className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="flex min-h-11 min-w-[96px] items-center justify-center border border-paper/30 bg-paper/10 px-4 text-xs font-black uppercase transition active:scale-95"
                    onClick={() => {
                      fitContentToScreen();
                    }}
                    aria-label="Ajustar a la pantalla"
                  >
                    Ajustar
                  </button>
                  <button
                    type="button"
                    className="grid h-11 w-11 place-items-center border border-paper/30 bg-paper/10 transition active:scale-95"
                    onClick={() => {
                      zoomByStep(0.15);
                    }}
                    aria-label="Ampliar zoom"
                  >
                    <Icon name="zoomIn" className="h-5 w-5" />
                  </button>
                </div>
                <button
                  type="button"
                  className="min-h-10 border border-paper/20 text-xs font-black uppercase text-paper/85"
                  onClick={() => {
                    setReaderTheme((current) => (current === 'night' ? 'paper' : 'night'));
                  }}
                >
                  {readerTheme === 'night' ? 'Modo papel' : 'Modo noche'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div className={`hidden shrink-0 flex-wrap items-center justify-between gap-3 text-xs font-black uppercase xl:flex ${themeClasses.subtle}`}>
          <span>
            Página {clampedPage + 1} de {totalPages}
          </span>
          <div className="flex flex-wrap gap-2">
            {pages.map((_, index) => (
              <button
                key={`page-${index}`}
                type="button"
                className={`h-2 w-6 rounded-full transition ${
                  index === clampedPage ? 'bg-primary' : readerTheme === 'paper' ? 'bg-ink/20 hover:bg-primary/50' : 'bg-paper/20 hover:bg-primary/50'
                }`}
                onClick={() => {
                  goToPage(index);
                }}
                aria-label={`Ir a la página ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default PageViewer;
