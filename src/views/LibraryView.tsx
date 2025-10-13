import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ResourceCard from '../components/ResourceCard';
import type { ResourceMeta } from '../types/library';
import { deleteResource, getLibrary } from '../services/libraryService';

function LibraryView(): JSX.Element {
  const [resources, setResources] = useState<ResourceMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'none' | string>('all');

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

  const filteredResources = useMemo(() => {
    if (collectionFilter === 'all') {
      return resources;
    }
    if (collectionFilter === 'none') {
      return resources.filter((resource) => resource.collectionId == null || resource.collectionName == null);
    }
    return resources.filter((resource) => resource.collectionId === collectionFilter);
  }, [collectionFilter, resources]);

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
      <header className="flex flex-col gap-3 text-center md:text-left">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Biblioteca</h1>
            <p className="text-slate-300">
              Explora mangas, libros ilustrados y documentos disponibles. Selecciona un título para ver sus detalles, leerlo en línea o descargarlo.
            </p>
          </div>
          <Link
            to="/upload"
            className="inline-flex items-center justify-center rounded-full border border-primary/40 bg-primary/10 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-primary transition hover:bg-primary/20"
          >
            Subir nuevo recurso
          </Link>
        </div>
      </header>
      {feedback != null ? (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-100'
              : 'border-rose-600/60 bg-rose-600/10 text-rose-100'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}
      {collectionOptions.collections.length > 0 || collectionOptions.withoutCollection > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 text-sm text-slate-300">
          <span className="text-xs uppercase tracking-wide text-slate-400">Colecciones</span>
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
              collectionFilter === 'all'
                ? 'bg-primary/20 text-primary'
                : 'border border-slate-700 text-slate-200 hover:border-primary hover:text-primary'
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
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                collectionFilter === collection.id
                  ? 'bg-primary/20 text-primary'
                  : 'border border-slate-700 text-slate-200 hover:border-primary hover:text-primary'
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
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                collectionFilter === 'none'
                  ? 'bg-primary/20 text-primary'
                  : 'border border-slate-700 text-slate-200 hover:border-primary hover:text-primary'
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
      {isLoading ? (
        <div className="grid flex-1 place-items-center rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-slate-400">
          Cargando biblioteca...
        </div>
      ) : loadError != null ? (
        <div className="grid flex-1 place-items-center rounded-2xl border border-rose-900/60 bg-rose-950/40 p-12 text-rose-200">
          {loadError}
        </div>
      ) : (
        <>
          {filteredResources.length === 0 ? (
            <div className="grid flex-1 place-items-center rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-slate-400">
              No hay recursos para la colección seleccionada todavía.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onDelete={handleDelete}
                  isDeleting={deletingId === resource.id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default LibraryView;
