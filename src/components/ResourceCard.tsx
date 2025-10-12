import { Link } from 'react-router-dom';
import type { ResourceMeta } from '../types/library';

const formatLabels: Record<ResourceMeta['format'], string> = {
  images: 'Imágenes',
  pdf: 'PDF',
  epub: 'EPUB',
  cbz: 'CBZ',
  txt: 'Texto',
  other: 'Otro'
};

interface ResourceCardProps {
  resource: ResourceMeta;
}

function ResourceCard({ resource }: ResourceCardProps): JSX.Element {
  const formatLabel = formatLabels[resource.format] ?? 'Otro';

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[26px] border border-white/10 bg-surface/80 shadow-lg shadow-primary/10 transition duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-glow">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={resource.coverUrl}
          alt={resource.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent p-4 text-xs font-semibold uppercase tracking-wide text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-[11px] font-semibold">
            {formatLabel} · {resource.pageCount} páginas
          </span>
        </div>
        <div className="absolute left-3 top-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-white">
          {resource.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-primary/80 px-3 py-1 shadow-glow">
              #{tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <header className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-lg font-semibold text-white">{resource.title}</h3>
          <p className="text-sm text-slate-400">{resource.author}</p>
        </header>
        <p className="line-clamp-3 text-sm text-slate-300">{resource.description}</p>
        <div className="mt-auto flex flex-col gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">
            <span className="inline-flex h-2 w-2 rounded-full bg-primary/70" />
            Actualizado {resource.updatedAt != null ? new Date(resource.updatedAt).toLocaleDateString() : 'recientemente'}
          </span>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/details/${resource.id}`}
              className="inline-flex flex-1 min-w-[110px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-primary/60 hover:text-primary"
            >
              Ver ficha
            </Link>
            <Link
              to={`/read/${resource.id}`}
              className="inline-flex flex-1 min-w-[110px] items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-glow transition hover:bg-primary/80"
            >
              Leer ahora
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ResourceCard;
