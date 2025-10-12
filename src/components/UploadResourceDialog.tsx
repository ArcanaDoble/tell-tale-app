import { useEffect, useMemo, useState } from 'react';
import { uploadResource } from '../services/libraryService';
import type { Resource, UploadResourcePayload } from '../types/library';

interface UploadResourceDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (resource: Resource) => void;
}

const parseTags = (value: string): string[] => {
  return value
    .split(',')
    .map((tag) => tag.trim().replace(/^#/, ''))
    .filter((tag, index, array) => tag.length > 0 && array.indexOf(tag) === index);
};

const DEFAULT_DESCRIPTION =
  'Carga tus capítulos en PDF, EPUB o como imágenes sueltas para comenzar a leerlos desde cualquier dispositivo.';

function UploadResourceDialog({ open, onClose, onCreated }: UploadResourceDialogProps): JSX.Element | null {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [tagsInput, setTagsInput] = useState('manga, lectura');
  const [coverFile, setCoverFile] = useState<File | undefined>();
  const [documentFile, setDocumentFile] = useState<File | undefined>();
  const [pageFiles, setPageFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<'document' | 'images'>('document');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle('');
      setAuthor('');
      setDescription(DEFAULT_DESCRIPTION);
      setTagsInput('manga, lectura');
      setCoverFile(undefined);
      setDocumentFile(undefined);
      setPageFiles([]);
      setErrorMessage(null);
      setMode('document');
    }
  }, [open]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && open && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, isSubmitting, onClose]);

  const coverPreview = useMemo(() => {
    if (coverFile == null || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      return undefined;
    }
    return URL.createObjectURL(coverFile);
  }, [coverFile]);

  const pagesPreview = useMemo(() => {
    if (
      pageFiles.length === 0 ||
      typeof URL === 'undefined' ||
      typeof URL.createObjectURL !== 'function'
    ) {
      return [];
    }
    return pageFiles.slice(0, 4).map((file) => URL.createObjectURL(file));
  }, [pageFiles]);

  useEffect(() => {
    return () => {
      if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') {
        return;
      }
      if (coverPreview != null) {
        URL.revokeObjectURL(coverPreview);
      }
      pagesPreview.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [coverPreview, pagesPreview]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);

    if (title.trim().length === 0 || author.trim().length === 0) {
      setErrorMessage('El título y el autor son obligatorios.');
      return;
    }

    if (mode === 'document' && documentFile == null) {
      setErrorMessage('Selecciona un archivo PDF, EPUB, CBZ o TXT para subir.');
      return;
    }

    if (mode === 'images' && pageFiles.length === 0) {
      setErrorMessage('Añade al menos una imagen para crear el capítulo.');
      return;
    }

    const payload: UploadResourcePayload = {
      title: title.trim(),
      author: author.trim(),
      description: description.trim(),
      tags: parseTags(tagsInput),
      coverFile,
      documentFile: mode === 'document' ? documentFile : undefined,
      pageFiles: mode === 'images' ? pageFiles : []
    };

    try {
      setIsSubmitting(true);
      const resource = await uploadResource(payload);
      onCreated(resource);
      onClose();
    } catch (error) {
      console.error('Error uploading resource', error);
      setErrorMessage('No se pudo cargar el archivo. Revisa tu conexión e inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModeChange = (value: 'document' | 'images'): void => {
    setMode(value);
    setErrorMessage(null);
    if (value === 'document') {
      setPageFiles([]);
    } else {
      setDocumentFile(undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur">
      <form
        className="relative flex w-full max-w-3xl flex-col gap-6 overflow-hidden overflow-y-auto rounded-[28px] border border-white/10 bg-[#060b16]/95 p-6 shadow-2xl shadow-primary/20 sm:p-8"
        onSubmit={handleSubmit}
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Subir nuevo contenido</h2>
            <p className="mt-1 text-sm text-slate-400">
              Organiza tus mangas y libros en la biblioteca. Todos los archivos se almacenan de forma segura en Firebase Storage.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-primary/60 hover:text-primary"
            disabled={isSubmitting}
          >
            Cerrar
          </button>
        </header>

        <div className="grid gap-6 md:grid-cols-[3fr,2fr]">
          <section className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-slate-200">Título</span>
              <input
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                }}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-slate-100 transition focus:border-primary focus:bg-white/[0.08] focus:outline-none"
                placeholder="Nombre del manga o libro"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-slate-200">Autor</span>
              <input
                type="text"
                value={author}
                onChange={(event) => {
                  setAuthor(event.target.value);
                }}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-slate-100 transition focus:border-primary focus:bg-white/[0.08] focus:outline-none"
                placeholder="Nombre del autor o estudio"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-slate-200">Descripción</span>
              <textarea
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                }}
                rows={4}
                className="resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-slate-100 transition focus:border-primary focus:bg-white/[0.08] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-slate-200">Etiquetas</span>
              <input
                type="text"
                value={tagsInput}
                onChange={(event) => {
                  setTagsInput(event.target.value);
                }}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-slate-100 transition focus:border-primary focus:bg-white/[0.08] focus:outline-none"
                placeholder="Separadas por comas (ej. aventura, misterio)"
              />
            </label>

            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <span className="text-sm font-semibold text-slate-200">Formato del contenido</span>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    handleModeChange('document');
                  }}
                  className={`flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition ${
                    mode === 'document'
                      ? 'border-primary/80 bg-primary/15 text-primary shadow-glow'
                      : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-primary/40 hover:text-slate-100'
                  }`}
                >
                  <span className="text-sm font-semibold uppercase tracking-wide">Documento</span>
                  <span className="text-xs text-slate-400">
                    Ideal para PDF, EPUB, CBZ o TXT. Se visualiza en un lector integrado.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleModeChange('images');
                  }}
                  className={`flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition ${
                    mode === 'images'
                      ? 'border-primary/80 bg-primary/15 text-primary shadow-glow'
                      : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-primary/40 hover:text-slate-100'
                  }`}
                >
                  <span className="text-sm font-semibold uppercase tracking-wide">Imágenes</span>
                  <span className="text-xs text-slate-400">Sube páginas en JPG o PNG para el lector con paginación.</span>
                </button>
              </div>

              {mode === 'document' ? (
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-slate-200">Archivo principal</span>
                  <input
                    type="file"
                    accept=".pdf,.epub,.cbz,.zip,.txt,application/pdf,application/epub+zip,application/zip,text/plain"
                    onChange={(event) => {
                      const files = event.target.files;
                      setDocumentFile(files != null && files.length > 0 ? files[0] : undefined);
                    }}
                    className="cursor-pointer rounded-xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-3 text-slate-300 transition file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-primary/70"
                  />
                </label>
              ) : (
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-slate-200">Páginas (puedes seleccionar varias)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      setPageFiles(files);
                    }}
                    className="cursor-pointer rounded-xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-3 text-slate-300 transition file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-primary/70"
                  />
                  {pagesPreview.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {pagesPreview.map((preview, index) => (
                        <img
                          key={preview}
                          src={preview}
                          alt={`Vista previa ${index + 1}`}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                      ))}
                      {pageFiles.length > pagesPreview.length && (
                        <span className="flex h-20 w-20 items-center justify-center rounded-lg border border-slate-700 text-xs text-slate-400">
                          +{pageFiles.length - pagesPreview.length}
                        </span>
                      )}
                    </div>
                  )}
                </label>
              )}
            </div>
          </section>

          <aside className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-slate-200">Portada</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const files = event.target.files;
                  setCoverFile(files != null && files.length > 0 ? files[0] : undefined);
                }}
                className="cursor-pointer rounded-xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-3 text-slate-300 transition file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-accent/80"
              />
            </label>
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              {coverPreview != null ? (
                <img src={coverPreview} alt="Vista previa de la portada" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
                  Arrastra una imagen de portada o déjala en blanco para usar una cubierta automática.
                </div>
              )}
            </div>
            <div className="rounded-xl bg-white/[0.03] p-4 text-xs text-slate-400">
              <p className="font-semibold text-slate-200">Recomendaciones</p>
              <ul className="mt-2 space-y-1 list-disc pl-4">
                <li>Organiza tus etiquetas para filtrar fácilmente la biblioteca.</li>
                <li>Los archivos PDF y EPUB se abren en un visor adaptado a móvil y tablet.</li>
                <li>Si subes imágenes, ordénalas en el nombre (01, 02, 03) para mantener el orden de lectura.</li>
              </ul>
            </div>
          </aside>
        </div>

        {errorMessage != null && <p className="rounded-xl border border-rose-900/60 bg-rose-950/70 px-4 py-3 text-sm text-rose-200">{errorMessage}</p>}

        <footer className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            El proceso puede tardar unos segundos según el tamaño del archivo. Mantén la ventana abierta hasta finalizar.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {isSubmitting ? 'Subiendo...' : 'Guardar en la biblioteca'}
          </button>
        </footer>
      </form>
    </div>
  );
}

export default UploadResourceDialog;
