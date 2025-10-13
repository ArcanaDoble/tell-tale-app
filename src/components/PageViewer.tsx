import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent
} from 'react';

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

  const viewerRef = useRef<HTMLDivElement | null>(null);
  const pointerState = useRef({
    active: new Map<number, { x: number; y: number }>(),
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    lastDistance: null as number | null
  });

  const totalPages = pages.length;
  const clampedPage = useMemo(() => Math.min(Math.max(currentPage, 0), totalPages - 1), [currentPage, totalPages]);

  const goToPage = (page: number): void => {
    setCurrentPage(Math.min(Math.max(page, 0), totalPages - 1));
  };

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
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        handleZoom(delta);
      }
    },
    [handleZoom]
  );

  const updatePointer = (pointerId: number, position: { x: number; y: number }): void => {
    pointerState.current.active.set(pointerId, position);
  };

  const removePointer = (pointerId: number): void => {
    pointerState.current.active.delete(pointerId);
    const remainingCount = pointerState.current.active.size;

    if (remainingCount >= 2) {
      const [first, second] = Array.from(pointerState.current.active.values());
      pointerState.current.lastDistance = Math.hypot(first.x - second.x, first.y - second.y);
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
  };

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
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
  }, []);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const container = viewerRef.current;
      if (container == null || !pointerState.current.active.has(event.pointerId)) {
        return;
      }

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
    [handleZoom]
  );

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const container = viewerRef.current;
    if (container != null && container.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
    removePointer(event.pointerId);
  }, []);

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
    <section className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3 bg-black sm:rounded-2xl sm:border sm:border-slate-800 sm:bg-slate-950/60 sm:p-4 sm:shadow-lg">
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
        <div className="relative flex justify-center">
          <div
            ref={viewerRef}
            className={`relative h-[100dvh] w-full overflow-auto bg-black touch-none sm:h-auto sm:max-h-[75vh] sm:rounded-xl sm:border sm:border-slate-800 sm:bg-black/60 sm:p-2 lg:max-h-[80vh] ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
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
            <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
              <button
                type="button"
                className={`pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full text-4xl text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-12 sm:w-12 sm:text-3xl ${
                  clampedPage === 0
                    ? 'cursor-default opacity-0'
                    : 'bg-black/30 hover:bg-black/50'
                }`}
                onClick={handlePrev}
                disabled={clampedPage === 0}
                aria-label="Página anterior"
              >
                ‹
              </button>
              <button
                type="button"
                className={`pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full text-4xl text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-12 sm:w-12 sm:text-3xl ${
                  clampedPage >= totalPages - 1
                    ? 'cursor-default opacity-0'
                    : 'bg-black/30 hover:bg-black/50'
                }`}
                onClick={handleNext}
                disabled={clampedPage >= totalPages - 1}
                aria-label="Página siguiente"
              >
                ›
              </button>
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
