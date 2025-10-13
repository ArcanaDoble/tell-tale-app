import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, listAll, ref, uploadBytesResumable } from 'firebase/storage';
import type { StorageReference, UploadTaskSnapshot } from 'firebase/storage';
import type { Resource, ResourceMeta, ResourceType, ResourceUploadPayload } from '../types/library';
import { db, isFirebaseConfigured, storage } from '../firebase/config';

const COLLECTION_NAME = 'resources';

const fallbackResources: Resource[] = [
  {
    id: 'demo',
    title: 'El Gato Narrador',
    description:
      'Una colección de relatos ilustrados que siguen las aventuras nocturnas de un misterioso felino en la ciudad.',
    author: 'A. Poe',
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
    tags: ['misterio', 'aventura'],
    pageCount: 3,
    resourceType: 'manga',
    hasReader: true,
    downloadUrl: null,
    pages: [
      'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80'
    ]
  }
];

const shouldUseFallback = (): boolean => !isFirebaseConfigured || db == null;

export async function getLibrary(): Promise<ResourceMeta[]> {
  const database = db;
  if (shouldUseFallback() || database == null) {
    return fallbackResources;
  }

  try {
    const snapshot = await getDocs(collection(database, COLLECTION_NAME));
    if (snapshot.empty) {
      return fallbackResources;
    }
    return snapshot.docs.map((document) => {
      const data = document.data() as Partial<Resource>;
      const resourceType = (data.resourceType as ResourceType) ?? 'manga';
      const pages = Array.isArray(data.pages) ? data.pages : [];
      const downloadUrl = typeof data.downloadUrl === 'string' ? data.downloadUrl : null;
      const hasReader = pages.length > 0;
      const storedPageCount = typeof data.pageCount === 'number' ? data.pageCount : undefined;
      const pageCount = hasReader
        ? pages.length
        : storedPageCount != null && storedPageCount > 0
          ? storedPageCount
          : downloadUrl != null
            ? 1
            : 0;
      return {
        id: document.id,
        title: data.title ?? 'Sin título',
        description: data.description ?? 'Recurso sin descripción',
        author: data.author ?? 'Autor desconocido',
        coverUrl:
          data.coverUrl ??
          'https://images.unsplash.com/photo-1514894780887-121968d00567?auto=format&fit=crop&w=400&q=80',
        tags: data.tags ?? [],
        pageCount,
        resourceType,
        hasReader,
        downloadUrl
      } satisfies ResourceMeta;
    });
  } catch (error) {
    console.warn('Falling back to demo resources because Firebase is not reachable.', error);
    return fallbackResources;
  }
}

export async function getResourceById(id: string): Promise<Resource | undefined> {
  const database = db;
  if (shouldUseFallback() || database == null) {
    return fallbackResources.find((resource) => resource.id === id) ?? fallbackResources[0];
  }

  try {
    const resourceRef = doc(database, COLLECTION_NAME, id);
    const snapshot = await getDoc(resourceRef);
    if (!snapshot.exists()) {
      return fallbackResources.find((resource) => resource.id === id);
    }
    const data = snapshot.data() as Partial<Resource>;
    const pages = Array.isArray(data.pages) ? data.pages : fallbackResources[0]?.pages ?? [];
    const resourceType = (data.resourceType as ResourceType) ?? 'manga';
    const downloadUrl = typeof data.downloadUrl === 'string' ? data.downloadUrl : null;
    const hasReader = pages.length > 0;
    const storedPageCount = typeof data.pageCount === 'number' ? data.pageCount : undefined;
    const pageCount = hasReader
      ? pages.length
      : storedPageCount != null && storedPageCount > 0
        ? storedPageCount
        : downloadUrl != null
          ? 1
          : 0;
    return {
      id: snapshot.id,
      title: data.title ?? 'Sin título',
      description: data.description ?? 'Recurso sin descripción',
      author: data.author ?? 'Autor desconocido',
      coverUrl:
        data.coverUrl ??
        'https://images.unsplash.com/photo-1514894780887-121968d00567?auto=format&fit=crop&w=400&q=80',
      tags: data.tags ?? [],
      pageCount,
      resourceType,
      hasReader,
      downloadUrl,
      pages
    } satisfies Resource;
  } catch (error) {
    console.warn('Falling back to demo resource because Firebase is not reachable.', error);
    return fallbackResources.find((resource) => resource.id === id) ?? fallbackResources[0];
  }
}

