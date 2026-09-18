import type { DayPlan } from './day-planner';
export const CATEGORIES = ['Üstler', 'Altlar', 'Dış giyim', 'Ayakkabılar', 'Elbiseler', 'Çantalar', 'Aksesuarlar'] as const;
export const STYLES = ['Minimal', 'Sokak stili', 'Klasik', 'Sportif', 'Romantik'] as const;
export const OCCASIONS = ['Günlük', 'İş', 'Dışarıda', 'Davet', 'Spor'] as const;
export type Category = typeof CATEGORIES[number];
export type Style = typeof STYLES[number];
export type Occasion = typeof OCCASIONS[number];
export type Fit = 'Dar' | 'Düz' | 'Bol';
export type BrushStroke = { points: string; width: number; restore: boolean };
export type Garment = { id: string; name: string; category: Category; color: string; colorName: string; fit: Fit; styles: Style[]; occasions: Occasion[]; image?: string; originalImage?: string; cutout?: boolean; demo?: boolean; brand?: string; subtype?: string; collection?: string; coverage?: string; secondImage?: string; secondOriginal?: string; secondCutout?: boolean; preferredAngle?: 'main' | 'second'; backdrop?: string; brush?: BrushStroke[]; laundry?: boolean; lastWorn?: string; wearCount?: number; warmth?: 'Hafif' | 'Orta' | 'Sıcak'; seasons?: string[]; rainReady?: boolean };
export type Outfit = { id: string; itemIds: string[]; occasion: Occasion; title: string; reason: string; layout?: Record<string, { x: number; y: number; scale: number; angle: number }> };
export type Preferences = { styles: Style[]; exploration: boolean; fits: Fit[] };
export type Profile = { name: string; age?: number; gender: string; brands: string[]; collections?: string[]; coverage?: string; occasions?: Occasion[] };
export type Feedback = { id: string; styles: Style[]; liked: boolean; reason?: string };
export type AppData = { version: 1; items: Garment[]; preferences: Preferences; saved: Outfit[]; rejected: string[]; onboarded: boolean; profile?: Profile; feedback?: Feedback[]; trips?: { id: string; name: string; outfits: Outfit[]; packed?: string[] }[]; plans?: DayPlan[] };
export const COLORS = [{ name: 'Ekru', hex: '#E7DFD0' }, { name: 'Lacivert', hex: '#19243B' }, { name: 'Gri', hex: '#858585' }, { name: 'Siyah', hex: '#343432' }, { name: 'Mavi', hex: '#819BAD' }, { name: 'Kahve', hex: '#826652' }, { name: 'Yeşil', hex: '#7B8469' }, { name: 'Beyaz', hex: '#F4F2ED' }, { name: 'Pembe', hex: '#CEA5A1' }, { name: 'Bordo', hex: '#824B52' }];
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
export function recommend(items: Garment[], preferences: Preferences, occasion: Occasion, saved: Outfit[], rejected: string[], feedback: Feedback[] = [], brands: string[] = [], options: { pinned?: string; profile?: Profile; itemBonus?: (item: Garment) => number } = {}): Outfit[] {
  const learned = styleAffinity(feedback);
  const preferredStyles = new Set(preferences.styles);
  const preferredFits = new Set(preferences.fits);
  const preferredBrands = new Set(brands);
  const neutral = new Set(['Ekru', 'Siyah', 'Beyaz', 'Kahve']);
  const rejectedIds = new Set(rejected);
  const liked = new Map<string, number>();
  saved.forEach(outfit => outfit.itemIds.forEach(id => liked.set(id, (liked.get(id) ?? 0) + 1)));
  const byCategory = new Map<Category, Garment[]>();
  const itemScores = new Map<Garment, number>();
  for (const item of items) {
    if (item.laundry || !item.occasions.includes(occasion)) continue;
    if (options.profile?.collections?.length && item.collection && item.collection !== 'Unisex' && !options.profile.collections.includes(item.collection)) continue;
    if (options.profile?.coverage === 'Daha örtücü' && item.coverage === 'Açık') continue;
    byCategory.set(item.category, [...(byCategory.get(item.category) ?? []), item]);
    const styleHits = item.styles.filter(style => preferredStyles.has(style)).length * 3;
    const clothing = item.category === 'Ayakkabılar' || preferredFits.has(item.fit) ? 2 : 0;
    const familiarBrand = item.brand && preferredBrands.has(item.brand) ? 2 : 0;
    const learnedWeight = item.styles.reduce((sum, style) => sum + (learned[style] ?? 0), 0);
    itemScores.set(item, styleHits + clothing + Math.min(liked.get(item.id) ?? 0, 3) + learnedWeight + familiarBrand + (options.itemBonus?.(item) ?? 0));
  }
  const category = (name: Category) => byCategory.get(name) ?? [];
  const shoes = category('Ayakkabılar');
  const bases = category('Üstler').flatMap(top => category('Altlar').map(bottom => [top, bottom]));
  bases.push(...category('Elbiseler').map(dress => [dress]));
  const pinnedExtra = options.pinned ? items.find(item => item.id === options.pinned && ['Dış giyim', 'Çantalar', 'Aksesuarlar'].includes(item.category) && itemScores.has(item)) : undefined;
  const ranked = bases.flatMap(base => shoes.map(shoe => [...base, shoe, ...(pinnedExtra ? [pinnedExtra] : [])])).map(parts => {
    const id = outfitId(parts.map(item => item.id), occasion);
    let score = 0;
    for (const item of parts) score += itemScores.get(item) ?? 0;
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
  }).filter(entry => !rejectedIds.has(entry.outfit.id) && (!options.pinned || entry.outfit.itemIds.includes(options.pinned))).sort((a, b) => b.score - a.score || a.outfit.id.localeCompare(b.outfit.id));
  const selected: Outfit[] = [];
  const reused = new Map<string, number>();
  while (ranked.length && selected.length < 12) {
    let bestIndex = 0, bestAdjusted = -Infinity;
    ranked.forEach((entry, index) => {
      // Equivalent to counting shared items with every already selected outfit.
      const repeats = entry.outfit.itemIds.reduce((sum, id) => sum + (reused.get(id) ?? 0), 0);
      const adjusted = entry.score - repeats * 3;
      if (adjusted > bestAdjusted) { bestAdjusted = adjusted; bestIndex = index; }
    });
    const chosen = ranked.splice(bestIndex, 1)[0].outfit;
    chosen.itemIds.forEach(id => reused.set(id, (reused.get(id) ?? 0) + 1));
    selected.push(chosen);
  }
  return selected;
}
export function removeItem(data: AppData, id: string): AppData {
  return { ...data, items: data.items.filter(item => item.id !== id), saved: data.saved.filter(outfit => !outfit.itemIds.includes(id)), rejected: [], plans: data.plans?.map(plan => plan.outfit?.itemIds.includes(id) ? { ...plan, outfit: undefined } : plan), trips: data.trips?.map(trip => ({ ...trip, outfits: trip.outfits.filter(outfit => !outfit.itemIds.includes(id)) })) };
}

