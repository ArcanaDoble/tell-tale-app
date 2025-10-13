import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { isFirebaseConfigured } from '../firebase/config';
import { getResourceById, updateResource } from '../services/libraryService';
import type { Resource } from '../types/library';

interface FormState {
  title: string;
  description: string;
  author: string;
  tags: string;
  collectionName: string;
  coverFile: File | null;
}

type EditStatus = 'idle' | 'saving' | 'success' | 'error';

const defaultState: FormState = {
  title: '',
  description: '',
  author: '',
  tags: '',
  collectionName: '',
  coverFile: null
};

function EditResourceView(): JSX.Element {
  const { resourceId } = useParams<{ resourceId: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(defaultState);
  const [status, setStatus] = useState<EditStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchResource = async (): Promise<void> => {
      if (resourceId == null) {
        setLoadError('No se proporcionó un identificador válido.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const item = await getResourceById(resourceId);
        if (item == null) {
          setLoadError('El recurso indicado no se encontró.');
          setResource(null);
        } else {
          setResource(item);
        }
      } catch (error) {
        console.error('No se pudo cargar el recurso', error);
        setLoadError('No se pudo cargar la información del recurso.');
        setResource(null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchResource();
  }, [resourceId]);

  useEffect(() => {
    if (resource == null) {
      setFormState(defaultState);
      setPreviewUrl(null);
      return;
    }

    setFormState({
      title: resource.title,
      description: resource.description,
      author: resource.author,
      tags: resource.tags.join(', '),
      collectionName: resource.collectionName ?? '',
      coverFile: null
    });
    setPreviewUrl(resource.coverUrl);
  }, [resource]);

  useEffect(() => {
    return () => {
      if (previewUrl != null && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const canEdit = isFirebaseConfigured;

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const [file] = Array.from(event.target.files ?? []);

    setFormState((prev) => ({ ...prev, coverFile: file ?? null }));

    if (previewUrl != null && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    if (file != null) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(resource?.coverUrl ?? null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!canEdit) {
      setStatus('error');
      setMessage('Configura tus credenciales de Firebase para habilitar la edición de recursos.');
      return;
    }

    if (resource == null) {
      setStatus('error');
      setMessage('No hay un recurso válido para editar.');
      return;
    }

    try {
      setStatus('saving');
      setMessage('Guardando cambios, espera por favor...');

      const tags = formState.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      const collectionName = formState.collectionName.trim();

      await updateResource(resource.id, {
        title: formState.title,
        description: formState.description,
        author: formState.author,
        tags,
        collectionName: collectionName.length > 0 ? collectionName : null,
        coverFile: formState.coverFile ?? undefined
      });

      setStatus('success');
      setMessage('Los cambios se guardaron correctamente.');
      setFormState((prev) => ({ ...prev, coverFile: null }));

      if (formState.coverFile != null && previewUrl != null && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      const updated = await getResourceById(resource.id);
      if (updated != null) {
        setResource(updated);
      }
    } catch (error) {
      console.error('No se pudo actualizar el recurso', error);
      setStatus('error');
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('No se pudo actualizar el recurso. Intenta nuevamente.');
      }
    }
  };

  if (isLoading) {
    return (
      <section className="grid flex-1 place-items-center rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-slate-400">
        Cargando información del recurso...
      </section>
    );
  }

  if (loadError != null) {
    return (
      <section className="grid flex-1 place-items-center rounded-2xl border border-rose-900/60 bg-rose-950/40 p-12 text-rose-200">
        {loadError}
      </section>
    );
  }

  if (resource == null) {
    return (
      <section className="grid flex-1 place-items-center rounded-2xl border border-rose-900/60 bg-rose-950/40 p-12 text-rose-200">
        El recurso indicado no se encontró.
      </section>
    );
  }

  const coverPreview = previewUrl ?? resource.coverUrl;

  return (
    <section className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-3 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Editar recurso</h1>
        <p className="text-slate-300">
          Actualiza los metadatos del título seleccionado. Puedes modificar el nombre, la portada, el autor y la colección en la
          que se agrupa.
        </p>
      </header>
      {!canEdit ? (
        <div className="grid place-items-center rounded-2xl border border-amber-900/60 bg-amber-950/40 p-10 text-amber-100">
          <div className="flex max-w-lg flex-col gap-3 text-center">
            <p className="text-lg font-semibold">Firebase no está configurado.</p>
            <p>Actualiza tus variables de entorno y recarga la aplicación para habilitar la edición de recursos.</p>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg"
        >
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            <div className="flex flex-col gap-4">
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
                Colección (opcional)
                <input
                  type="text"
                  name="collectionName"
                  value={formState.collectionName}
                  onChange={(event) => {
                    setFormState((prev) => ({ ...prev, collectionName: event.target.value }));
                  }}
                  placeholder="Saga nocturna, Temporada 1, Colección personal"
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-base text-white focus:border-primary focus:outline-none"
                />
                <span className="text-xs text-slate-500">Escribe un nombre para agrupar recursos relacionados.</span>
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
            <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-2xl border border-slate-800">
                {coverPreview != null ? (
                  <img src={coverPreview} alt={formState.title} className="aspect-[3/4] w-full object-cover" />
                ) : (
                  <div className="grid aspect-[3/4] place-items-center bg-slate-900 text-slate-500">Sin portada</div>
                )}
              </div>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                Cambiar portada
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="rounded-xl border border-dashed border-slate-700 bg-slate-900 px-4 py-3 text-base text-white focus:border-primary focus:outline-none"
                />
                <span className="text-xs text-slate-500">Sube una nueva imagen si deseas reemplazar la portada actual.</span>
              </label>
            </div>
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
              rows={5}
              className="min-h-[140px] rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white focus:border-primary focus:outline-none"
            />
          </label>
          {status !== 'idle' ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                status === 'saving'
                  ? 'border-slate-700 bg-slate-900 text-slate-200'
                  : status === 'success'
                    ? 'border-emerald-900/60 bg-emerald-950/40 text-emerald-200'
                    : 'border-rose-900/60 bg-rose-950/40 text-rose-200'
              }`}
            >
              {message}
              {status === 'success' ? (
                <div className="mt-2 text-xs text-slate-300">
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => {
                      navigate(`/details/${resource.id}`);
                    }}
                  >
                    Ver en detalles
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:bg-slate-700"
              disabled={status === 'saving'}
            >
              {status === 'saving' ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <Link
              to={`/details/${resource.id}`}
              className="rounded-full border border-slate-700 px-6 py-2 text-sm font-semibold uppercase tracking-wide text-slate-200 transition hover:border-primary hover:text-primary"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </section>
  );
}

export default EditResourceView;
