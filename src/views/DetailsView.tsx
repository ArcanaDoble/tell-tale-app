import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BookmarkButton from '../components/BookmarkButton';
import type { Resource } from '../types/library';
import { getResourceById } from '../services/libraryService';

const formatLabels = {
  images: 'Lector por imágenes',
  pdf: 'Documento PDF',
  epub: 'Libro EPUB',
  cbz: 'Comic CBZ/ZIP',
  txt: 'Documento de texto',
  other: 'Formato personalizado'
} as const;

type FormatKey = keyof typeof formatLabels;

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

  if (isLoading) {
    return (
      <section className="grid flex-1 place-items-center rounded-3xl border border-slate-800 bg-slate-950/60 p-12 text-slate-400">
        Cargando detalles...
      </section>
    );
  }

  if (resource == null) {
    return (
      <section className="grid flex-1 place-items-center rounded-3xl border border-rose-900/60 bg-rose-950/50 p-12 text-rose-200">
        El recurso solicitado no se encontró.
      </section>
    );
  }

  const formatDescription = formatLabels[(resource.format as FormatKey) ?? 'other'] ?? formatLabels.other;

  return (
    <section className="flex flex-1 flex-col gap-8">
      <div className="grid gap-8 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl lg:grid-cols-[2fr,3fr] lg:p-10">
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-3xl border border-slate-800">
            <img src={resource.coverUrl} alt={resource.title} className="w-full object-cover" />
          </div>
          <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 text-sm text-slate-300">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
              <span className="rounded-full border border-slate-700 px-3 py-1">{resource.pageCount} páginas</span>
              <span className="rounded-full border border-slate-700 px-3 py-1">
                {resource.updatedAt != null ? new Date(resource.updatedAt).toLocaleDateString() : 'Reciente'}
              </span>
            </div>
            <p className="text-sm text-slate-300">{formatDescription}</p>
            {resource.fileUrl != null && (
              <a
                href={resource.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-primary/50 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                ⬇️ Descargar {resource.fileName ?? 'archivo'}
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-primary">
              <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1">{formatLabels[(resource.format as FormatKey) ?? 'other']}</span>
            </div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">{resource.title}</h1>
            <p className="text-sm text-slate-400">Por {resource.author}</p>
          </header>
          <p className="text-base leading-relaxed text-slate-200">{resource.description}</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300"
              >
                #{tag}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/read/${resource.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary/80"
            >
              📖 Abrir lector
            </Link>
            <BookmarkButton resourceId={resource.id} />
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-primary hover:text-primary"
            >
              ← Volver a la biblioteca
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 text-sm text-slate-300">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Consejos de lectura</h2>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>Activa el modo pantalla completa en el lector para una experiencia inmersiva.</li>
              <li>Si lees en tablet, gira el dispositivo para aprovechar la vista apaisada.</li>
              <li>Puedes guardar el enlace en tus marcadores para continuar justo donde lo dejaste.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DetailsView;
