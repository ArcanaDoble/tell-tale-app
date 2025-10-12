import { Link } from 'react-router-dom';
import type { ResourceMeta } from '../types/library';

interface ResourceCardProps {
  resource: ResourceMeta;
  onDelete?: (resource: ResourceMeta) => void;
  isDeleting?: boolean;
}

const typeLabels: Record<ResourceMeta['resourceType'], string> = {
  manga: 'Manga',
  libro: 'Libro',
  documento: 'Documento'
};

function ResourceCard({ resource, onDelete, isDeleting = false }: ResourceCardProps): JSX.Element {
  const label = typeLabels[resource.resourceType] ?? 'Nuevo';
  const hasDownload = !resource.hasReader && resource.downloadUrl != null;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-lg transition hover:border-primary/70 hover:shadow-primary/20">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={resource.coverUrl}
          alt={resource.title}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {label}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-white">{resource.title}</h3>
          <p className="text-sm text-slate-400">{resource.author}</p>
        </header>
        <p className="line-clamp-3 text-sm text-slate-300">{resource.description}</p>
        <footer className="mt-auto flex items-center justify-between gap-3 text-xs uppercase tracking-wide text-slate-400">
          <span>{resource.hasReader ? `${resource.pageCount} páginas` : 'Disponible para descarga'}</span>
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              to={`/details/${resource.id}`}
              className="rounded-full border border-slate-700 px-3 py-1 font-medium text-slate-200 transition hover:border-primary hover:text-primary"
            >
              Detalles
            </Link>
            {resource.hasReader ? (
              <Link
                to={`/read/${resource.id}`}
                className="rounded-full bg-primary px-3 py-1 font-semibold text-white transition hover:bg-primary/80"
              >
                Leer
              </Link>
            ) : hasDownload ? (
              <a
                href={resource.downloadUrl ?? '#'}
                className="rounded-full bg-primary px-3 py-1 font-semibold text-white transition hover:bg-primary/80"
                target="_blank"
                rel="noopener noreferrer"
              >
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
                className="rounded-full border border-rose-700 px-3 py-1 font-semibold text-rose-200 transition hover:bg-rose-600/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </article>
  );
}

export default ResourceCard;
