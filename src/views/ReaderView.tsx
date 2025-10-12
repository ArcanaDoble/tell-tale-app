import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageViewer from '../components/PageViewer';
import type { Resource } from '../types/library';
import { getResourceById } from '../services/libraryService';

function ReaderView(): JSX.Element {
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

  if (isLoading) {
    return (
      <section className="grid flex-1 place-items-center rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-slate-400">
        Preparando lector...
      </section>
    );
  }

  if (resource == null) {
    return (
      <section className="grid flex-1 place-items-center rounded-2xl border border-rose-900/60 bg-rose-950/40 p-12 text-rose-200">
        No encontramos el contenido solicitado.
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{resource.title}</h1>
          <p className="text-sm text-slate-400">Por {resource.author}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            to={`/details/${resource.id}`}
            className="rounded-full border border-slate-700 px-4 py-2 font-semibold text-slate-200 transition hover:border-primary hover:text-primary"
          >
            Ver detalles
          </Link>
          <Link
            to="/"
            className="rounded-full border border-slate-700 px-4 py-2 font-semibold text-slate-200 transition hover:border-primary hover:text-primary"
          >
            Volver a la biblioteca
          </Link>
        </div>
      </div>
      {resource.hasReader ? (
        <PageViewer pages={resource.pages} />
      ) : (
        <div className="grid flex-1 place-items-center rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-center text-slate-300">
          <div className="flex max-w-xl flex-col items-center gap-4">
            <p className="text-lg font-semibold text-white">Este recurso no tiene visor disponible.</p>
            <p>
              Puedes descargar el archivo para leerlo en tu dispositivo favorito. Si esperabas ver páginas aquí, verifica que el
              recurso subido incluya imágenes.
            </p>
            {resource.downloadUrl != null ? (
              <a
                href={resource.downloadUrl}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/80"
                target="_blank"
                rel="noopener noreferrer"
              >
                Descargar archivo
              </a>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

export default ReaderView;
