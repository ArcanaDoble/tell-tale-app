import { Link } from 'react-router-dom';
import type { ResourceMeta } from '../types/library';

interface ResourceCardProps {
  resource: ResourceMeta;
}

function ResourceCard({ resource }: ResourceCardProps): JSX.Element {
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
          {resource.tags[0] ?? 'Nuevo'}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-white">{resource.title}</h3>
          <p className="text-sm text-slate-400">{resource.author}</p>
        </header>
        <p className="line-clamp-3 text-sm text-slate-300">{resource.description}</p>
        <footer className="mt-auto flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
          <span>{resource.pageCount} páginas</span>
          <div className="flex gap-2">
            <Link
              to={`/details/${resource.id}`}
              className="rounded-full border border-slate-700 px-3 py-1 font-medium text-slate-200 transition hover:border-primary hover:text-primary"
            >
              Detalles
            </Link>
            <Link
              to={`/read/${resource.id}`}
              className="rounded-full bg-primary px-3 py-1 font-semibold text-white transition hover:bg-primary/80"
            >
              Leer
            </Link>
          </div>
        </footer>
      </div>
    </article>
  );
}

export default ResourceCard;
