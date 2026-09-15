import { Directory, File, Paths } from 'expo-file-system';

const PREFIX = 'kombiqo-photo:';
const directory = () => new Directory(Paths.document, 'kombiqo-photos');
function localFile(image: string): File | undefined {
  if (!image.startsWith(PREFIX)) return undefined;
  const name = image.slice(PREFIX.length);
  if (!/^[a-zA-Z0-9-]+\.(jpg|png)$/.test(name)) throw new Error('Geçersiz fotoğraf kaydı.');
  return new File(directory(), name);
}

export function persistPhoto(image?: string): string | undefined {
  const match = image?.match(/^data:image\/(jpeg|png);base64,/);
  if (!image || !match) return image;
  const folder = directory();
  folder.create({ idempotent: true, intermediates: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${match[1] === 'png' ? 'png' : 'jpg'}`;
  const file = new File(folder, name);
  file.create();
  try { file.write(image.slice(image.indexOf(',') + 1), { encoding: 'base64' }); }
  catch (error) { if (file.exists) file.delete(); throw error; }
  // Store a relative reference: iOS may change the sandbox path after an update.
  return `${PREFIX}${name}`;
}

export function photoUri(image: string): string { return localFile(image)?.uri ?? image; }
export function removePhoto(image: string): void {
  const file = localFile(image);
  if (file?.exists) file.delete();
}
