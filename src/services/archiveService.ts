const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.avif']);
const ARCHIVE_EXTENSIONS = new Set(['.cbr', '.cbz', '.rar', '.zip']);

function getExtension(filename: string): string {
  const match = /\.([^.]+)$/.exec(filename);
  return match != null ? `.${match[1].toLowerCase()}` : '';
}

function sanitizeName(path: string): string {
  return path.replace(/^[\\/]+/, '').split(/[\\/]/).filter((segment) => segment.length > 0).join('-');
}

function isImagePath(path: string): boolean {
  return IMAGE_EXTENSIONS.has(getExtension(path));
}

function getMimeType(filename: string): string {
  switch (getExtension(filename)) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.bmp':
      return 'image/bmp';
    case '.avif':
      return 'image/avif';
    default:
      return 'application/octet-stream';
  }
}

function createImageFile(data: Uint8Array, filename: string, mimeType: string): File {
  const arrayBuffer = data.slice().buffer;
  return new File([arrayBuffer], filename, { type: mimeType });
}

export function isArchiveFile(file: File): boolean {
  const extension = getExtension(file.name);
  return ARCHIVE_EXTENSIONS.has(extension);
}

async function extractZipArchive(file: File): Promise<File[]> {
  const { unzipSync } = await import('fflate');
  const buffer = new Uint8Array(await file.arrayBuffer());
  const entries = unzipSync(buffer);
  const extracted: File[] = [];

  for (const [path, data] of Object.entries(entries)) {
    if (!isImagePath(path)) {
      continue;
    }
    const filename = sanitizeName(path);
    if (filename.length === 0) {
      continue;
    }
    const mimeType = getMimeType(filename);
    extracted.push(createImageFile(data, filename, mimeType));
  }

  return extracted;
}

async function extractRarArchive(file: File): Promise<File[]> {
  const { createExtractorFromData } = await import('unrar-js');
  const buffer = new Uint8Array(await file.arrayBuffer());
  const extractor = await createExtractorFromData({ data: buffer });
  const extracted: File[] = [];

  for await (const entry of extractor.extract()) {
    if (entry.type !== 'file') {
      continue;
    }
    const name = entry.fileHeader.name;
    if (!isImagePath(name)) {
      continue;
    }
    const filename = sanitizeName(name);
    if (filename.length === 0) {
      continue;
    }
    const data = entry.fileData as Uint8Array;
    const mimeType = getMimeType(filename);
    extracted.push(createImageFile(data, filename, mimeType));
  }

  return extracted;
}

export async function extractContentFiles(files: File[]): Promise<File[]> {
  const extracted: File[] = [];

  for (const file of files) {
    if (!isArchiveFile(file)) {
      extracted.push(file);
      continue;
    }

    const extension = getExtension(file.name);
    let fromArchive: File[] = [];

    if (extension === '.zip' || extension === '.cbz') {
      fromArchive = await extractZipArchive(file);
    } else if (extension === '.cbr' || extension === '.rar') {
      fromArchive = await extractRarArchive(file);
    }

    extracted.push(...fromArchive);
  }

  return extracted.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}
