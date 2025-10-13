export interface NormalizedCollection {
  id: string | null;
  name: string | null;
}

/**
 * Normalizes a collection name by trimming spaces and generating a slug suitable for persistence.
 * Returns null values when the provided name is empty or undefined.
 */
export function normalizeCollectionName(name?: string | null): NormalizedCollection {
  if (name == null) {
    return { id: null, name: null };
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { id: null, name: null };
  }

  const ascii = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const slug = ascii
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length === 0) {
    return { id: null, name: trimmed };
  }

  return { id: slug, name: trimmed };
}
