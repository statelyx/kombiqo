import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES, DEMO_ITEMS, emptyData, outfitId, recommend, removeItem, Garment } from '../src/domain';
const run = (items = DEMO_ITEMS) => recommend(items, DEFAULT_PREFERENCES, 'Günlük', [], []);
describe('Kombiqo recommendations', () => {
  it('never invents products and produces unique complete outfits', () => {
    const outfits = run();
    expect(outfits.length).toBeGreaterThan(3);
    expect(new Set(outfits.map(outfit => outfit.id)).size).toBe(outfits.length);
    for (const outfit of outfits) {
      const parts = outfit.itemIds.map(id => DEMO_ITEMS.find(item => item.id === id));
      expect(parts.every(Boolean)).toBe(true);
      expect(parts.map(item => item!.category).sort()).toEqual(['Altlar', 'Ayakkabılar', 'Üstler'].sort());
    }
  });
  it('does not fabricate outfits for an empty or incomplete wardrobe', () => {
    expect(run([])).toEqual([]);
    expect(run(DEMO_ITEMS.filter(item => item.category !== 'Ayakkabılar'))).toEqual([]);
    expect(run(DEMO_ITEMS.filter(item => item.category === 'Üstler'))).toEqual([]);
  });
  it('uses only products marked for the requested occasion', () => {
    const outfits = recommend(DEMO_ITEMS, DEFAULT_PREFERENCES, 'İş', [], []);
    expect(outfits.length).toBeGreaterThan(0);
    for (const outfit of outfits) expect(outfit.itemIds.every(id => DEMO_ITEMS.find(item => item.id === id)!.occasions.includes('İş'))).toBe(true);
  });
  it('supports a dress and shoes without requiring trousers', () => {
    const dress: Garment = { ...DEMO_ITEMS[0], id: 'dress', category: 'Elbiseler' };
    const outfits = run([dress, DEMO_ITEMS[6]]);
    expect(outfits).toHaveLength(1);
    expect(outfits[0].itemIds).toEqual(['dress', DEMO_ITEMS[6].id]);
  });
  it('respects rejected combinations and preserves deterministic identity', () => {
    const first = run()[0];
    const later = recommend(DEMO_ITEMS, DEFAULT_PREFERENCES, 'Günlük', [], [first.id]);
    expect(later.some(outfit => outfit.id === first.id)).toBe(false);
    expect(outfitId(['b', 'a'], 'Günlük')).toBe(outfitId(['a', 'b'], 'Günlük'));
    expect(outfitId(['a', 'b'], 'İş')).not.toBe(outfitId(['a', 'b'], 'Günlük'));
  });
  it('changes its first suggestion with different style preferences', () => {
    const street = recommend(DEMO_ITEMS, { styles: ['Sokak stili'], fits: ['Bol'], exploration: false }, 'Günlük', [], []);
    const classic = recommend(DEMO_ITEMS, { styles: ['Klasik'], fits: ['Düz'], exploration: false }, 'Günlük', [], []);
    expect(street[0].id).not.toBe(classic[0].id);
  });
  it('cleans saved outfits when a referenced garment is removed', () => {
    const outfit = run()[0];
    const data = { ...emptyData(), items: DEMO_ITEMS, saved: [outfit] };
    const result = removeItem(data, outfit.itemIds[0]);
    expect(result.saved).toEqual([]);
    expect(result.items.some(item => item.id === outfit.itemIds[0])).toBe(false);
    expect(data.items).toHaveLength(9);
  });
});
