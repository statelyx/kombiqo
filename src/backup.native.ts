import { Directory, File, Paths } from 'expo-file-system';

// Native: backups are written to the app document folder and restored from a picked file.

export const backupFilesAvailable = true;

const PREFIX = 'kombiqo-yedek-';

export async function writeBackupFile(text: string, stamp: string): Promise<string> {
  const folder = new Directory(Paths.document, 'kombiqo-yedekler');
  folder.create({ idempotent: true, intermediates: true });
  const file = new File(folder, `${PREFIX}${stamp}.json`);
  file.create({ intermediates: true, overwrite: true });
  file.write(text);
  return file.uri;
}

export async function pickBackupText(): Promise<string | null> {
  const picked = await File.pickFileAsync({ mimeTypes: ['application/json'] });
  if (picked.canceled) return null;
  return picked.result.text();
}