import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import type { Resource, ResourceMeta } from '../types/library';
import { db, isFirebaseConfigured } from '../firebase/config';

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
      return {
        id: document.id,
        title: data.title ?? 'Sin título',
        description: data.description ?? 'Recurso sin descripción',
        author: data.author ?? 'Autor desconocido',
        coverUrl:
          data.coverUrl ??
          'https://images.unsplash.com/photo-1514894780887-121968d00567?auto=format&fit=crop&w=400&q=80',
        tags: data.tags ?? [],
        pageCount: Array.isArray(data.pages) ? data.pages.length : data.pageCount ?? 0
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
    return {
      id: snapshot.id,
      title: data.title ?? 'Sin título',
      description: data.description ?? 'Recurso sin descripción',
      author: data.author ?? 'Autor desconocido',
      coverUrl:
        data.coverUrl ??
        'https://images.unsplash.com/photo-1514894780887-121968d00567?auto=format&fit=crop&w=400&q=80',
      tags: data.tags ?? [],
      pageCount: pages.length,
      pages
    } satisfies Resource;
  } catch (error) {
    console.warn('Falling back to demo resource because Firebase is not reachable.', error);
    return fallbackResources.find((resource) => resource.id === id) ?? fallbackResources[0];
  }
}
