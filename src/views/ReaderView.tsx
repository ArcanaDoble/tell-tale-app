import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import PageViewer from '../components/PageViewer';
import type { Resource } from '../types/library';
import { getResourceById } from '../services/libraryService';
import { getReadingProgress } from '../utils/readingProgress';

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
      <section className="grid min-h-screen place-items-center bg-reader-night p-12 text-paper/65">
        Preparando lector...
      </section>
    );
  }

  if (resource == null) {
    return (
      <section className="grid min-h-screen place-items-center bg-reader-night p-6 text-paper">
        <div className="max-w-md border border-primary/60 bg-primary/10 p-6 text-center">
          No encontramos el contenido solicitado.
        </div>
      </section>
    );
  }

  const storedProgress = getReadingProgress(resource.id);
  const initialPage =
    storedProgress != null && storedProgress.totalPages === resource.pageCount ? storedProgress.page : 0;

  return (
    <section className="flex h-[100dvh] min-h-[100svh] flex-col overflow-hidden bg-reader-night">
      <div className="z-30 hidden shrink-0 flex-col gap-3 border-b border-paper/10 bg-reader-night/94 px-4 py-3 text-paper backdrop-blur xl:flex xl:flex-row xl:items-center xl:justify-between xl:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black xl:text-2xl">{resource.title}</h1>
          <p className="text-sm text-paper/55">Por {resource.author}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-black uppercase">
          <Link
            to={`/details/${resource.id}`}
            className="inline-flex min-h-10 items-center justify-center gap-2 border border-paper/20 px-3 text-paper transition hover:border-paper"
          >
            <Icon name="book" className="h-4 w-4" />
            Ver detalles
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-10 items-center justify-center gap-2 bg-paper px-3 text-ink transition hover:bg-primary hover:text-paper"
          >
            <Icon name="library" className="h-4 w-4" />
            Biblioteca
          </Link>
        </div>
      </div>
      {resource.hasReader ? (
        <PageViewer pages={resource.pages} resourceId={resource.id} initialPage={initialPage} title={resource.title} />
      ) : (
        <div className="grid flex-1 place-items-center p-6 text-center text-paper/70">
          <div className="flex max-w-xl flex-col items-center gap-4">
            <p className="text-lg font-black text-paper">Este recurso no tiene visor disponible.</p>
            <p>
              Puedes descargar el archivo para leerlo en tu dispositivo favorito. Si esperabas ver páginas aquí, verifica que el
              recurso subido incluya imágenes.
            </p>
            {resource.downloadUrl != null ? (
              <a
                href={resource.downloadUrl}
                className="inline-flex min-h-11 items-center justify-center gap-2 bg-paper px-5 text-sm font-black uppercase text-ink transition hover:bg-primary hover:text-paper"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="download" className="h-4 w-4" />
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
