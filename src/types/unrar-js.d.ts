declare module 'unrar-js' {
  export interface ExtractorFileHeader {
    name: string;
  }

  export interface ExtractorFileEntry {
    type: 'file' | 'service';
    fileHeader: ExtractorFileHeader;
    fileData: Uint8Array;
  }

  export interface Extractor {
    extract(): AsyncGenerator<ExtractorFileEntry, void, unknown>;
  }

  export function createExtractorFromData(options: { data: Uint8Array }): Promise<Extractor>;
}
