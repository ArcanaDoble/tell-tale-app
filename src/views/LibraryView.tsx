import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ResourceCard from '../components/ResourceCard';
import type { ResourceMeta } from '../types/library';
import { getLibrary } from '../services/libraryService';

function LibraryView(): JSX.Element {
  const [resources, setResources] = useState<ResourceMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const items = await getLibrary();
        setResources(items);
      } catch (err) {
        setError('No pudimos cargar la biblioteca. Intenta nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchResources();
  }, []);

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
      {isLoading ? (
        <div className="grid flex-1 place-items-center rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-slate-400">
          Cargando biblioteca...
        </div>
      ) : error != null ? (
        <div className="grid flex-1 place-items-center rounded-2xl border border-rose-900/60 bg-rose-950/40 p-12 text-rose-200">
          {error}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </section>
  );
}

export default LibraryView;
