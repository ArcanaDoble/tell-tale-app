import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import ResourceCard from '../components/ResourceCard';
import type { ResourceMeta, ResourceType } from '../types/library';
import { deleteResource, getLibrary } from '../services/libraryService';
import { getProgressPercent, getReadingProgress } from '../utils/readingProgress';

type CollectionFilter = 'all' | 'none' | string;
type AvailabilityFilter = 'all' | 'reader' | 'download';
type SortMode = 'recent' | 'title' | 'author' | 'pages';
type ViewMode = 'grid' | 'list';

const typeLabels: Record<ResourceType, string> = {
  manga: 'Manga',
  libro: 'Libros',
  documento: 'Documentos'
};

function LibraryView(): JSX.Element {
  const [resources, setResources] = useState<ResourceMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ResourceType>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchResources = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setFeedback(null);
        const items = await getLibrary();
        setResources(items);
        setLoadError(null);
      } catch (err) {
        setLoadError('No pudimos cargar la biblioteca. Intenta nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchResources();
  }, []);

  const collectionOptions = useMemo(() => {
    const counts = new Map<string, { id: string; name: string; count: number }>();
    let withoutCollection = 0;

    for (const resource of resources) {
      const id = resource.collectionId ?? undefined;
      const name = resource.collectionName?.trim();
      if (id != null && name != null && name.length > 0) {
        const current = counts.get(id) ?? { id, name, count: 0 };
        counts.set(id, { ...current, name, count: current.count + 1 });
      } else {
        withoutCollection += 1;
      }
    }

    const sortedCollections = Array.from(counts.values()).sort((a, b) => a.name.localeCompare(b.name));

    return {
      collections: sortedCollections,
      withoutCollection
    };
  }, [resources]);

  const progressById = useMemo(() => {
    const entries = resources.map((resource) => [
      resource.id,
      getProgressPercent(getReadingProgress(resource.id), resource.pageCount)
    ] as const);
    return new Map(entries);
  }, [resources]);

  const continueReading = useMemo(() => {
    return resources
      .map((resource) => ({
        resource,
        progress: getReadingProgress(resource.id),
        percent: progressById.get(resource.id) ?? 0
      }))
      .filter((item) => item.progress != null && item.percent > 0 && item.percent < 100 && item.resource.hasReader)
      .sort((a, b) => {
        const aTime = a.progress?.updatedAt ?? '';
        const bTime = b.progress?.updatedAt ?? '';
        return bTime.localeCompare(aTime);
      })[0];
  }, [progressById, resources]);

  const typeCounts = useMemo(() => {
    return resources.reduce<Record<ResourceType, number>>(
      (counts, resource) => ({ ...counts, [resource.resourceType]: counts[resource.resourceType] + 1 }),
      { manga: 0, libro: 0, documento: 0 }
    );
  }, [resources]);

  const filteredResources = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return resources
      .filter((resource) => {
        if (collectionFilter === 'none') {
          return resource.collectionId == null || resource.collectionName == null;
        }
        if (collectionFilter !== 'all' && resource.collectionId !== collectionFilter) {
          return false;
        }
        if (typeFilter !== 'all' && resource.resourceType !== typeFilter) {
          return false;
        }
        if (availabilityFilter === 'reader' && !resource.hasReader) {
          return false;
        }
        if (availabilityFilter === 'download' && resource.downloadUrl == null) {
          return false;
        }
        if (normalizedQuery.length === 0) {
          return true;
        }

        const searchable = [
          resource.title,
          resource.author,
          resource.description,
          resource.collectionName ?? '',
          ...resource.tags
        ]
          .join(' ')
          .toLocaleLowerCase();

        return searchable.includes(normalizedQuery);
      })
      .sort((a, b) => {
        switch (sortMode) {
          case 'title':
            return a.title.localeCompare(b.title);
          case 'author':
            return a.author.localeCompare(b.author);
          case 'pages':
            return b.pageCount - a.pageCount;
          case 'recent':
          default:
            return 0;
        }
      });
  }, [availabilityFilter, collectionFilter, query, resources, sortMode, typeFilter]);

  const handleDelete = async (resource: ResourceMeta): Promise<void> => {
    const confirmed = window.confirm(
      `¿Deseas eliminar "${resource.title}" de la biblioteca? Esta acción no se puede deshacer.`
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(resource.id);
    setFeedback(null);

    try {
      await deleteResource(resource.id);
      setResources((prevResources) => prevResources.filter((item) => item.id !== resource.id));
      setFeedback({ type: 'success', message: `"${resource.title}" se eliminó correctamente.` });
    } catch (error) {
      console.error('Error deleting resource', error);
      setFeedback({ type: 'error', message: 'No pudimos eliminar el recurso. Intenta nuevamente.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr),360px]">
        <div className="manga-panel overflow-hidden border-2 border-ink bg-paper-soft shadow-[7px_7px_0_rgba(22,19,18,0.22)]">
          <div className="relative flex min-h-[260px] flex-col justify-between gap-7 p-5 sm:p-7">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black leading-none text-ink sm:text-5xl">Biblioteca</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink-soft sm:text-lg">
                Lectura limpia para manga, libros ilustrados y documentos. Busca, filtra, continúa donde lo dejaste y abre el lector a pantalla completa.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-ink/15 bg-paper p-3">
                <span className="text-2xl font-black">{resources.length}</span>
                <p className="text-xs font-black uppercase text-ink-soft/70">Títulos</p>
              </div>
              <div className="border border-ink/15 bg-paper p-3">
                <span className="text-2xl font-black">{resources.filter((item) => item.hasReader).length}</span>
                <p className="text-xs font-black uppercase text-ink-soft/70">Con lector</p>
              </div>
              <div className="border border-ink/15 bg-paper p-3">
                <span className="text-2xl font-black">{collectionOptions.collections.length}</span>
                <p className="text-xs font-black uppercase text-ink-soft/70">Series</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col justify-between gap-4 border-2 border-ink bg-ink p-5 text-paper shadow-[7px_7px_0_rgba(185,45,58,0.32)]">
          <div>
            <p className="text-xs font-black uppercase text-paper/60">Lectura activa</p>
            {continueReading != null ? (
              <div className="mt-3 flex gap-4">
                <img
                  src={continueReading.resource.coverUrl}
                  alt={continueReading.resource.title}
                  className="h-28 w-20 border border-paper/20 object-cover"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <h2 className="line-clamp-2 text-xl font-black leading-tight">{continueReading.resource.title}</h2>
                  <p className="text-sm text-paper/70">{continueReading.percent}% completado</p>
                  <div className="h-1.5 bg-paper/20">
                    <div className="h-full bg-accent" style={{ width: `${continueReading.percent}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-paper/70">
                Cuando empieces un título, aparecerá aquí para retomarlo rápido.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {continueReading != null ? (
              <Link
                to={`/read/${continueReading.resource.id}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 bg-paper px-4 text-sm font-black uppercase text-ink transition hover:bg-accent hover:text-paper"
              >
                <Icon name="book" className="h-4 w-4" />
                Continuar
              </Link>
            ) : null}
            <Link
              to="/upload"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 border border-paper/25 px-4 text-sm font-black uppercase text-paper transition hover:border-paper"
            >
              <Icon name="plus" className="h-4 w-4" />
              Añadir
            </Link>
          </div>
        </aside>
      </div>

      <div className="grid gap-4 border-2 border-ink/15 bg-paper-soft p-4 shadow-[5px_5px_0_rgba(22,19,18,0.12)] lg:grid-cols-[minmax(240px,1fr),auto,auto]">
        <label className="flex min-h-12 items-center gap-3 border border-ink/15 bg-paper px-3">
          <Icon name="search" className="h-5 w-5 text-ink-soft/70" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Buscar por título, autor, colección o etiqueta"
            className="min-w-0 flex-1 bg-transparent text-base font-semibold text-ink placeholder:text-ink-soft/45 focus:outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          {(['all', 'reader', 'download'] as AvailabilityFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              className={`min-h-12 border px-3 text-sm font-black uppercase transition ${
                availabilityFilter === filter
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/15 bg-paper text-ink hover:border-ink/45'
              }`}
              onClick={() => {
                setAvailabilityFilter(filter);
              }}
            >
              {filter === 'all' ? 'Todo' : filter === 'reader' ? 'Leer' : 'Descargar'}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <select
            value={sortMode}
            onChange={(event) => {
              setSortMode(event.target.value as SortMode);
            }}
            className="min-h-12 flex-1 border border-ink/15 bg-paper px-3 text-sm font-black uppercase text-ink focus:border-primary focus:outline-none"
            aria-label="Ordenar biblioteca"
          >
            <option value="recent">Orden original</option>
            <option value="title">Título</option>
            <option value="author">Autor</option>
            <option value="pages">Más páginas</option>
          </select>
          <button
            type="button"
            className="grid min-h-12 w-12 place-items-center border border-ink/15 bg-paper text-ink transition hover:border-ink/45"
            onClick={() => {
              setViewMode((current) => (current === 'grid' ? 'list' : 'grid'));
            }}
            aria-label={viewMode === 'grid' ? 'Cambiar a lista' : 'Cambiar a cuadrícula'}
          >
            <Icon name={viewMode === 'grid' ? 'list' : 'grid'} className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm font-black uppercase text-ink-soft">
          <Icon name="filter" className="h-4 w-4" />
          <span>Tipos</span>
          <button
            type="button"
            className={`border px-3 py-2 transition ${
              typeFilter === 'all' ? 'border-ink bg-ink text-paper' : 'border-ink/15 bg-paper-soft hover:border-ink/45'
            }`}
            onClick={() => {
              setTypeFilter('all');
            }}
          >
            Todos ({resources.length})
          </button>
          {(Object.keys(typeLabels) as ResourceType[]).map((type) => (
            <button
              key={type}
              type="button"
              className={`border px-3 py-2 transition ${
                typeFilter === type ? 'border-ink bg-ink text-paper' : 'border-ink/15 bg-paper-soft hover:border-ink/45'
              }`}
              onClick={() => {
                setTypeFilter(type);
              }}
            >
              {typeLabels[type]} ({typeCounts[type]})
            </button>
          ))}
        </div>

        {collectionOptions.collections.length > 0 || collectionOptions.withoutCollection > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-sm font-black uppercase text-ink-soft">
            <span>Colecciones</span>
            <button
              type="button"
              className={`border px-3 py-2 transition ${
                collectionFilter === 'all'
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/15 bg-paper-soft hover:border-ink/45'
              }`}
              onClick={() => {
                setCollectionFilter('all');
              }}
            >
              Todas ({resources.length})
            </button>
            {collectionOptions.collections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                className={`border px-3 py-2 transition ${
                  collectionFilter === collection.id
                    ? 'border-ink bg-ink text-paper'
                    : 'border-ink/15 bg-paper-soft hover:border-ink/45'
                }`}
                onClick={() => {
                  setCollectionFilter(collection.id);
                }}
              >
                {collection.name} ({collection.count})
              </button>
            ))}
            {collectionOptions.withoutCollection > 0 ? (
              <button
                type="button"
                className={`border px-3 py-2 transition ${
                  collectionFilter === 'none'
                    ? 'border-ink bg-ink text-paper'
                    : 'border-ink/15 bg-paper-soft hover:border-ink/45'
                }`}
                onClick={() => {
                  setCollectionFilter('none');
                }}
              >
                Sin colección ({collectionOptions.withoutCollection})
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {feedback != null ? (
        <div
          className={`border-2 p-4 text-sm font-semibold ${
            feedback.type === 'success'
              ? 'border-accent bg-accent/10 text-ink'
              : 'border-primary bg-primary/10 text-primary'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid min-h-72 flex-1 place-items-center border-2 border-ink/15 bg-paper-soft p-12 text-ink-soft">
          Cargando biblioteca...
        </div>
      ) : loadError != null ? (
        <div className="grid min-h-72 flex-1 place-items-center border-2 border-primary bg-primary/10 p-12 text-primary">
          {loadError}
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="grid min-h-72 flex-1 place-items-center border-2 border-ink/15 bg-paper-soft p-8 text-center text-ink-soft">
          No hay recursos que coincidan con los filtros actuales.
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-4' : 'grid gap-4'}>
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onDelete={handleDelete}
              isDeleting={deletingId === resource.id}
              progressPercent={progressById.get(resource.id) ?? 0}
              variant={viewMode}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default LibraryView;
