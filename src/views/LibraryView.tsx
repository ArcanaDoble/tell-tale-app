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
    <section className="relative flex flex-1 flex-col gap-8 pb-24 lg:gap-12 lg:pb-10">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-glow transition lg:p-10">
        <div className="absolute -left-12 top-10 h-44 w-44 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute inset-0 bg-grid-light bg-[size:72px_72px] opacity-[0.12]" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              Biblioteca sincronizada
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Toda tu colección, lista para leer donde quieras.
            </h1>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              Gestiona mangas, cómics y novelas en un panel pensado para móvil. Busca por etiqueta, formato o autor y retoma justo donde lo dejaste.
            </p>
            {libraryStats.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-400">
                {libraryStats.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-surface/80 p-4 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-wide text-slate-400">Títulos guardados</span>
              <span className="text-3xl font-semibold text-white">{libraryStats.totalItems}</span>
              <span className="text-xs text-slate-500">Colección activa sincronizada con la nube</span>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-surface/80 p-4 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-wide text-slate-400">Páginas disponibles</span>
              <span className="text-2xl font-semibold text-white">{libraryStats.totalPages}</span>
              <span className="text-xs text-slate-500">Perfecto para lecturas offline en móvil</span>
            </div>
            {libraryStats.lastUpdated != null && (
              <div className="col-span-full flex items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-xs text-primary">
                <div className="flex flex-col">
                  <span className="font-semibold uppercase tracking-wide">Última actualización</span>
                  <span className="text-primary/80">{new Date(libraryStats.lastUpdated).toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/60 bg-primary px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:bg-primary/80"
                >
                  ➕ Añadir título
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr,1fr]">
        <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-surface/80 p-4 sm:p-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-200">Buscar en tu biblioteca</label>
            <div className="relative">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                }}
                placeholder="Título, autor o etiqueta"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 shadow-inner transition focus:border-primary focus:bg-white/[0.06] focus:outline-none"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-200">Filtrar por formato</span>
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
                      ? 'border-primary/70 bg-primary/20 text-primary shadow-glow'
                      : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-primary/40 hover:text-slate-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              {filteredResources.length} resultados encontrados
            </span>
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

        <div className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Atajos rápidos</span>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button
              type="button"
              onClick={() => {
                setFormatFilter('images');
              }}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-surface/70 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-primary/50 hover:bg-primary/10"
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Lectura visual</span>
                <span className="text-xs text-slate-400">Filtra mangas en formato de imágenes</span>
              </div>
              <span className="text-xl transition group-hover:translate-x-1">🖼️</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFormatFilter('pdf');
              }}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-surface/70 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-primary/50 hover:bg-primary/10"
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Documentos listos</span>
                <span className="text-xs text-slate-400">Accede rápidamente a tus PDFs</span>
              </div>
              <span className="text-xl transition group-hover:translate-x-1">📄</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFormatFilter('epub');
              }}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-surface/70 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-primary/50 hover:bg-primary/10"
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Modo lectura larga</span>
                <span className="text-xs text-slate-400">Ideal para novelas EPUB</span>
              </div>
              <span className="text-xl transition group-hover:translate-x-1">📚</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid flex-1 gap-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-2 sm:p-8 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="flex animate-pulse flex-col gap-4 rounded-3xl border border-white/5 bg-surface/60 p-4"
            >
              <div className="h-44 rounded-2xl bg-white/5" />
              <div className="h-4 w-3/4 rounded-full bg-white/5" />
              <div className="h-3 w-1/2 rounded-full bg-white/5" />
              <div className="h-3 w-full rounded-full bg-white/5" />
              <div className="mt-auto h-9 rounded-full bg-white/5" />
            </div>
          ))}
        </div>
      ) : error != null ? (
        <div className="grid flex-1 place-items-center rounded-[28px] border border-rose-900/60 bg-rose-950/50 p-12 text-rose-200">
          {error}
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-12 text-center text-slate-300">
          <span className="text-5xl">📭</span>
          <h2 className="text-2xl font-semibold text-white">Tu biblioteca aún está vacía</h2>
          <p className="max-w-md text-sm text-slate-400">
            Ajusta los filtros o sube un nuevo archivo para comenzar a construir tu colección personal.
          </p>
          <button
            type="button"
            onClick={() => {
              setIsUploadOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-primary/80"
          >
            ➕ Añadir el primer título
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setIsUploadOpen(true);
        }}
        className={`fixed bottom-24 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-2xl text-white shadow-glow-accent transition focus:outline-none focus:ring-2 focus:ring-primary/60 lg:hidden ${
          isUploadOpen ? 'pointer-events-none scale-95 opacity-0' : 'hover:scale-105'
        }`}
        aria-label="Subir nuevo contenido"
      >
        ➕
      </button>

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
