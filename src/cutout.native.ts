import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import { photoUri } from './photos';
type CutoutModule = { isSupported(): boolean; removeBackground(image: string): Promise<string> };
const native = requireOptionalNativeModule<CutoutModule>('KombiqoCutout');
export const cutoutAvailable = Platform.OS === 'ios' && !!native?.isSupported();
export const cutoutHint = Platform.OS === 'ios'
  ? 'Temizleme için iOS 17+ ve Kombiqo TestFlight sürümü gerekir. Expo Go desteklemez.'
  : 'Bu sürümde çevrimdışı temizleme iPhone için hazırlandı. Android fotoğraflarını orijinal hâliyle ekleyebilirsin.';
export async function removeBackground(image: string): Promise<string> {
  if (!native || !cutoutAvailable) throw new Error(cutoutHint);
  return native.removeBackground(photoUri(image));
}
