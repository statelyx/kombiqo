import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ files: new Map<string, string>(), failWrite: false }));
vi.mock('expo-file-system', () => {
  class Directory { uri: string; constructor(...parts: any[]) { this.uri = parts.map(part => part.uri ?? part).join('/'); } create() {} }
  class File {
    uri: string;
    constructor(...parts: any[]) { this.uri = parts.map(part => part.uri ?? part).join('/'); }
    get exists() { return state.files.has(this.uri); }
    create() { state.files.set(this.uri, ''); }
    write(value: string) { if (state.failWrite) throw new Error('disk full'); state.files.set(this.uri, value); }
    delete() { state.files.delete(this.uri); }
  }
  return { Directory, File, Paths: { document: 'file:///documents' } };
});
import { persistPhoto, photoUri, removePhoto } from '../src/photos.native';
beforeEach(() => { state.files.clear(); state.failWrite = false; });
it('preserves PNG cutouts without JPEG conversion', () => {
  const ref = persistPhoto('data:image/png;base64,YWJj')!;
  expect(ref).toMatch(/\.png$/);
  expect(state.files.get(photoUri(ref))).toBe('YWJj');
  removePhoto(ref);
  expect(state.files.size).toBe(0);
});
it('stores photos as files and resolves portable relative references', () => {
  const ref = persistPhoto('data:image/jpeg;base64,YWJj')!;
  expect(ref).toMatch(/^kombiqo-photo:[\w-]+\.jpg$/);
  expect(photoUri(ref)).toContain('file:///documents/kombiqo-photos/');
  expect(state.files.get(photoUri(ref))).toBe('YWJj');
  expect(persistPhoto(ref)).toBe(ref);
  removePhoto(ref);
  expect(state.files.size).toBe(0);
});
it('rejects references escaping the photo folder', () => {
  expect(() => photoUri('kombiqo-photo:../../secrets.jpg')).toThrow();
  expect(() => removePhoto('kombiqo-photo:../outside.jpg')).toThrow();
});
it('does not delete arbitrary external files and cleans failed writes', () => {
  state.files.set('file:///outside.jpg', 'safe');
  removePhoto('file:///outside.jpg');
  expect(state.files.has('file:///outside.jpg')).toBe(true);
  state.failWrite = true;
  expect(() => persistPhoto('data:image/jpeg;base64,YWJj')).toThrow('disk full');
  expect(state.files.size).toBe(1);
});
