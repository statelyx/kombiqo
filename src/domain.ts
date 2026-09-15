export const CATEGORIES = ['Üstler', 'Altlar', 'Dış giyim', 'Ayakkabılar', 'Elbiseler'] as const;
export const STYLES = ['Minimal', 'Sokak stili', 'Klasik', 'Sportif', 'Romantik'] as const;
export const OCCASIONS = ['Günlük', 'İş', 'Dışarıda'] as const;
export type Category = typeof CATEGORIES[number];
export type Style = typeof STYLES[number];
export type Occasion = typeof OCCASIONS[number];
export type Fit = 'Dar' | 'Düz' | 'Bol';
export type Garment = { id: string; name: string; category: Category; color: string; colorName: string; fit: Fit; styles: Style[]; occasions: Occasion[]; image?: string; originalImage?: string; cutout?: boolean; demo?: boolean };
export type Outfit = { id: string; itemIds: string[]; occasion: Occasion; title: string; reason: string };
export type Preferences = { styles: Style[]; exploration: boolean; fits: Fit[] };
export type AppData = { version: 1; items: Garment[]; preferences: Preferences; saved: Outfit[]; rejected: string[]; onboarded: boolean };
export const COLORS = [{ name: 'Ekru', hex: '#E7DFD0' }, { name: 'Siyah', hex: '#343432' }, { name: 'Mavi', hex: '#819BAD' }, { name: 'Kahve', hex: '#826652' }, { name: 'Yeşil', hex: '#7B8469' }, { name: 'Beyaz', hex: '#F4F2ED' }, { name: 'Pembe', hex: '#CEA5A1' }, { name: 'Bordo', hex: '#824B52' }];
export const DEFAULT_PREFERENCES: Preferences = { styles: ['Minimal', 'Sokak stili'], fits: ['Düz', 'Bol'], exploration: true };
export const DEMO_ITEMS: Garment[] = [
  { id: 'demo-1', name: 'Ekru basic tişört', category: 'Üstler', color: '#E7DFD0', colorName: 'Ekru', fit: 'Bol', styles: ['Minimal', 'Sokak stili'], occasions: ['Günlük', 'Dışarıda'], demo: true },
  { id: 'demo-2', name: 'Çizgili gömlek', category: 'Üstler', color: '#A4B6C0', colorName: 'Mavi', fit: 'Düz', styles: ['Minimal', 'Klasik'], occasions: ['Günlük', 'İş', 'Dışarıda'], demo: true },
  { id: 'demo-3', name: 'Zeytin triko', category: 'Üstler', color: '#7B8469', colorName: 'Yeşil', fit: 'Bol', styles: ['Minimal', 'Romantik'], occasions: ['Günlük', 'Dışarıda'], demo: true },
  { id: 'demo-4', name: 'Düz kesim denim', category: 'Altlar', color: '#819BAD', colorName: 'Mavi', fit: 'Düz', styles: ['Minimal', 'Sokak stili'], occasions: ['Günlük', 'Dışarıda'], demo: true },
  { id: 'demo-5', name: 'Kahve pileli pantolon', category: 'Altlar', color: '#826652', colorName: 'Kahve', fit: 'Bol', styles: ['Klasik', 'Minimal'], occasions: ['Günlük', 'İş', 'Dışarıda'], demo: true },
  { id: 'demo-6', name: 'Siyah rahat pantolon', category: 'Altlar', color: '#343432', colorName: 'Siyah', fit: 'Bol', styles: ['Sokak stili', 'Sportif'], occasions: ['Günlük', 'Dışarıda'], demo: true },
  { id: 'demo-7', name: 'Beyaz sneaker', category: 'Ayakkabılar', color: '#F4F2ED', colorName: 'Beyaz', fit: 'Düz', styles: ['Minimal', 'Sokak stili', 'Sportif'], occasions: ['Günlük', 'Dışarıda'], demo: true },
  { id: 'demo-8', name: 'Kahve loafer', category: 'Ayakkabılar', color: '#826652', colorName: 'Kahve', fit: 'Düz', styles: ['Klasik', 'Minimal'], occasions: ['Günlük', 'İş', 'Dışarıda'], demo: true },
  { id: 'demo-9', name: 'Kum rengi blazer', category: 'Dış giyim', color: '#C3B298', colorName: 'Ekru', fit: 'Bol', styles: ['Klasik', 'Minimal'], occasions: ['İş', 'Dışarıda'], demo: true },
];
export const emptyData = (): AppData => ({ version: 1, items: [], preferences: { ...DEFAULT_PREFERENCES }, saved: [], rejected: [], onboarded: false });
export const outfitId = (ids: string[], occasion: Occasion) => `${occasion}:${[...ids].sort().join('|')}`;

