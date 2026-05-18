export interface ReadingProgress {
  page: number;
  totalPages: number;
  updatedAt: string;
}

const progressPrefix = 'reading-progress:';

const getKey = (resourceId: string): string => `${progressPrefix}${resourceId}`;

export function getReadingProgress(resourceId: string): ReadingProgress | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawProgress = window.localStorage.getItem(getKey(resourceId));
  if (rawProgress == null) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawProgress) as Partial<ReadingProgress>;
    if (typeof parsed.page !== 'number' || typeof parsed.totalPages !== 'number') {
      return null;
    }

    return {
      page: Math.max(0, parsed.page),
      totalPages: Math.max(0, parsed.totalPages),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString()
    };
  } catch {
    return null;
  }
}

export function saveReadingProgress(resourceId: string, page: number, totalPages: number): void {
  if (typeof window === 'undefined' || totalPages <= 0) {
    return;
  }

  const progress: ReadingProgress = {
    page: Math.min(Math.max(page, 0), totalPages - 1),
    totalPages,
    updatedAt: new Date().toISOString()
  };

  window.localStorage.setItem(getKey(resourceId), JSON.stringify(progress));
}

export function getProgressPercent(progress: ReadingProgress | null, fallbackTotalPages = 0): number {
  if (progress == null) {
    return 0;
  }

  const totalPages = progress.totalPages > 0 ? progress.totalPages : fallbackTotalPages;
  if (totalPages <= 0) {
    return 0;
  }

  return Math.min(Math.round(((progress.page + 1) / totalPages) * 100), 100);
}