export function styleAffinity(feedback: Feedback[] = []): Partial<Record<Style, number>> {
  const weights: Partial<Record<Style, number>> = {};
  // One outfit is one signal, regardless of how many style tags its pieces carry.
  // Rejections are weak evidence: the disliked part may be color or fit, not style.
  for (const vote of feedback) {
    if (!vote.liked && vote.reason && vote.reason !== 'Tarz') continue;
    const styles = [...new Set(vote.styles)];
    for (const style of styles) weights[style] = (weights[style] ?? 0) + (vote.liked ? 1 : -0.15) / styles.length;
  }
  for (const style of STYLES) weights[style] = Math.max(-3, Math.min(5, weights[style] ?? 0));
  return weights;
}
export function rateOutfit(data: AppData, outfit: Outfit, liked: boolean, reason?: string): AppData {
  const styles = [...new Set(data.items.filter(item => outfit.itemIds.includes(item.id)).flatMap(item => item.styles))];
  return { ...data,
    saved: [...(liked ? [outfit] : []), ...data.saved.filter(entry => entry.id !== outfit.id)],
    rejected: [...data.rejected.filter(id => id !== outfit.id), ...(!liked ? [outfit.id] : [])],
    feedback: [...(data.feedback ?? []).filter(vote => vote.id !== outfit.id), { id: outfit.id, styles, liked, reason }].slice(-200),
  };
}

// --- Stored record safety ---------------------------------------------------

export const SCHEMA_VERSION = 1;
export type Migrations = Record<number, (data: any) => any>;
// Add one step per released version, then raise SCHEMA_VERSION.
export const MIGRATIONS: Migrations = {};
export const UNREADABLE = 'Kayıtlı gardırop okunamadı.';
export const NEWER_VERSION_NOTICE = 'Gardırobun daha yeni bir Kombiqo sürümüyle kaydedilmiş. Kaydını silmedik: uygulamayı güncelleyip açtığında yerinde olacak.';

