import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, emptyData } from './domain';
import { removePhoto } from './photos';
const KEY = 'kombiqo:wardrobe:v1';
let savedPhotos = new Set<string>();
export async function loadData(): Promise<AppData> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return emptyData();
  const data = JSON.parse(raw);
  if (data.version !== 1 || !Array.isArray(data.items) || !Array.isArray(data.saved) || !Array.isArray(data.rejected) || !Array.isArray(data.preferences?.styles) || !Array.isArray(data.preferences?.fits)) throw new Error('Kayıtlı gardırop okunamadı.');
  savedPhotos = new Set(data.items.flatMap((item: { image?: string; originalImage?: string }) => [item.image, item.originalImage]).filter(Boolean));
  return data;
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