interface UploadResourceOptions {
  onProgress?: (progress: number) => void;
}

export async function uploadResource(
  payload: ResourceUploadPayload,
  options: UploadResourceOptions = {}
): Promise<string> {
  const database = db;
  const storageService = storage;
  if (!isFirebaseConfigured || database == null || storageService == null) {
    throw new Error('Firebase no está configurado correctamente para cargar archivos.');
  }

  if (payload.contentFiles.length === 0) {
    throw new Error('Selecciona al menos un archivo para subir.');
  }

  const collectionRef = collection(database, COLLECTION_NAME);
  const documentRef = doc(collectionRef);

  const normalizedTags = payload.tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  const sortedFiles = [...payload.contentFiles].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );

  const pages: string[] = [];
  let downloadUrl: string | null = null;

  const totalUploadBytes =
    sortedFiles.reduce((total, file) => total + file.size, 0) + (payload.coverFile?.size ?? 0);
  let uploadedBytes = 0;

  const reportProgress = (bytes: number): void => {
    if (totalUploadBytes <= 0) {
      options.onProgress?.(1);
      return;
    }
    const ratio = Math.min(bytes / totalUploadBytes, 1);
    options.onProgress?.(ratio);
  };

  reportProgress(0);

  const uploadFileWithProgress = async (fileRef: StorageReference, file: File): Promise<UploadTaskSnapshot> =>
    await new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(fileRef, file);
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          reportProgress(uploadedBytes + snapshot.bytesTransferred);
        },
        reject,
        () => {
          uploadedBytes += file.size;
          reportProgress(uploadedBytes);
          resolve(uploadTask.snapshot);
        }
      );
    });

  if (payload.resourceType === 'documento') {
    const [file] = sortedFiles;
    const fileRef = ref(storageService, `resources/${documentRef.id}/archivo/${file.name}`);
    const snapshot = await uploadFileWithProgress(fileRef, file);
    downloadUrl = await getDownloadURL(snapshot.ref);
  } else {
    for (const [index, file] of sortedFiles.entries()) {
      const paddedIndex = String(index + 1).padStart(3, '0');
      const pageRef = ref(storageService, `resources/${documentRef.id}/paginas/${paddedIndex}-${file.name}`);
      const snapshot = await uploadFileWithProgress(pageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      pages.push(url);
    }
  }

  let coverUrl: string | undefined;
  if (payload.coverFile != null) {
    const coverRef = ref(storageService, `resources/${documentRef.id}/portada/${payload.coverFile.name}`);
    const snapshot = await uploadFileWithProgress(coverRef, payload.coverFile);
    coverUrl = await getDownloadURL(snapshot.ref);
  } else if (pages.length > 0) {
    coverUrl = pages[0];
  }

  const now = serverTimestamp();

  const pageCount = pages.length > 0 ? pages.length : downloadUrl != null ? 1 : 0;

  await setDoc(documentRef, {
    title: payload.title,
    description: payload.description,
    author: payload.author,
    tags: normalizedTags,
    resourceType: payload.resourceType,
    coverUrl: coverUrl ?? null,
    pages,
    pageCount,
    downloadUrl,
    createdAt: now,
    updatedAt: now
  });

  return documentRef.id;
}

async function deleteFolderContents(folderRef: StorageReference): Promise<void> {
  const { items, prefixes } = await listAll(folderRef);
  await Promise.all([
    ...items.map(async (item) => {
      try {
        await deleteObject(item);
      } catch (error) {
        console.warn(`Could not delete storage item ${item.fullPath}`, error);
      }
    }),
    ...prefixes.map(async (prefix) => {
      await deleteFolderContents(prefix);
    })
  ]);
}

export async function deleteResource(id: string): Promise<void> {
  const database = db;
  const storageService = storage;

  if (!isFirebaseConfigured || database == null || storageService == null) {
    throw new Error('Firebase no está configurado correctamente para eliminar recursos.');
  }

  const resourceRef = doc(database, COLLECTION_NAME, id);

  try {
    const rootRef = ref(storageService, `resources/${id}`);
    await deleteFolderContents(rootRef);
  } catch (error) {
    console.warn(`Failed to delete storage assets for resource ${id}. Continuing with document deletion.`, error);
  }

  await deleteDoc(resourceRef);
}
