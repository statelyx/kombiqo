import { AppData, Category, Garment, Outfit, Profile, outfitId } from './domain';

export const SUBTYPES: Record<Category, string[]> = {
  Üstler: ['Tişört', 'Bluz', 'Gömlek', 'Triko', 'Hırka', 'Tunik'],
  Altlar: ['Pantolon', 'Jean', 'Etek', 'Şort', 'Tayt'],
  'Dış giyim': ['Ceket', 'Blazer', 'Mont', 'Kaban', 'Trençkot'],
  Ayakkabılar: ['Sneaker', 'Topuklu', 'Babet', 'Loafer', 'Bot', 'Sandalet'],
  Elbiseler: ['Elbise', 'Tulum'], Çantalar: ['Omuz çantası', 'Sırt çantası', 'El çantası'],
  Aksesuarlar: ['Kemer', 'Takı', 'Şal', 'Eşarp', 'Şapka'],
};
export function available(item: Garment, profile?: Profile) {
  return !item.laundry && !(profile?.coverage === 'Daha örtücü' && item.coverage === 'Açık') &&
    (!profile?.collections?.length || !item.collection || item.collection === 'Unisex' || profile.collections.includes(item.collection));
}
export function replacePiece(outfit: Outfit, oldId: string, replacement: Garment, items: Garment[], profile?: Profile): Outfit {
  const old = items.find(item => item.id === oldId);
  if (!old || old.category !== replacement.category || !available(replacement, profile) || !replacement.occasions.includes(outfit.occasion)) return outfit;
  const itemIds = outfit.itemIds.map(id => id === oldId ? replacement.id : id);
  return { ...outfit, layout: outfit.layout?.[oldId] ? { ...outfit.layout, [replacement.id]: outfit.layout[oldId] } : outfit.layout, id: outfitId(itemIds, outfit.occasion), itemIds, title: 'Senin dokunuşun', reason: 'Seçtiğin parçalarla düzenlendi.' };
}
export function markWorn(data: AppData, outfit: Outfit, stamp = new Date().toISOString().slice(0, 10)): AppData {
  return { ...data, items: data.items.map(item => outfit.itemIds.includes(item.id) && item.lastWorn !== stamp ? { ...item, lastWorn: stamp, wearCount: (item.wearCount ?? 0) + 1 } : item) };
}
export function forgotten(items: Garment[]) {
  return items.filter(item => !item.laundry).slice().sort((a, b) => (a.lastWorn ?? '').localeCompare(b.lastWorn ?? '') || (a.wearCount ?? 0) - (b.wearCount ?? 0)).slice(0, 4);
}
export function packOutfits(ideas: Outfit[], days: number): Outfit[] {
  const remaining = [...ideas], picked: Outfit[] = [], used = new Set<string>();
  const count = Math.max(1, Math.min(7, Math.floor(days) || 1));
  while (remaining.length && picked.length < count) {
    remaining.sort((a, b) => a.itemIds.filter(id => !used.has(id)).length - b.itemIds.filter(id => !used.has(id)).length);
    const next = remaining.shift()!; picked.push(next); next.itemIds.forEach(id => used.add(id));
  }
  return picked;
}
