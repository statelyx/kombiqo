import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES, DEMO_ITEMS, emptyData, outfitId, recommend, removeItem, Feedback, Garment, Outfit } from '../src/domain';
const run = (items = DEMO_ITEMS) => recommend(items, DEFAULT_PREFERENCES, 'Günlük', [], []);

// Ranking is deterministic; these snapshots prove optimisations never change the result.
describe('Kombiqo ranking stability', () => {
  const ranked = (outfits: Outfit[]) => outfits.map(outfit => `${outfit.id} · ${outfit.title}`);
  it('keeps the ranked order of the demo wardrobe', () => {
    expect(ranked(run())).toMatchInlineSnapshot(`
      [
        "Günlük:demo-1|demo-4|demo-7 · Günün iyi fikri",
        "Günlük:demo-1|demo-4|demo-8 · Günün iyi fikri",
        "Günlük:demo-2|demo-5|demo-7 · Günün iyi fikri",
        "Günlük:demo-1|demo-6|demo-7 · Sokağın ritmi",
        "Günlük:demo-3|demo-5|demo-8 · Günün iyi fikri",
        "Günlük:demo-2|demo-4|demo-7 · Günün iyi fikri",
        "Günlük:demo-3|demo-6|demo-8 · Günün iyi fikri",
        "Günlük:demo-1|demo-5|demo-7 · Sade bir uyum",
        "Günlük:demo-2|demo-4|demo-8 · Günün iyi fikri",
        "Günlük:demo-3|demo-5|demo-7 · Günün iyi fikri",
        "Günlük:demo-1|demo-6|demo-8 · Sade bir uyum",
        "Günlük:demo-2|demo-5|demo-8 · Günün iyi fikri",
      ]
    `);
  });
  it('keeps the ranked order for a work occasion', () => {
    expect(ranked(recommend(DEMO_ITEMS, DEFAULT_PREFERENCES, 'İş', [], []))).toMatchInlineSnapshot(`
      [
        "İş:demo-2|demo-5|demo-8 · Günün iyi fikri",
      ]
    `);
  });
  it('keeps the ranked order with saved history, rejections, learned styles and brands', () => {
    const first = run()[0];
    const branded = DEMO_ITEMS.map(item => item.id === 'demo-4' ? { ...item, brand: 'Levi’s' } : item);
    const feedback: Feedback[] = [{ id: 'vote-1', styles: ['Sportif'], liked: true }, { id: 'vote-2', styles: ['Klasik'], liked: false }];
    expect(ranked(recommend(branded, DEFAULT_PREFERENCES, 'Günlük', [first], [first.id], feedback, ['Levi’s']))).toMatchInlineSnapshot(`
      [
        "Günlük:demo-2|demo-4|demo-7 · Günün iyi fikri",
        "Günlük:demo-1|demo-6|demo-7 · Sokağın ritmi",
        "Günlük:demo-1|demo-4|demo-8 · Günün iyi fikri",
        "Günlük:demo-3|demo-5|demo-7 · Günün iyi fikri",
        "Günlük:demo-2|demo-4|demo-8 · Günün iyi fikri",
        "Günlük:demo-1|demo-5|demo-7 · Sade bir uyum",
        "Günlük:demo-3|demo-6|demo-8 · Günün iyi fikri",
        "Günlük:demo-2|demo-5|demo-7 · Günün iyi fikri",
        "Günlük:demo-3|demo-4|demo-8 · Günün iyi fikri",
        "Günlük:demo-1|demo-6|demo-8 · Sade bir uyum",
        "Günlük:demo-3|demo-4|demo-7 · Günün iyi fikri",
        "Günlük:demo-1|demo-5|demo-8 · Sade bir uyum",
      ]
    `);
  });
  it('keeps the generated copy of the leading outfit', () => {
    expect(run()[0]).toMatchInlineSnapshot(`
      {
        "id": "Günlük:demo-1|demo-4|demo-7",
        "itemIds": [
          "demo-1",
          "demo-4",
          "demo-7",
        ],
        "occasion": "Günlük",
        "reason": "Minimal çizgideki parçalar sakin bir renk dengesiyle bir arada. Seçtiğin tarzlara yakın.",
        "title": "Günün iyi fikri",
      }
    `);
  });
});
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
