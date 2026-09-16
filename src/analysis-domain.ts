import { CATEGORIES, COLORS, STYLES, OCCASIONS, Category, Style, Occasion, Fit } from './domain';

export type Analysis = { category?: Category; colorName?: string; brand?: string; styles?: Style[]; occasions?: Occasion[]; fit?: Fit; name?: string };
export type Evidence = { labels?: { label: string; confidence: number }[]; text?: string[]; pixels?: number[] };
const brands = ['Adidas', 'Bershka', 'Beymen', 'Columbia', 'DeFacto', 'Diesel', 'H&M', 'Koton', 'Lacoste', 'LC Waikiki', 'Mango', 'Massimo Dutti', 'New Balance', 'Nike', 'Puma', 'Reebok', 'Skechers', 'Stradivarius', 'The North Face', 'Tommy Hilfiger', 'Under Armour', 'Vakko', 'Zara'];
const norm = (s: string) => s.normalize('NFKC').toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

// Unknown values stay absent. External text is never used as an instruction or a URL.
export function sanitizeAnalysis(value: unknown): Analysis {
  if (!value || typeof value !== 'object') return {};
  const v = value as Record<string, unknown>, out: Analysis = {};
  if (CATEGORIES.includes(v.category as Category)) out.category = v.category as Category;
  if (COLORS.some(c => c.name === v.colorName)) out.colorName = v.colorName as string;
  if (['Dar', 'Düz', 'Bol'].includes(v.fit as string)) out.fit = v.fit as Fit;
  if (Array.isArray(v.styles)) { const a = STYLES.filter(x => (v.styles as unknown[]).includes(x)); if (a.length) out.styles = a; }
  if (Array.isArray(v.occasions)) { const a = OCCASIONS.filter(x => (v.occasions as unknown[]).includes(x)); if (a.length) out.occasions = a; }
  // Brand needs readable text evidence, not appearance similarity or a guessed logo.
  if (typeof v.brand === 'string' && typeof v.brandEvidence === 'string' && v.brand.length <= 40 && v.brand.trim().length >= 2 && norm(v.brandEvidence).includes(norm(v.brand))) out.brand = v.brand.trim();
  return out;
}

export function dominantColor(pixels: number[]): string | undefined {
  const counts = new Map<string, number>();
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    const [r, g, b, a] = pixels.slice(i, i + 4);
    if (![r, g, b, a].every(x => Number.isFinite(x) && x >= 0 && x <= 255) || a < 128) continue;
    // Center crop is sampled by each platform. Quantization suppresses small highlights.
    const key = [r, g, b].map(x => Math.min(240, Math.floor(x / 24) * 24 + 12)).join(',');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const top = [...counts].sort((a, b) => b[1] - a[1])[0];
  if (!top) return undefined;
  const [r, g, b] = top[0].split(',').map(Number);
  if (b > r * 1.2 && b >= g && Math.max(r, g, b) < 115) return 'Lacivert';
  if (Math.max(r, g, b) < 65) return 'Siyah';
  if (Math.min(r, g, b) > 220) return 'Beyaz';
  if (Math.max(r, g, b) - Math.min(r, g, b) < 18) return 'Gri';
  return COLORS.reduce((best, color) => {
    const rgb = [1, 3, 5].map(i => parseInt(color.hex.slice(i, i + 2), 16));
    const distance = rgb.reduce((sum, x, i) => sum + (x - [r, g, b][i]) ** 2, 0);
    return distance < best.distance ? { name: color.name, distance } : best;
  }, { name: 'Siyah', distance: Infinity }).name;
}

export function fromEvidence(e: Evidence): Analysis {
  const out: Analysis = {};
  const mapping: [RegExp, Category][] = [[/\b(t.shirt|shirt|blouse|sweater|jersey|cardigan|hoodie)\b/, 'Üstler'], [/\b(pants|trousers|jeans|skirt|shorts)\b/, 'Altlar'], [/\b(jacket|coat|blazer)\b/, 'Dış giyim'], [/\b(shoe|shoes|sneaker|footwear|boot|sandal)\b/, 'Ayakkabılar'], [/\b(dress|gown)\b/, 'Elbiseler']];
  for (const entry of [...(e.labels ?? [])].filter(x => x.confidence >= 0.65).sort((a, b) => b.confidence - a.confidence)) {
    const match = mapping.find(([pattern]) => pattern.test(entry.label.toLowerCase().replace(/_/g, ' ')));
    if (match) { out.category = match[1]; break; }
  }
  const text = ' ' + norm((e.text ?? []).join(' ')) + ' ';
  out.brand = brands.find(brand => text.includes(' ' + norm(brand) + ' '));
  out.colorName = dominantColor(e.pixels ?? []);
  return out;
}

export function hasAnalysis(a: Analysis) { return Object.values(a).some(v => v !== undefined && (!Array.isArray(v) || v.length > 0)); }
