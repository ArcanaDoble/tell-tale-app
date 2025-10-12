import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type DocumentData
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, isFirebaseConfigured, storage } from '../firebase/config';
import type { Resource, ResourceFormat, ResourceMeta, UploadResourcePayload } from '../types/library';

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
    pages: [
      'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80'
    ],
    format: 'images',
    updatedAt: new Date().toISOString()
  }
];

const localLibrary: Resource[] = [...fallbackResources];

const shouldUseFirebase = (): boolean => isFirebaseConfigured && db != null;

const inferFormat = (mime?: string, filename?: string): ResourceFormat => {
  if (mime?.includes('pdf') || filename?.toLowerCase().endsWith('.pdf') === true) {
    return 'pdf';
  }
  if (mime?.includes('epub') || filename?.toLowerCase().endsWith('.epub') === true) {
    return 'epub';
  }
  if (mime?.includes('zip') || filename?.toLowerCase().endsWith('.cbz') === true) {
    return 'cbz';
  }
  if (mime?.startsWith('text/') || filename?.toLowerCase().endsWith('.txt') === true) {
    return 'txt';
  }
  if (mime?.startsWith('image/')) {
    return 'images';
  }
  return 'other';
};

const asMeta = (resource: Resource): ResourceMeta => ({
  id: resource.id,
  title: resource.title,
  description: resource.description,
  author: resource.author,
  coverUrl: resource.coverUrl,
  tags: resource.tags,
  pageCount: resource.pageCount,
  format: resource.format,
  updatedAt: resource.updatedAt
});

