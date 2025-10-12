import { useEffect, useMemo, useState } from 'react';
import ResourceCard from '../components/ResourceCard';
import UploadResourceDialog from '../components/UploadResourceDialog';
import type { Resource, ResourceFormat, ResourceMeta } from '../types/library';
import { getLibrary } from '../services/libraryService';

const formatLabels: Record<ResourceFormat, string> = {
  images: 'Imágenes',
  pdf: 'PDF',
  epub: 'EPUB',
  cbz: 'CBZ/ZIP',
  txt: 'Texto',
  other: 'Otro'
};

const formatFilters: Array<{ value: 'all' | ResourceFormat; label: string }> = [
  { value: 'all', label: 'Todos los formatos' },
  ...Object.entries(formatLabels).map(([value, label]) => ({ value: value as ResourceFormat, label }))
];

const toMeta = (resource: ResourceMeta | Resource): ResourceMeta => ({
  id: resource.id,
  title: resource.title,
  description: resource.description,
  author: resource.author,
  coverUrl: resource.coverUrl,
  tags: resource.tags,
  pageCount: resource.pageCount,
  format: resource.format,
  updatedAt: resource.updatedAt
});

function LibraryView(): JSX.Element {
  const [resources, setResources] = useState<ResourceMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | ResourceFormat>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    const fetchResources = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const items = await getLibrary();
        setResources(items);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('No pudimos cargar la biblioteca. Intenta nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchResources();
  }, []);

  const handleResourceCreated = (resource: Resource): void => {
    setResources((previous) => {
      const meta = toMeta(resource);
      const others = previous.filter((item) => item.id !== meta.id);
      return [meta, ...others];
    });
  };

  const filteredResources = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        resource.title.toLowerCase().includes(normalizedSearch) ||
        resource.author.toLowerCase().includes(normalizedSearch) ||
        resource.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));
      const matchesFormat = formatFilter === 'all' || resource.format === formatFilter;
      return matchesSearch && matchesFormat;
    });
  }, [resources, searchTerm, formatFilter]);

  const libraryStats = useMemo(() => {
    const totalPages = filteredResources.reduce((sum, resource) => sum + resource.pageCount, 0);
    const tagSet = new Set<string>();
    filteredResources.forEach((resource) => {
      resource.tags.forEach((tag) => {
        tagSet.add(tag);
      });
    });
    const lastUpdated = filteredResources
      .map((resource) => resource.updatedAt)
      .filter((value): value is string => value != null)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

    return {
      totalItems: filteredResources.length,
      totalPages,
      tags: Array.from(tagSet).slice(0, 6),
      lastUpdated
    };
  }, [filteredResources]);

  return (
    <section className="flex flex-1 flex-col gap-10">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-6 sm:p-10">
        <div className="absolute -right-10 top-6 hidden h-48 w-48 rounded-full bg-primary/20 blur-3xl lg:block" />
        <div className="absolute -bottom-16 left-4 hidden h-52 w-52 rounded-full bg-accent/20 blur-3xl lg:block" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Tu biblioteca digital</p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Todo tu manga y lectura, sincronizado en móvil, tablet y escritorio.
            </h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Sube capítulos en PDF, EPUB o imágenes, organiza tus colecciones por etiquetas y continúa la lectura desde cualquier dispositivo.
            </p>
            {libraryStats.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-400">
                {libraryStats.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-700/80 px-3 py-1">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-800/70 bg-slate-950/60 p-6 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs uppercase tracking-wide text-slate-400">Títulos guardados</span>
              <span className="text-2xl font-semibold text-white">{libraryStats.totalItems}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs uppercase tracking-wide text-slate-400">Páginas disponibles</span>
              <span className="text-xl font-semibold text-white">{libraryStats.totalPages}</span>
            </div>
            {libraryStats.lastUpdated != null && (
              <div className="flex flex-col gap-1 text-xs text-slate-500">
                <span className="font-semibold text-slate-300">Actualizado</span>
                <span>{new Date(libraryStats.lastUpdated).toLocaleString()}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setIsUploadOpen(true);
              }}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary/80"
            >
              ➕ Añadir nuevo
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 shadow-xl sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 flex-col gap-2">
            <label className="text-sm font-semibold text-slate-200">Buscar en tu biblioteca</label>
            <div className="relative">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                }}
                placeholder="Título, autor o etiqueta"
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 transition focus:border-primary focus:outline-none"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className="text-sm font-semibold text-slate-200">Filtrar por formato</label>
            <div className="flex flex-wrap gap-2">
              {formatFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => {
                    setFormatFilter(filter.value);
                  }}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    formatFilter === filter.value
                      ? 'border-primary/80 bg-primary/10 text-primary'
                      : 'border-slate-700/70 text-slate-300 hover:border-primary/40 hover:text-slate-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>{filteredResources.length} resultados</span>
          <button
            type="button"
            onClick={() => {
              setIsUploadOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-dashed border-primary/60 px-4 py-2 font-semibold text-primary transition hover:bg-primary/10"
          >
            📤 Subir contenido
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid flex-1 place-items-center rounded-3xl border border-slate-800 bg-slate-950/60 p-12 text-slate-400">
          Cargando biblioteca...
        </div>
      ) : error != null ? (
        <div className="grid flex-1 place-items-center rounded-3xl border border-rose-900/60 bg-rose-950/50 p-12 text-rose-200">
          {error}
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl border border-slate-800 bg-slate-950/60 p-12 text-center text-slate-300">
          <span className="text-4xl">📭</span>
          <h2 className="text-2xl font-semibold text-white">No encontramos coincidencias</h2>
          <p className="max-w-md text-sm text-slate-400">
            Ajusta tus filtros o sube un nuevo archivo para comenzar tu biblioteca digital.
          </p>
          <button
            type="button"
            onClick={() => {
              setIsUploadOpen(true);
            }}
            className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary/80"
          >
            Añadir el primer título
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}

      <UploadResourceDialog
        open={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
        }}
        onCreated={handleResourceCreated}
      />
    </section>
  );
}

export default LibraryView;
