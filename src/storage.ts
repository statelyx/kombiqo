import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, readStored } from './domain';
import { removePhoto } from './photos';
const KEY = 'kombiqo:wardrobe:v1';
// A record written by a newer app version is preserved here instead of being overwritten.
const PRESERVED_KEY = 'kombiqo:wardrobe:preserved';
let savedPhotos = new Set<string>();
let loadNotice = '';
export function takeLoadNotice() {
  const notice = loadNotice;
  loadNotice = '';
  return notice;
}
export async function loadData(): Promise<AppData> {
  const read = readStored(await AsyncStorage.getItem(KEY));
  if (read.preserved) {
    // Keep the newer record for that version rather than discarding it.
    try { await AsyncStorage.setItem(PRESERVED_KEY, read.preserved); } catch { /* the original record stayed untouched */ }
  }
  loadNotice = read.notice ?? '';
  savedPhotos = new Set(read.data.items.flatMap((item: { image?: string; originalImage?: string }) => [item.image, item.originalImage]).filter((image): image is string => !!image));
  return read.data;
}
let pending = Promise.resolve();
export function saveData(data: AppData) {
  const write = pending.catch(() => {}).then(async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
    const currentPhotos = new Set(data.items.flatMap(item => [item.image, item.originalImage]).filter((image): image is string => !!image));
    for (const image of savedPhotos) {
      // Delete old files only after the new wardrobe has been saved successfully.
      if (!currentPhotos.has(image)) { try { removePhoto(image); } catch { /* An orphan is preferable to losing a saved image. */ } }
    }
    savedPhotos = currentPhotos;
  });
  pending = write;
  return write;
}
