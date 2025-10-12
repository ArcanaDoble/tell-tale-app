export interface ResourceMeta {
  id: string;
  title: string;
  description: string;
  author: string;
  coverUrl: string;
  tags: string[];
  pageCount: number;
}

export interface Resource extends ResourceMeta {
  pages: string[];
}
