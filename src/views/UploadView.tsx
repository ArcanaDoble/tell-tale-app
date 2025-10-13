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
  resourceType: ResourceType;
  coverFile: File | null;
}

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

const defaultState: FormState = {
  title: '',
  description: '',
  author: '',
  tags: '',
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
      setMessage('Subiendo recurso, espera por favor...');
      setIsUploading(true);
      setUploadProgress(0);

      const tags = formState.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const newId = await uploadResource(
        {
          title: formState.title,
          description: formState.description,
          author: formState.author,
          tags,
          resourceType: formState.resourceType,
          contentFiles,
          coverFile: formState.coverFile ?? undefined
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
    <section className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-3 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Subir recurso</h1>
        <p className="text-slate-300">
          Comparte nuevos mangas, libros ilustrados o documentos con tu comunidad. Los archivos se almacenarán en Firebase
          Storage y se registrarán en Firestore.
        </p>
      </header>
      {!isFirebaseConfigured ? (
        <div className="grid place-items-center rounded-2xl border border-amber-900/60 bg-amber-950/40 p-10 text-amber-100">
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
          className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Título
              <input
                type="text"
                name="title"
                required
                value={formState.title}
                onChange={(event) => {
                  setFormState((prev) => ({ ...prev, title: event.target.value }));
                }}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-base text-white focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Autor o editorial
              <input
                type="text"
                name="author"
                required
                value={formState.author}
                onChange={(event) => {
                  setFormState((prev) => ({ ...prev, author: event.target.value }));
                }}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-base text-white focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Tipo de recurso
              <select
                name="resourceType"
                value={formState.resourceType}
                onChange={(event) => {
                  const value = event.target.value as ResourceType;
                  setFormState((prev) => ({ ...prev, resourceType: value }));
                  setContentFiles([]);
                }}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-base text-white focus:border-primary focus:outline-none"
              >
                <option value="manga">Manga (imágenes secuenciales)</option>
                <option value="libro">Libro ilustrado</option>
                <option value="documento">Documento (PDF, EPUB, texto)</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Etiquetas (separadas por coma)
              <input
                type="text"
                name="tags"
                value={formState.tags}
                onChange={(event) => {
                  setFormState((prev) => ({ ...prev, tags: event.target.value }));
                }}
                placeholder="fantasía, aventura, misterio"
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-base text-white focus:border-primary focus:outline-none"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Descripción
            <textarea
              name="description"
              required
              value={formState.description}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, description: event.target.value }));
              }}
              rows={4}
              className="min-h-[120px] rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white focus:border-primary focus:outline-none"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Portada (opcional)
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const [file] = Array.from(event.target.files ?? []);
                  setFormState((prev) => ({ ...prev, coverFile: file ?? null }));
                }}
                className="rounded-xl border border-dashed border-slate-700 bg-slate-900 px-4 py-3 text-base text-white focus:border-primary focus:outline-none"
              />
              <span className="text-xs text-slate-500">
                Si no eliges portada, usaremos la primera imagen como portada para mangas y libros.
              </span>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Archivos de contenido
              <input
                key={formState.resourceType}
                type="file"
                accept={acceptContent}
                multiple={allowMultiple}
                required
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
                className="rounded-xl border border-dashed border-slate-700 bg-slate-900 px-4 py-3 text-base text-white focus:border-primary focus:outline-none"
              />
              <span className="text-xs text-slate-500">
                {formState.resourceType === 'documento'
                  ? 'Solo se tomará el primer archivo para documentos. Acepta PDF, EPUB, TXT y formatos de texto populares.'
                  : 'Puedes subir varias imágenes. Se ordenarán automáticamente por nombre para generar las páginas.'}
              </span>
            </label>
          </div>
          {status !== 'idle' ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                status === 'loading'
                  ? 'border-slate-700 bg-slate-900 text-slate-200'
                  : status === 'success'
                    ? 'border-emerald-900/60 bg-emerald-950/40 text-emerald-200'
                    : 'border-rose-900/60 bg-rose-950/40 text-rose-200'
              }`}
            >
              {message}
              {isUploading ? (
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="mt-2 block text-xs text-slate-400">{uploadProgress}% completado</span>
                </div>
              ) : null}
              {status === 'success' && resourceId != null ? (
                <div className="mt-2 text-xs text-slate-300">
                  <span>Id del recurso: {resourceId}</span>
                  {' · '}
                  <Link to={`/details/${resourceId}`} className="text-primary underline">
                    Ver detalles
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:bg-slate-700"
              disabled={status === 'loading' || isProcessingFiles}
            >
              {status === 'loading' ? 'Subiendo…' : 'Subir recurso'}
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-700 px-6 py-2 text-sm font-semibold uppercase tracking-wide text-slate-200 transition hover:border-primary hover:text-primary"
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
