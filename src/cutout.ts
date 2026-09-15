export const cutoutAvailable = false;
export const cutoutHint = 'Çevrimdışı temizleme iOS 17 ve üzerindeki Kombiqo iPhone uygulamasında kullanılabilir.';
export async function removeBackground(_image: string): Promise<string> {
  throw new Error(cutoutHint);
}
