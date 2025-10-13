import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

interface PageViewerProps {
  pages: string[];
  initialPage?: number;
}

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2;

function PageViewer({ pages, initialPage = 0 }: PageViewerProps): JSX.Element {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);

  const viewerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerState = useRef({
    active: new Map<number, { x: number; y: number }>(),
    startX: 0,
    startY: 0,
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

  const totalPages = pages.length;
  const clampedPage = useMemo(() => Math.min(Math.max(currentPage, 0), totalPages - 1), [currentPage, totalPages]);

  const goToPage = (page: number): void => {
    setCurrentPage(Math.min(Math.max(page, 0), totalPages - 1));
  };

  useEffect(() => {
    showControls();

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

  const handleZoom = useCallback((delta: number) => {
    setZoom((current) => {
      const next = Math.min(Math.max(current + delta, MIN_ZOOM), MAX_ZOOM);
      return Math.round(next * 100) / 100;
    });
  }, []);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      showControls();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta);
    },
    [handleZoom, showControls]
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
        setIsDragging(false);
        showControls();
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
        showControls();
        return;
      }

      setIsDragging(false);
      scheduleHideControls();
    },
    [scheduleHideControls, showControls]
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      showControls();

      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      const container = viewerRef.current;
      if (container == null) {
        return;
      }

      container.setPointerCapture(event.pointerId);
      updatePointer(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointerState.current.active.size === 1) {
        pointerState.current.startX = event.clientX;
        pointerState.current.startY = event.clientY;
        pointerState.current.scrollLeft = container.scrollLeft;
        pointerState.current.scrollTop = container.scrollTop;
        pointerState.current.lastDistance = null;
        setIsDragging(true);
      } else if (pointerState.current.active.size === 2) {
        const [first, second] = Array.from(pointerState.current.active.values());
        pointerState.current.lastDistance = Math.hypot(first.x - second.x, first.y - second.y);
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

      showControls();
      updatePointer(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointerState.current.active.size >= 2) {
        event.preventDefault();
        const [first, second] = Array.from(pointerState.current.active.values());
        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        const previous = pointerState.current.lastDistance;
        if (previous != null) {
          const delta = (distance - previous) / 250;
          if (delta !== 0) {
            handleZoom(delta);
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
    [handleZoom, showControls, updatePointer]
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      showControls();
      const container = viewerRef.current;
      if (container != null && container.hasPointerCapture(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
      removePointer(event.pointerId);
    },
    [removePointer, showControls]
  );

  const handlePointerEnter = useCallback(() => {
    showControls();
  }, [showControls]);

  const zoomPercent = Math.round(zoom * 100);

  const imageStyle = useMemo<CSSProperties>(() => {
    const width = `${zoomPercent}%`;

    if (zoomPercent <= 100) {
      return {
        width,
        minWidth: width,
        maxWidth: 'none',
        height: '100%',
        objectFit: 'contain'
      };
    }

    return {
      width,
      minWidth: width,
      maxWidth: 'none',
      height: 'auto'
    };
  }, [zoomPercent]);

  return (
    <section className="flex min-h-[100svh] w-full flex-col bg-black sm:min-h-0 sm:bg-transparent sm:gap-4">
      <div className="flex flex-1 flex-col gap-0 bg-black sm:flex-none sm:gap-3 sm:rounded-2xl sm:border sm:border-slate-800 sm:bg-slate-950/60 sm:p-4 sm:shadow-lg">
        <div className="hidden flex-wrap items-center justify-between gap-3 sm:flex">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <button
              type="button"
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
              onClick={handlePrev}
              disabled={clampedPage === 0}
            >
              Página anterior
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
              onClick={handleNext}
              disabled={clampedPage >= totalPages - 1}
            >
              Página siguiente
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <button
              type="button"
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide transition hover:border-primary hover:text-primary"
              onClick={() => {
                setZoom(1);
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide transition hover:border-primary hover:text-primary"
              onClick={() => {
                handleZoom(-0.1);
              }}
            >
              -
            </button>
            <span className="text-xs font-semibold uppercase tracking-wide">{zoomPercent}%</span>
            <button
              type="button"
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide transition hover:border-primary hover:text-primary"
              onClick={() => {
                handleZoom(0.1);
              }}
            >
              +
            </button>
          </div>
        </div>
        <div className="relative flex flex-1 justify-center sm:flex-none">
          <div
            ref={viewerRef}
            className={`relative flex-1 h-[100dvh] min-h-[100svh] w-full overscroll-none overflow-auto bg-black touch-none sm:h-auto sm:min-h-0 sm:flex-none sm:max-h-[75vh] sm:rounded-xl sm:border sm:border-slate-800 sm:bg-black/60 sm:p-2 lg:max-h-[80vh] ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerEnter={handlePointerEnter}
          >
            {totalPages === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400">Sin páginas disponibles</div>
            ) : (
              <img
                key={pages[clampedPage]}
                src={pages[clampedPage]}
                alt={`Página ${clampedPage + 1}`}
                className="block h-full w-full select-none transition-[width] duration-150 ease-out sm:h-auto sm:w-auto"
                style={imageStyle}
                draggable={false}
              />
            )}
          </div>
          {totalPages > 0 ? (
            <div
              className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${
                controlsVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {totalPages > 1 ? (
                <button
                  type="button"
                  className={`pointer-events-auto absolute left-3 top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full text-4xl text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:left-4 sm:h-12 sm:w-12 sm:text-3xl ${
                    clampedPage === 0 ? 'pointer-events-none opacity-0' : 'bg-black/30 hover:bg-black/50'
                  }`}
                  onClick={handlePrev}
                  disabled={clampedPage === 0}
                  aria-label="Página anterior"
                >
                  ‹
                </button>
              ) : null}
              {totalPages > 1 ? (
                <button
                  type="button"
                  className={`pointer-events-auto absolute right-3 top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full text-4xl text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:right-4 sm:h-12 sm:w-12 sm:text-3xl ${
                    clampedPage >= totalPages - 1 ? 'pointer-events-none opacity-0' : 'bg-black/30 hover:bg-black/50'
                  }`}
                  onClick={handleNext}
                  disabled={clampedPage >= totalPages - 1}
                  aria-label="Página siguiente"
                >
                  ›
                </button>
              ) : null}
              <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white sm:text-[0.65rem]">
                Página {clampedPage + 1} de {totalPages}
              </div>
            </div>
          ) : null}
        </div>
        <div className="hidden flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-wide text-slate-400 sm:flex">
          <span>
            Página {clampedPage + 1} de {totalPages}
          </span>
          <div className="flex flex-wrap gap-2">
            {pages.map((_, index) => (
              <button
                key={`page-${index}`}
                type="button"
                className={`h-2 w-6 rounded-full transition ${
                  index === clampedPage ? 'bg-primary' : 'bg-slate-700 hover:bg-primary/50'
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
