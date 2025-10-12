import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
import { ReadableStream, TransformStream, WritableStream } from 'stream/web';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}

if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = ReadableStream as typeof globalThis.ReadableStream;
}

if (typeof globalThis.WritableStream === 'undefined') {
  globalThis.WritableStream = WritableStream as typeof globalThis.WritableStream;
}

if (typeof globalThis.TransformStream === 'undefined') {
  globalThis.TransformStream = TransformStream as typeof globalThis.TransformStream;
}
