export type ResourceFormat = 'images' | 'pdf' | 'epub' | 'cbz' | 'txt' | 'other';

export interface ResourceMeta {
  id: string;
  title: string;
  description: string;
  author: string;
  coverUrl: string;
  tags: string[];
  pageCount: number;
  format: ResourceFormat;
  updatedAt?: string;
}

export interface Resource extends ResourceMeta {
  pages: string[];
  fileUrl?: string;
  fileName?: string;
}

export interface UploadResourcePayload {
  title: string;
  description: string;
  author: string;
  tags: string[];
  coverFile?: File;
  coverUrl?: string;
  documentFile?: File;
  pageFiles?: File[];
}