const FITS: Fit[] = ['Dar', 'Düz', 'Bol'];
const isGarment = (item: any) =>
  !!item && typeof item.id === 'string' && typeof item.name === 'string' && CATEGORIES.includes(item.category) &&
  typeof item.color === 'string' && typeof item.colorName === 'string' && FITS.includes(item.fit) &&
  Array.isArray(item.styles) && Array.isArray(item.occasions) &&
  (item.brush === undefined || (Array.isArray(item.brush) && item.brush.length <= 100 && item.brush.every((stroke: any) => typeof stroke.points === 'string' && stroke.points.length <= 18000 && /^[ML0-9. ,]+$/.test(stroke.points) && Number.isFinite(stroke.width) && stroke.width > 0 && stroke.width <= 100 && typeof stroke.restore === 'boolean'))) &&
  (item.secondImage === undefined || typeof item.secondImage === 'string') &&
  (item.warmth === undefined || ['Hafif', 'Orta', 'Sıcak'].includes(item.warmth)) &&
  (item.seasons === undefined || (Array.isArray(item.seasons) && item.seasons.every((s: any) => ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'].includes(s)))) &&
  (item.rainReady === undefined || typeof item.rainReady === 'boolean') &&
  (item.laundry === undefined || typeof item.laundry === 'boolean') &&
  (item.lastWorn === undefined || (typeof item.lastWorn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.lastWorn))) &&
  (item.wearCount === undefined || (Number.isInteger(item.wearCount) && item.wearCount >= 0));
const isOutfit = (outfit: any) => !!outfit && typeof outfit.id === 'string' && Array.isArray(outfit.itemIds) && outfit.itemIds.every((id: any) => typeof id === 'string') &&
  (outfit.layout === undefined || (outfit.layout && typeof outfit.layout === 'object' && !Array.isArray(outfit.layout) && Object.values(outfit.layout).every((pose: any) => pose && ['x','y','scale','angle'].every(key => Number.isFinite(pose[key])))));
const isStoredData = (data: any, version: number) =>
  !!data && data.version === version && Array.isArray(data.items) && data.items.every(isGarment) &&
  Array.isArray(data.preferences?.styles) && Array.isArray(data.preferences?.fits) &&
  Array.isArray(data.saved) && data.saved.every(isOutfit) &&
  Array.isArray(data.rejected) &&
  (data.trips === undefined || (Array.isArray(data.trips) && data.trips.every((trip: any) => typeof trip.id === 'string' && typeof trip.name === 'string' && (trip.packed === undefined || (Array.isArray(trip.packed) && trip.packed.every((id: any) => typeof id === 'string'))) && Array.isArray(trip.outfits) && trip.outfits.every((outfit: any) => Array.isArray(outfit.itemIds) && outfit.itemIds.every((id: any) => typeof id === 'string'))))) &&
  (data.plans === undefined || (Array.isArray(data.plans) && data.plans.every((p: any) => p && ['id','title','date','time','endTime','city','venue'].every(k => typeof p[k] === 'string') && OCCASIONS.includes(p.occasion) && typeof p.outdoors === 'boolean' && (!p.outfit || isOutfit(p.outfit)) && (!p.weather || (Number.isFinite(p.weather.temperature) && Number.isFinite(p.weather.wind) && typeof p.weather.rain === 'boolean' && ['manual','forecast'].includes(p.weather.source)))))) &&
  (data.profile?.collections === undefined || (Array.isArray(data.profile.collections) && data.profile.collections.every((value: any) => typeof value === 'string')));

export type StoredRead = { data: AppData; notice?: string; preserved?: string };

// Corrupt text throws, so the caller never overwrites a record we cannot understand.
// A record written by a newer version is handed back for safe keeping and the app opens empty.
export function readStored(raw: string | null, target: number = SCHEMA_VERSION, migrations: Migrations = MIGRATIONS): StoredRead {
  if (!raw) return { data: emptyData() };
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { throw new Error(UNREADABLE); }
  if (typeof parsed?.version !== 'number') throw new Error(UNREADABLE);
  if (parsed.version > target) return { data: emptyData(), notice: NEWER_VERSION_NOTICE, preserved: raw };
  let migrated = parsed;
  for (let version = parsed.version; version < target; version++) {
    const step = migrations[version];
    if (!step) throw new Error(UNREADABLE);
    migrated = step(migrated);
  }
  if (!isStoredData(migrated, target)) throw new Error(UNREADABLE);
  return { data: migrated as AppData };
}

// --- Backup file ------------------------------------------------------------

export const BACKUP_FORMAT = 'kombiqo-yedek';

export function createBackup(data: AppData, createdAt: Date = new Date()): string {
  return JSON.stringify({ format: BACKUP_FORMAT, version: SCHEMA_VERSION, createdAt: createdAt.toISOString(), data }, null, 2);
}

export function parseBackup(text: string): AppData {
  let parsed: any;
  try { parsed = JSON.parse(text.trim()); } catch { throw new Error('Yedek okunamadı. Metnin tamamını kopyaladığından emin ol.'); }
  if (parsed?.format !== BACKUP_FORMAT || !parsed.data) throw new Error('Bu metin bir Kombiqo yedeği değil.');
  const read = readStored(JSON.stringify(parsed.data));
  if (read.notice) throw new Error('Yedek daha yeni bir Kombiqo sürümüyle oluşturulmuş. Uygulamayı güncelleyip tekrar dene.');
  return read.data;
}

// --- Input validation -------------------------------------------------------

export function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
}

export function validateAge(value: string): string {
  if (!value) return '';
  if (!/^\d{1,3}$/.test(value) || Number(value) < 1 || Number(value) > 120) return 'Yaşını 1–120 arasında yazabilir veya boş bırakabilirsin.';
  return '';
}
