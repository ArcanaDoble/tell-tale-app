export type ResourceType = 'manga' | 'libro' | 'documento';

export interface ResourceMeta {
  id: string;
  title: string;
  description: string;
  author: string;
  coverUrl: string;
  tags: string[];
  pageCount: number;
  resourceType: ResourceType;
  hasReader: boolean;
  downloadUrl?: string | null;
}

export interface Resource extends ResourceMeta {
  pages: string[];
}

export interface ResourceUploadPayload {
  title: string;
  description: string;
  author: string;
  tags: string[];
  resourceType: ResourceType;
  contentFiles: File[];
  coverFile?: File | null;
}
