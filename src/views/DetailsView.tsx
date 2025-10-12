import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BookmarkButton from '../components/BookmarkButton';
import type { Resource } from '../types/library';
import { getResourceById } from '../services/libraryService';

function DetailsView(): JSX.Element {
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

  const tags = useMemo(() => resource?.tags ?? [], [resource]);
  const typeLabel = useMemo(() => {
    if (resource == null) {
      return '';
    }
    switch (resource.resourceType) {
      case 'manga':
        return 'Manga';
      case 'libro':
        return 'Libro';
      case 'documento':
        return 'Documento';
      default:
        return 'Recurso';
    }
  }, [resource]);

  if (isLoading) {
    return (
      <section className="grid flex-1 place-items-center rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-slate-400">
        Cargando detalles...
      </section>
    );
  }

  if (resource == null) {
    return (
      <section className="grid flex-1 place-items-center rounded-2xl border border-rose-900/60 bg-rose-950/40 p-12 text-rose-200">
        El recurso solicitado no se encontró.
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col gap-8">
      <div className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg md:flex-row md:gap-10">
        <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-slate-800 md:mx-0">
          <img src={resource.coverUrl} alt={resource.title} className="w-full object-cover" />
        </div>
        <div className="flex flex-1 flex-col gap-5">
          <header className="flex flex-col gap-2">
            <span className="w-fit rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {typeLabel}
            </span>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">{resource.title}</h1>
            <p className="text-slate-400">Por {resource.author}</p>
          </header>
          <p className="text-lg text-slate-200">{resource.description}</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300"
              >
                #{tag}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {resource.hasReader ? (
              <Link
                to={`/read/${resource.id}`}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/80"
              >
                Abrir lector
              </Link>
            ) : resource.downloadUrl != null ? (
              <a
                href={resource.downloadUrl}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/80"
                target="_blank"
                rel="noopener noreferrer"
              >
                Descargar archivo
              </a>
            ) : null}
            <BookmarkButton resourceId={resource.id} />
          </div>
        </div>
      </div>
      <div className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-300 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold text-white">Progreso</h2>
          {resource.hasReader ? (
            <p>{resource.pageCount} páginas disponibles.</p>
          ) : (
            <p>El recurso no cuenta con lector integrado. Descarga el archivo para consultarlo.</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold text-white">Indicaciones</h2>
          <p>Utiliza el visor para hacer zoom y navegar entre páginas con facilidad desde cualquier dispositivo.</p>
        </div>
      </div>
    </section>
  );
}

export default DetailsView;
