import { Link } from 'react-router-dom';
import Icon from './Icon';
import type { ResourceMeta } from '../types/library';
import { createCoverFallback } from '../utils/coverFallback';

interface ResourceCardProps {
  resource: ResourceMeta;
  onDelete?: (resource: ResourceMeta) => void;
  isDeleting?: boolean;
  progressPercent?: number;
  variant?: 'grid' | 'list';
}

const typeLabels: Record<ResourceMeta['resourceType'], string> = {
  manga: 'Manga',
  libro: 'Libro',
  documento: 'Documento'
};

function ResourceCard({
  resource,
  onDelete,
  isDeleting = false,
  progressPercent = 0,
  variant = 'grid'
}: ResourceCardProps): JSX.Element {
  const label = typeLabels[resource.resourceType] ?? 'Nuevo';
  const hasDownload = !resource.hasReader && resource.downloadUrl != null;
  const collectionLabel = resource.collectionName?.trim();
  const isList = variant === 'list';

  return (
    <article
      className={`group flex overflow-hidden border-2 border-ink/15 bg-paper-soft shadow-[5px_5px_0_rgba(22,19,18,0.14)] transition hover:-translate-y-0.5 hover:border-ink/55 hover:shadow-[7px_7px_0_rgba(185,45,58,0.25)] ${
        isList ? 'flex-row' : 'flex-col'
      }`}
    >
      <div className={`relative shrink-0 overflow-hidden bg-ink ${isList ? 'w-28 sm:w-40' : 'aspect-[3/4]'}`}>
        <img
          src={resource.coverUrl}
          alt={resource.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = createCoverFallback(resource.title);
          }}
        />
        <div className="absolute left-2 top-2 border border-paper/80 bg-primary px-2.5 py-1 text-[0.67rem] font-black uppercase text-paper shadow-[2px_2px_0_rgba(22,19,18,0.45)]">
          {label}
        </div>
        {progressPercent > 0 ? (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-paper/30">
            <div className="h-full bg-accent" style={{ width: `${progressPercent}%` }} />
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <header className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-lg font-black leading-tight text-ink">{resource.title}</h3>
          <p className="text-sm font-medium text-ink-soft/75">{resource.author}</p>
        </header>
        {collectionLabel ? (
          <span className="w-fit border border-ink/15 bg-paper px-2.5 py-1 text-[0.68rem] font-black uppercase text-ink-soft">
            Colección: {collectionLabel}
          </span>
        ) : null}
        <p className={`${isList ? 'line-clamp-2' : 'line-clamp-3'} text-sm leading-6 text-ink-soft`}>
          {resource.description}
        </p>
        <footer className="mt-auto flex flex-col gap-3 text-xs font-black uppercase text-ink-soft/75">
          <div className="flex flex-wrap items-center gap-2">
            <span>{resource.hasReader ? `${resource.pageCount} páginas` : 'Descargable'}</span>
            {progressPercent > 0 ? <span className="text-accent">{progressPercent}% leído</span> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/details/${resource.id}`}
              className="inline-flex min-h-9 items-center justify-center border border-ink/20 px-3 text-ink transition hover:border-ink"
            >
              Detalles
            </Link>
            <Link
              to={`/edit/${resource.id}`}
              className="inline-flex min-h-9 items-center justify-center gap-1 border border-ink/20 px-3 text-ink transition hover:border-ink"
            >
              <Icon name="edit" className="h-3.5 w-3.5" />
              Editar
            </Link>
            {resource.hasReader ? (
              <Link
                to={`/read/${resource.id}`}
                className="inline-flex min-h-9 items-center justify-center gap-1 bg-ink px-3 text-paper transition hover:bg-primary"
              >
                <Icon name="book" className="h-3.5 w-3.5" />
                Leer
              </Link>
            ) : hasDownload ? (
              <a
                href={resource.downloadUrl ?? '#'}
                className="inline-flex min-h-9 items-center justify-center gap-1 bg-ink px-3 text-paper transition hover:bg-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="download" className="h-3.5 w-3.5" />
                Descargar
              </a>
            ) : null}
            {onDelete != null ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(resource);
                }}
                disabled={isDeleting}
                className="inline-flex min-h-9 items-center justify-center gap-1 border border-primary/40 px-3 text-primary transition hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon name="trash" className="h-3.5 w-3.5" />
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </article>
  );
}

export default ResourceCard;
