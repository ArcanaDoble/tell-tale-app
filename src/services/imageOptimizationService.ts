const READER_IMAGE_MAX_LONG_EDGE = 2600;
const READER_IMAGE_QUALITY = 0.9;
const OPTIMIZED_IMAGE_TYPE = 'image/webp';
const MAX_OPTIMIZATION_CONCURRENCY = 3;
const SKIPPED_IMAGE_TYPES = new Set(['image/gif', 'image/svg+xml']);

function getOptimizationConcurrency(): number {
  if (typeof navigator === 'undefined') {
    return 2;
  }

  const logicalCores = navigator.hardwareConcurrency ?? 4;
  return Math.max(1, Math.min(MAX_OPTIMIZATION_CONCURRENCY, logicalCores - 1));
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
}

function replaceExtension(filename: string, extension: string): string {
  const cleanExtension = extension.startsWith('.') ? extension : `.${extension}`;
  return filename.replace(/\.[^.]+$/, '') + cleanExtension;
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });

  if (blob == null) {
    throw new Error('No se pudo optimizar una imagen para la subida.');
  }

  return blob;
}

async function decodeImage(file: File): Promise<ImageBitmap> {
  return await createImageBitmap(file, { imageOrientation: 'from-image' });
}

export async function optimizeReaderImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || SKIPPED_IMAGE_TYPES.has(file.type)) {
    return file;
  }

  try {
    const image = await decodeImage(file);
    const longestEdge = Math.max(image.width, image.height);
    const scale = longestEdge > READER_IMAGE_MAX_LONG_EDGE ? READER_IMAGE_MAX_LONG_EDGE / longestEdge : 1;
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { alpha: false });
    if (context == null) {
      image.close();
      return file;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    image.close();

    const optimizedBlob = await canvasToBlob(canvas, OPTIMIZED_IMAGE_TYPE, READER_IMAGE_QUALITY);
    const resized = scale < 1;
    const meaningfullySmaller = optimizedBlob.size < file.size * 0.96;

    if (!resized && !meaningfullySmaller) {
      return file;
    }

    return new File([optimizedBlob], replaceExtension(file.name, '.webp'), {
      type: OPTIMIZED_IMAGE_TYPE,
      lastModified: file.lastModified
    });
  } catch (error) {
    console.warn(`No se pudo optimizar la imagen ${file.name}. Se subirá el archivo original.`, error);
    return file;
  }
}

export async function optimizeReaderImages(files: File[], onProgress?: (completed: number, total: number) => void): Promise<File[]> {
  let completed = 0;

  return await mapWithConcurrency(files, getOptimizationConcurrency(), async (file) => {
    const optimized = await optimizeReaderImage(file);
    completed += 1;
    onProgress?.(completed, files.length);
    return optimized;
  });
}
