// Browser preview: no access to the device file system, so the clipboard carries the backup text.
// The app offers clipboard based backup and restore whenever this flag is false.

export const backupFilesAvailable = false;

export async function writeBackupFile(_text: string, _stamp: string): Promise<string> {
  throw new Error('Tarayıcı önizlemesinde yedek dosyası oluşturulamaz. Yedeği panoya kopyalayabilirsin.');
}

export async function pickBackupText(): Promise<string | null> {
  throw new Error('Tarayıcı önizlemesinde yedek dosyası seçilemez. Panodaki yedekle geri yükleyebilirsin.');
}