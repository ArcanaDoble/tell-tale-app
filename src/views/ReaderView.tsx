import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageViewer from '../components/PageViewer';
import BookmarkButton from '../components/BookmarkButton';
import type { Resource } from '../types/library';
import { getResourceById } from '../services/libraryService';

function ReaderView(): JSX.Element {
  const { resourceId } = useParams<{ resourceId: string }>();
  const [resource, setResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResource = async (): Promise<void> => {
      if (resourceId == null) {
        return;
      }
      setIsLoading(true);
      const item = await getResourceById(resourceId);
      setResource(item ?? null);
      setIsLoading(false);
    };

    void fetchResource();
  }, [resourceId]);

  const hasPages = useMemo(() => (resource?.pages ?? []).length > 0, [resource]);

  if (isLoading) {
    return (
      <section className="grid flex-1 place-items-center rounded-3xl border border-slate-800 bg-slate-950/60 p-12 text-slate-400">
        Preparando lector...
      </section>
    );
  }

  if (resource == null) {
    return (
      <section className="grid flex-1 place-items-center rounded-3xl border border-rose-900/60 bg-rose-950/50 p-12 text-rose-200">
        No encontramos el contenido solicitado.
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{resource.title}</h1>
          <p className="text-sm text-slate-400">Por {resource.author}</p>
          <span className="text-xs uppercase tracking-wide text-slate-500">
            {hasPages ? `${resource.pageCount} páginas disponibles` : 'Lector embebido' }
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <BookmarkButton resourceId={resource.id} />
          {resource.fileUrl != null && (
            <a
              href={resource.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 px-5 py-2 font-semibold text-slate-200 transition hover:border-primary hover:text-primary"
            >
              ⬇️ Descargar
            </a>
          )}
          <Link
            to={`/details/${resource.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 px-5 py-2 font-semibold text-slate-200 transition hover:border-primary hover:text-primary"
          >
            Ver detalles
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 px-5 py-2 font-semibold text-slate-200 transition hover:border-primary hover:text-primary"
          >
            Volver a la biblioteca
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 sm:p-6">
        {hasPages ? (
          <PageViewer pages={resource.pages} />
        ) : resource.fileUrl != null ? (
          <div className="flex flex-1 flex-col gap-4">
            <iframe
              key={resource.fileUrl}
              src={resource.fileUrl}
              title={`Lector de ${resource.title}`}
              className="h-[70vh] w-full rounded-2xl border border-slate-800 bg-white"
            />
            <p className="text-xs text-slate-400">
              Si el archivo no se muestra correctamente, descárgalo y ábrelo con tu lector favorito. Algunos formatos como EPUB o CBZ pueden requerir aplicaciones externas en ciertos navegadores.
            </p>
          </div>
        ) : (
          <div className="grid flex-1 place-items-center rounded-2xl border border-slate-800/80 bg-slate-900/60 p-12 text-center text-slate-300">
            El recurso todavía no tiene páginas ni archivo adjunto disponibles.
          </div>
        )}
      </div>
    </section>
  );
}

export default ReaderView;