const resolveTimestamp = (value: unknown): string | undefined => {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object' && 'toDate' in (value as { toDate?: () => Date })) {
    try {
      const date = (value as { toDate: () => Date }).toDate();
      return date.toISOString();
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const normalizeResource = (id: string, data: DocumentData | undefined): Resource => {
  const partial = (data ?? {}) as Partial<Resource> & {
    pages?: unknown;
    tags?: unknown;
    format?: unknown;
    fileUrl?: unknown;
    fileName?: unknown;
    pageCount?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
  };

  const pages = Array.isArray(partial.pages)
    ? partial.pages.filter((page): page is string => typeof page === 'string')
    : [];
  const tags = Array.isArray(partial.tags)
    ? partial.tags.filter((tag): tag is string => typeof tag === 'string')
    : [];
  const format = (typeof partial.format === 'string' ? (partial.format as ResourceFormat) : undefined) ??
    (pages.length > 0 ? 'images' : inferFormat(undefined, typeof partial.fileName === 'string' ? partial.fileName : undefined));

  const pageCount = typeof partial.pageCount === 'number' ? partial.pageCount : pages.length;

  return {
    id,
    title: partial.title ?? 'Sin título',
    description: partial.description ?? 'Recurso sin descripción',
    author: partial.author ?? 'Autor desconocido',
    coverUrl:
      partial.coverUrl ?? 'https://images.unsplash.com/photo-1514894780887-121968d00567?auto=format&fit=crop&w=400&q=80',
    tags,
    pageCount,
    pages,
    format,
    updatedAt: resolveTimestamp(partial.updatedAt) ?? resolveTimestamp(partial.createdAt),
    fileUrl: typeof partial.fileUrl === 'string' ? partial.fileUrl : undefined,
    fileName: typeof partial.fileName === 'string' ? partial.fileName : undefined
  } satisfies Resource;
};

export async function getLibrary(): Promise<ResourceMeta[]> {
  const database = db;
  if (!shouldUseFirebase() || database == null) {
    return localLibrary.map(asMeta);
  }

  try {
    const snapshot = await getDocs(collection(database, COLLECTION_NAME));
    if (snapshot.empty) {
      return localLibrary.map(asMeta);
    }
    return snapshot.docs.map((document) => asMeta(normalizeResource(document.id, document.data())));
  } catch (error) {
    console.warn('Falling back to demo resources because Firebase is not reachable.', error);
    return localLibrary.map(asMeta);
  }
}

export async function getResourceById(id: string): Promise<Resource | undefined> {
  const database = db;
  if (!shouldUseFirebase() || database == null) {
    return localLibrary.find((resource) => resource.id === id) ?? localLibrary[0];
  }

  try {
    const resourceRef = doc(database, COLLECTION_NAME, id);
    const snapshot = await getDoc(resourceRef);
    if (!snapshot.exists()) {
      return localLibrary.find((resource) => resource.id === id);
    }
    return normalizeResource(snapshot.id, snapshot.data());
  } catch (error) {
    console.warn('Falling back to demo resource because Firebase is not reachable.', error);
    return localLibrary.find((resource) => resource.id === id) ?? localLibrary[0];
  }
}

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

const createObjectUrl = (file: File | Blob): string => {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    return URL.createObjectURL(file);
  }
  return '';
};

export async function uploadResource(payload: UploadResourcePayload): Promise<Resource> {
  const resourceId = generateId();
  const nowIso = new Date().toISOString();

  let coverUrl = payload.coverUrl ??
    'https://images.unsplash.com/photo-1514894780887-121968d00567?auto=format&fit=crop&w=400&q=80';
  let pages: string[] = [];
  let fileUrl: string | undefined;
  let fileName: string | undefined;

  const inferredFormat =
    payload.documentFile != null
      ? inferFormat(payload.documentFile.type, payload.documentFile.name)
      : payload.pageFiles != null && payload.pageFiles.length > 0
      ? 'images'
      : 'other';
  let format: ResourceFormat = inferredFormat;

  if (shouldUseFirebase() && db != null) {
    const database = db;
    const storageInstance = storage;
    const basePath = `library/${resourceId}`;

    if (storageInstance != null) {
      if (payload.coverFile != null) {
        const coverRef = ref(storageInstance, `${basePath}/cover-${payload.coverFile.name}`);
        await uploadBytes(coverRef, payload.coverFile);
        coverUrl = await getDownloadURL(coverRef);
      }

      if (payload.documentFile != null) {
        const documentRef = ref(storageInstance, `${basePath}/document-${payload.documentFile.name}`);
        await uploadBytes(documentRef, payload.documentFile);
        fileUrl = await getDownloadURL(documentRef);
        fileName = payload.documentFile.name;
      }

      if (payload.pageFiles != null && payload.pageFiles.length > 0) {
        const sortedPages = [...payload.pageFiles].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        const uploads = sortedPages.map(async (file, index) => {
          const pageRef = ref(storageInstance, `${basePath}/pages/${index.toString().padStart(3, '0')}-${file.name}`);
          await uploadBytes(pageRef, file);
          return await getDownloadURL(pageRef);
        });
        pages = await Promise.all(uploads);
        format = 'images';
      }
    }

    const data = {
      title: payload.title,
      description: payload.description,
      author: payload.author,
      tags: payload.tags,
      coverUrl,
      pageCount: pages.length > 0 ? pages.length : payload.pageFiles?.length ?? 0,
      pages,
      format,
      fileUrl,
      fileName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    } satisfies Record<string, unknown>;

    await setDoc(doc(database, COLLECTION_NAME, resourceId), data);
  } else {
    if (payload.coverFile != null) {
      coverUrl = createObjectUrl(payload.coverFile);
    }
    if (payload.documentFile != null) {
      fileUrl = createObjectUrl(payload.documentFile);
      fileName = payload.documentFile.name;
    }
    if (payload.pageFiles != null && payload.pageFiles.length > 0) {
      pages = payload.pageFiles.map((file) => createObjectUrl(file));
      format = 'images';
    }
  }

  const resource: Resource = {
    id: resourceId,
    title: payload.title,
    description: payload.description,
    author: payload.author,
    coverUrl,
    tags: payload.tags,
    pageCount: pages.length > 0 ? pages.length : payload.pageFiles?.length ?? 0,
    pages,
    format,
    fileUrl,
    fileName,
    updatedAt: nowIso
  };

  addResourceToCache(resource);

  return resource;
}

export function addResourceToCache(resource: Resource): void {
  const existingIndex = localLibrary.findIndex((item) => item.id === resource.id);
  if (existingIndex >= 0) {
    localLibrary[existingIndex] = resource;
  } else {
    localLibrary.unshift(resource);
  }
}
