import { useMemo, useState, type TouchEvent } from 'react';

interface PageViewerProps {
  pages: string[];
  initialPage?: number;
}

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2;

function PageViewer({ pages, initialPage = 0 }: PageViewerProps): JSX.Element {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoom, setZoom] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

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

  const handleZoom = (delta: number): void => {
    setZoom((current) => {
      const next = Math.min(Math.max(current + delta, MIN_ZOOM), MAX_ZOOM);
      return Math.round(next * 100) / 100;
    });
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>): void => {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>): void => {
    if (touchStartX == null) {
      return;
    }
    const deltaX = event.changedTouches[0]?.clientX ?? 0;
    const difference = deltaX - touchStartX;
    if (Math.abs(difference) > 50) {
      if (difference < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
  };

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-wide text-slate-400">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-slate-700 px-3 py-1 font-semibold text-slate-200 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
              onClick={handlePrev}
              disabled={clampedPage === 0}
            >
              ← Anterior
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-700 px-3 py-1 font-semibold text-slate-200 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
              onClick={handleNext}
              disabled={clampedPage >= totalPages - 1}
            >
              Siguiente →
            </button>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <button
              type="button"
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide transition hover:border-primary hover:text-primary"
              onClick={() => {
                setZoom(1);
              }}
            >
              Reset zoom
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
            <span className="text-xs font-semibold uppercase tracking-wide">{Math.round(zoom * 100)}%</span>
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
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Página {clampedPage + 1} de {totalPages}</span>
          {totalPages > 1 && (
            <input
              type="range"
              min={0}
              max={Math.max(totalPages - 1, 0)}
              value={clampedPage}
              onChange={(event) => {
                goToPage(Number(event.target.value));
              }}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-800 accent-primary"
            />
          )}
        </div>
        <div className="flex justify-center">
          <div
            className="max-h-[70vh] w-full overflow-hidden rounded-2xl border border-slate-800 bg-black/60 p-2 sm:max-h-[75vh] lg:max-h-[80vh]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {totalPages === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400">Sin páginas disponibles</div>
            ) : (
              <img
                key={pages[clampedPage]}
                src={pages[clampedPage]}
                alt={`Página ${clampedPage + 1}`}
                className="mx-auto max-h-full w-full origin-top object-contain transition-transform duration-300"
                style={{ transform: `scale(${zoom})` }}
              />
            )}
          </div>
        </div>
        {totalPages > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-wide text-slate-400">Miniaturas</span>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {pages.map((page, index) => (
                <button
                  key={`page-${index}`}
                  type="button"
                  className={`relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg border transition ${
                    index === clampedPage
                      ? 'border-primary/80 ring-2 ring-primary/50'
                      : 'border-slate-700 hover:border-primary/50'
                  }`}
                  onClick={() => {
                    goToPage(index);
                  }}
                  aria-label={`Ir a la página ${index + 1}`}
                >
                  <img src={page} alt={`Miniatura ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default PageViewer;
