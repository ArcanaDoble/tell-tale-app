import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isFirebaseConfigured } from '../firebase/config';
import { uploadResource } from '../services/libraryService';
import type { ResourceType } from '../types/library';
import { extractContentFiles, isArchiveFile } from '../services/archiveService';

interface FormState {
  title: string;
  description: string;
  author: string;
  tags: string;
  collectionName: string;
  resourceType: ResourceType;
  coverFile: File | null;
}

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

const defaultState: FormState = {
  title: '',
  description: '',
  author: '',
  tags: '',
  collectionName: '',
  resourceType: 'manga',
  coverFile: null
};

function UploadView(): JSX.Element {
  const [formState, setFormState] = useState<FormState>(defaultState);
  const [contentFiles, setContentFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [resourceId, setResourceId] = useState<string | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const acceptContent = useMemo(() => {
    if (formState.resourceType === 'documento') {
      return '.pdf,.epub,.txt,.doc,.docx,.odt';
    }
    return 'image/*,.cbz,.cbr,.zip,.rar';
  }, [formState.resourceType]);

  const allowMultiple = formState.resourceType !== 'documento';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage('');
    setResourceId(null);

    if (!isFirebaseConfigured) {
      setStatus('error');
      setMessage('Configura tus credenciales de Firebase para habilitar las cargas.');
      return;
    }

    if (isProcessingFiles) {
      setStatus('error');
      setMessage('Espera a que finalice la extracción de archivos antes de subir el recurso.');
      return;
    }

    if (contentFiles.length === 0) {
      setStatus('error');
      setMessage('Selecciona al menos un archivo de contenido para subir.');
      return;
    }

    try {
      setStatus('loading');
      setMessage('Optimizando imágenes y subiendo recurso, espera por favor...');
      setIsUploading(true);
      setUploadProgress(0);

          const tags = formState.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);
      const collectionName = formState.collectionName.trim();

      const newId = await uploadResource(
        {
          title: formState.title,
          description: formState.description,
          author: formState.author,
          tags,
          resourceType: formState.resourceType,
          contentFiles,
          coverFile: formState.coverFile ?? undefined,
          collectionName: collectionName.length > 0 ? collectionName : null
        },
        {
          onProgress: (progress) => {
            setUploadProgress(Math.round(progress * 100));
          }
        }
      );

      setStatus('success');
      setMessage('¡Recurso cargado correctamente! Ya puedes consultarlo desde la biblioteca.');
      setIsUploading(false);
      setUploadProgress(100);
      setResourceId(newId);
      setFormState(defaultState);
      setContentFiles([]);
      formElement?.reset();
    } catch (error) {
      console.error('No se pudo subir el recurso', error);
      setStatus('error');
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('No se pudo subir el recurso. Intenta nuevamente más tarde.');
      }
      setIsUploading(false);
    }
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6 overflow-x-hidden">
      <header className="flex flex-col gap-3 text-center md:text-left">
        <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Subir recurso</h1>
        <p className="max-w-3xl leading-7 text-ink-soft">
          Comparte nuevos mangas, libros ilustrados o documentos con tu comunidad. Los archivos se almacenarán en Firebase
          Storage y se registrarán en Firestore.
        </p>
      </header>
      {!isFirebaseConfigured ? (
        <div className="grid place-items-center border-2 border-primary bg-primary/10 p-10 text-primary">
          <div className="flex max-w-lg flex-col gap-3 text-center">
            <p className="text-lg font-semibold">Firebase no está configurado.</p>
            <p>Actualiza tus variables de entorno y recarga la aplicación para habilitar la subida de archivos.</p>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="flex min-w-0 max-w-full flex-col gap-6 overflow-hidden border-2 border-ink/15 bg-paper-soft p-5 shadow-[5px_5px_0_rgba(22,19,18,0.12)] sm:p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex min-w-0 flex-col gap-2 text-sm font-bold text-ink-soft">
              Título
              <input
                type="text"
                name="title"
                required
                value={formState.title}
                onChange={(event) => {
                  setFormState((prev) => ({ ...prev, title: event.target.value }));
                }}
                className="w-full min-w-0 max-w-full border border-ink/15 bg-paper px-4 py-2 text-base text-ink focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-2 text-sm font-bold text-ink-soft">
              Autor o editorial
              <input
                type="text"
                name="author"
                required
                value={formState.author}
                onChange={(event) => {
                  setFormState((prev) => ({ ...prev, author: event.target.value }));
                }}
                className="w-full min-w-0 max-w-full border border-ink/15 bg-paper px-4 py-2 text-base text-ink focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-2 text-sm font-bold text-ink-soft">
              Tipo de recurso
              <select
                name="resourceType"
                value={formState.resourceType}
                onChange={(event) => {
                  const value = event.target.value as ResourceType;
                  setFormState((prev) => ({ ...prev, resourceType: value }));
                  setContentFiles([]);
                }}
                className="w-full min-w-0 max-w-full truncate border border-ink/15 bg-paper px-4 py-2 text-base text-ink focus:border-primary focus:outline-none"
              >
                <option value="manga">Manga (imágenes secuenciales)</option>
                <option value="libro">Libro ilustrado</option>
                <option value="documento">Documento (PDF, EPUB, texto)</option>
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-2 text-sm font-bold text-ink-soft">
              Etiquetas (separadas por coma)
              <input
                type="text"
                name="tags"
                value={formState.tags}
                onChange={(event) => {
                  setFormState((prev) => ({ ...prev, tags: event.target.value }));
                }}
                placeholder="fantasía, aventura, misterio"
                className="w-full min-w-0 max-w-full border border-ink/15 bg-paper px-4 py-2 text-base text-ink focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-2 text-sm font-bold text-ink-soft">
              Colección (opcional)
              <input
                type="text"
                name="collectionName"
                value={formState.collectionName}
                onChange={(event) => {
                  setFormState((prev) => ({ ...prev, collectionName: event.target.value }));
                }}
                placeholder="Saga nocturna, Temporada 1, Colección personal"
                className="w-full min-w-0 max-w-full border border-ink/15 bg-paper px-4 py-2 text-base text-ink focus:border-primary focus:outline-none"
              />
              <span className="text-xs text-ink-soft/60">Agrupa recursos relacionados indicando el nombre de la colección.</span>
            </label>
          </div>
          <label className="flex min-w-0 flex-col gap-2 text-sm font-bold text-ink-soft">
            Descripción
            <textarea
              name="description"
              required
              value={formState.description}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, description: event.target.value }));
              }}
              rows={4}
              className="min-h-[120px] w-full min-w-0 max-w-full border border-ink/15 bg-paper px-4 py-3 text-base text-ink focus:border-primary focus:outline-none"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex min-w-0 flex-col gap-2 text-sm font-bold text-ink-soft">
              Portada (opcional)
              <span className="flex min-h-14 min-w-0 items-center gap-3 border border-dashed border-ink/30 bg-paper px-3 py-2">
                <span className="shrink-0 border border-ink/20 bg-paper-soft px-3 py-2 text-sm font-black text-ink">
                  Seleccionar
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-soft/70">
                  {formState.coverFile?.name ?? 'Ningún archivo seleccionado'}
                </span>
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const [file] = Array.from(event.target.files ?? []);
                  setFormState((prev) => ({ ...prev, coverFile: file ?? null }));
                }}
                className="sr-only"
              />
              <span className="text-xs text-ink-soft/60">
                Si no eliges portada, usaremos la primera imagen como portada para mangas y libros.
              </span>
            </label>
            <label className="flex min-w-0 flex-col gap-2 text-sm font-bold text-ink-soft">
              Archivos de contenido
              <span className="flex min-h-14 min-w-0 items-center gap-3 border border-dashed border-ink/30 bg-paper px-3 py-2">
                <span className="shrink-0 border border-ink/20 bg-paper-soft px-3 py-2 text-sm font-black text-ink">
                  Elegir
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-soft/70">
                  {contentFiles.length === 0
                    ? 'Ningún archivo seleccionado'
                    : contentFiles.length === 1
                      ? contentFiles[0].name
                      : `${contentFiles.length} archivos seleccionados`}
                </span>
              </span>
              <input
                key={formState.resourceType}
                type="file"
                accept={acceptContent}
                multiple={allowMultiple}
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  setResourceId(null);

                  if (files.length === 0) {
                    setContentFiles([]);
                    setStatus('idle');
                    setMessage('');
                    setIsUploading(false);
                    setUploadProgress(0);
                    return;
                  }

                  if (files.some(isArchiveFile)) {
                    setIsProcessingFiles(true);
                    setStatus('loading');
                    setMessage('Extrayendo páginas del archivo seleccionado, espera por favor...');
                    setIsUploading(false);
                    setUploadProgress(0);
                    void extractContentFiles(files)
                      .then((extracted) => {
                        if (extracted.length === 0) {
                          throw new Error('No se encontraron imágenes válidas dentro del archivo.');
                        }
                        setContentFiles(extracted);
                        setStatus('success');
                        setMessage('¡Páginas extraídas correctamente! Revisa y confirma la subida.');
                      })
                      .catch((error) => {
                        console.error('No se pudo extraer el archivo', error);
                        setContentFiles([]);
                        setStatus('error');
                        if (error instanceof Error) {
                          setMessage(error.message);
                        } else {
                          setMessage('No se pudieron extraer las páginas del archivo seleccionado.');
                        }
                        setIsUploading(false);
                      })
                      .finally(() => {
                        setIsProcessingFiles(false);
                      });
                  } else {
                    setContentFiles(files);
                    setStatus('idle');
                    setMessage('');
                    setIsUploading(false);
                    setUploadProgress(0);
                  }
                }}
                className="sr-only"
              />
              <span className="text-xs text-ink-soft/60">
                {formState.resourceType === 'documento'
                  ? 'Solo se tomará el primer archivo para documentos. Acepta PDF, EPUB, TXT y formatos de texto populares.'
                  : 'Puedes subir varias imágenes. Se ordenarán automáticamente y se optimizarán antes de subir.'}
              </span>
            </label>
          </div>
          {status !== 'idle' ? (
            <div
              className={`border-2 px-4 py-3 text-sm font-semibold ${
                status === 'loading'
                  ? 'border-ink/15 bg-paper text-ink'
                  : status === 'success'
                    ? 'border-accent bg-accent/10 text-ink'
                    : 'border-primary bg-primary/10 text-primary'
              }`}
            >
              {message}
              {isUploading ? (
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden bg-ink/10">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="mt-2 block text-xs text-ink-soft/70">{uploadProgress}% completado</span>
                </div>
              ) : null}
              {status === 'success' && resourceId != null ? (
                <div className="mt-2 text-xs text-ink-soft">
                  <span>Id del recurso: {resourceId}</span>
                  {' · '}
                  <Link to={`/details/${resourceId}`} className="font-black text-primary underline">
                    Ver detalles
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="submit"
              className="min-h-11 w-full min-w-0 bg-ink px-6 text-sm font-black uppercase text-paper transition hover:bg-primary disabled:cursor-not-allowed disabled:bg-ink/35 sm:w-auto"
              disabled={status === 'loading' || isProcessingFiles}
            >
              {status === 'loading' ? 'Subiendo...' : 'Subir recurso'}
            </button>
            <button
              type="button"
              className="min-h-11 w-full min-w-0 border border-ink/20 px-6 text-sm font-black uppercase text-ink transition hover:border-ink sm:w-auto"
              onClick={() => {
                setFormState(defaultState);
                setContentFiles([]);
                setStatus('idle');
                setMessage('');
                setResourceId(null);
                setIsUploading(false);
                setUploadProgress(0);
              }}
              disabled={status === 'loading'}
            >
              Limpiar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default UploadView;
