import { describe, expect, it } from 'vitest';
import { createBackup, parseBackup, DEMO_ITEMS, emptyData, recommend, removeItem, styleAffinity } from '../src/domain';
import { available, forgotten, markWorn, packOutfits, replacePiece } from '../src/wardrobe-tools';

const data = { ...emptyData(), items: DEMO_ITEMS.map(item => ({ ...item })) };
const ideas = recommend(data.items, data.preferences, 'Günlük', [], []);
describe('wardrobe tools', () => {
  it('never recommends laundry, honors a pinned item before the result limit', () => {
    const items = data.items.map(item => item.id === 'demo-4' ? { ...item, laundry: true } : item);
    const result = recommend(items, data.preferences, 'Günlük', [], [], [], [], { pinned: 'demo-1' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(outfit => outfit.itemIds.includes('demo-1') && !outfit.itemIds.includes('demo-4'))).toBe(true);
  });
  it('can pin a bag without substituting it for a base garment', () => {
    const bag = { ...DEMO_ITEMS[0], id: 'bag', category: 'Çantalar' as const };
    const result = recommend([...data.items, bag], data.preferences, 'Günlük', [], [], [], [], { pinned: bag.id });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(outfit => outfit.itemIds.includes('bag') && outfit.itemIds.length === 4)).toBe(true);
  });
  it('uses explicit collection and coverage instead of gender assumptions', () => {
    const profile = { name: '', brands: [], gender: 'Erkek', collections: ['Kadın'], coverage: 'Daha örtücü' };
    expect(available({ ...DEMO_ITEMS[0], collection: 'Kadın', coverage: 'Örtücü' }, profile)).toBe(true);
    expect(available({ ...DEMO_ITEMS[0], coverage: 'Açık' }, profile)).toBe(false);
    expect(available({ ...DEMO_ITEMS[0], collection: 'Erkek' }, profile)).toBe(false);
  });
  it('replaces only the selected category and rejects unavailable pieces', () => {
    const outfit = ideas[0], old = data.items.find(item => item.id === outfit.itemIds[0])!;
    expect(replacePiece(outfit, old.id, { ...old, id: 'new', laundry: true }, data.items)).toBe(outfit);
    const replacement = { ...old, id: 'new' };
    const next = replacePiece(outfit, old.id, replacement, [...data.items, replacement]);
    expect(next.itemIds).toContain('new');
    expect(next.itemIds.filter(id => id !== 'new')).toEqual(outfit.itemIds.filter(id => id !== old.id));
  });
  it('counts wear once per day and never changes unrelated garments', () => {
    const once = markWorn(data, ideas[0], '2026-09-17');
    expect(markWorn(once, ideas[0], '2026-09-17')).toEqual(once);
    expect(once.items.filter(item => ideas[0].itemIds.includes(item.id)).every(item => item.wearCount === 1)).toBe(true);
  });
  it('bounds packing days, deduplicates outfits and cleans deleted items from plans', () => {
    const outfits = packOutfits(ideas, 100);
    expect(outfits.length).toBeLessThanOrEqual(7);
    expect(new Set(outfits.map(outfit => outfit.id)).size).toBe(outfits.length);
    const removed = removeItem({ ...data, trips: [{ id: 'trip', name: 'Test', outfits }] }, outfits[0].itemIds[0]);
    expect(removed.trips![0].outfits.every(outfit => !outfit.itemIds.includes(outfits[0].itemIds[0]))).toBe(true);
  });
  it('preserves second views and brush edits through backups', () => {
    const value = { ...data, items: [{ ...data.items[0], secondImage: 'data:image/png;base64,abc', brush: [{ points: 'M1 1 L2 2', width: 25, restore: false }] }] };
    expect(parseBackup(createBackup(value))).toEqual(value);
  });
  it('does not infer a style dislike from a color rejection', () => {
    expect(styleAffinity([{ id: 'a', styles: ['Minimal'], liked: false, reason: 'Renk' }]).Minimal).toBe(0);
    expect(forgotten([{ ...DEMO_ITEMS[0], laundry: true }])).toEqual([]);
  });
});
