import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BookmarkButton from '../components/BookmarkButton';
import Icon from '../components/Icon';
import type { Resource } from '../types/library';
import { getResourceById } from '../services/libraryService';
import { getProgressPercent, getReadingProgress } from '../utils/readingProgress';
import { createCoverFallback } from '../utils/coverFallback';

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
  const collectionName = useMemo(() => resource?.collectionName?.trim() ?? null, [resource]);
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
  const progressPercent = useMemo(() => {
    if (resource == null) {
      return 0;
    }
    return getProgressPercent(getReadingProgress(resource.id), resource.pageCount);
  }, [resource]);

  if (isLoading) {
    return (
      <section className="grid flex-1 place-items-center border-2 border-ink/15 bg-paper-soft p-12 text-ink-soft">
        Cargando detalles...
      </section>
    );
  }

  if (resource == null) {
    return (
      <section className="grid flex-1 place-items-center border-2 border-primary bg-primary/10 p-12 text-primary">
        El recurso solicitado no se encontró.
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="grid gap-6 border-2 border-ink bg-paper-soft p-4 shadow-[7px_7px_0_rgba(22,19,18,0.2)] md:grid-cols-[minmax(240px,360px),1fr] md:p-6">
        <div className="mx-auto w-full max-w-sm overflow-hidden border-2 border-ink bg-ink md:mx-0">
          <img
            src={resource.coverUrl}
            alt={resource.title}
            className="w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = createCoverFallback(resource.title);
            }}
          />
        </div>
        <div className="flex flex-1 flex-col gap-5">
          <header className="flex flex-col gap-2">
            <span className="w-fit border border-primary bg-primary px-3 py-1 text-xs font-black uppercase text-paper">
              {typeLabel}
            </span>
            <h1 className="text-3xl font-black leading-tight text-ink sm:text-5xl">{resource.title}</h1>
            <p className="font-semibold text-ink-soft/75">Por {resource.author}</p>
            {collectionName ? (
              <span className="text-xs font-black uppercase text-ink-soft/70">Colección: {collectionName}</span>
            ) : null}
          </header>
          <p className="max-w-3xl text-lg leading-8 text-ink-soft">{resource.description}</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="border border-ink/15 bg-paper px-3 py-1 text-xs font-black uppercase text-ink-soft"
              >
                #{tag}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {resource.hasReader ? (
              <Link
                to={`/read/${resource.id}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 bg-ink px-5 text-sm font-black uppercase text-paper transition hover:bg-primary"
              >
                <Icon name="book" className="h-4 w-4" />
                Abrir lector
              </Link>
            ) : resource.downloadUrl != null ? (
              <a
                href={resource.downloadUrl}
                className="inline-flex min-h-11 items-center justify-center gap-2 bg-ink px-5 text-sm font-black uppercase text-paper transition hover:bg-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="download" className="h-4 w-4" />
                Descargar archivo
              </a>
            ) : null}
            <Link
              to={`/edit/${resource.id}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-ink/20 px-5 text-sm font-black uppercase text-ink transition hover:border-ink"
            >
              <Icon name="edit" className="h-4 w-4" />
              Editar
            </Link>
            <BookmarkButton resourceId={resource.id} />
          </div>
        </div>
      </div>
      <div className="grid gap-4 text-sm text-ink-soft sm:grid-cols-2">
        <div className="border-2 border-ink/15 bg-paper-soft p-5">
          <h2 className="text-lg font-black text-ink">Progreso</h2>
          {resource.hasReader ? (
            <div className="mt-3 flex flex-col gap-2">
              <p>{resource.pageCount} páginas disponibles.</p>
              <div className="h-2 bg-ink/10">
                <div className="h-full bg-accent" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="text-xs font-black uppercase text-accent">{progressPercent}% leído</p>
            </div>
          ) : (
            <p>El recurso no cuenta con lector integrado. Descarga el archivo para consultarlo.</p>
          )}
        </div>
        <div className="border-2 border-ink/15 bg-paper-soft p-5">
          <h2 className="text-lg font-black text-ink">Lectura cómoda</h2>
          <p className="mt-3 leading-6">
            El visor recuerda tu página, permite zoom táctil y adapta los controles para escritorio, tablet y móvil.
          </p>
        </div>
      </div>
    </section>
  );
}

export default DetailsView;