// Local preference scoring; no external model or live trend claims.
export function recommend(items: Garment[], preferences: Preferences, occasion: Occasion, saved: Outfit[], rejected: string[]): Outfit[] {
  const available = items.filter(item => item.occasions.includes(occasion));
  const byCategory = (category: Category) => available.filter(item => item.category === category);
  const bases = byCategory('Üstler').flatMap(top => byCategory('Altlar').map(bottom => [top, bottom]));
  bases.push(...byCategory('Elbiseler').map(dress => [dress]));
  const candidates = bases.flatMap(base => byCategory('Ayakkabılar').map(shoe => [...base, shoe]));
  const neutral = new Set(['Ekru', 'Siyah', 'Beyaz', 'Kahve']);
  const liked = new Map<string, number>();
  saved.forEach(outfit => outfit.itemIds.forEach(id => liked.set(id, (liked.get(id) ?? 0) + 1)));
  const ranked = candidates.map(parts => {
    const id = outfitId(parts.map(item => item.id), occasion);
    let score = 0;
    for (const item of parts) {
      score += item.styles.filter(style => preferences.styles.includes(style)).length * 3;
      if (item.category === 'Ayakkabılar' || preferences.fits.includes(item.fit)) score += 2;
      score += Math.min(liked.get(item.id) ?? 0, 3);
    }
    const accents = new Set(parts.filter(item => !neutral.has(item.colorName)).map(item => item.colorName));
    score += accents.size <= 1 ? 4 : 0;
    const shared = STYLES.find(style => parts.every(item => item.styles.includes(style)));
    if (shared) score += 4;
    const familiar = parts.every(item => item.styles.some(style => preferences.styles.includes(style)));
    if (preferences.exploration && !familiar) score += 3;
    const outfit: Outfit = { id, itemIds: parts.map(item => item.id), occasion,
      title: shared === 'Klasik' ? 'Biraz daha özenli' : shared === 'Sokak stili' ? 'Sokağın ritmi' : accents.size === 0 ? 'Sade bir uyum' : 'Günün iyi fikri',
      reason: `${shared ? `${shared} çizgideki parçalar` : 'Farklı tarzlardan parçalar'} ${accents.size <= 1 ? 'sakin bir renk dengesiyle' : 'renkli bir eşleşmeyle'} bir arada. ${familiar ? 'Seçtiğin tarzlara yakın.' : 'Alıştığın çizginin biraz dışında bir deneme.'}` };
    return { outfit, score };
  }).filter(entry => !rejected.includes(entry.outfit.id)).sort((a, b) => b.score - a.score || a.outfit.id.localeCompare(b.outfit.id));
  const selected: Outfit[] = [];
  while (ranked.length && selected.length < 12) {
    let bestIndex = 0, bestScore = -Infinity;
    ranked.forEach((entry, index) => {
      const repeats = selected.reduce((sum, prior) => sum + entry.outfit.itemIds.filter(id => prior.itemIds.includes(id)).length, 0);
      const adjusted = entry.score - repeats * 3;
      if (adjusted > bestScore) { bestScore = adjusted; bestIndex = index; }
    });
    selected.push(ranked.splice(bestIndex, 1)[0].outfit);
  }
  return selected;
}
export function removeItem(data: AppData, id: string): AppData {
  return { ...data, items: data.items.filter(item => item.id !== id), saved: data.saved.filter(outfit => !outfit.itemIds.includes(id)), rejected: [] };
}
