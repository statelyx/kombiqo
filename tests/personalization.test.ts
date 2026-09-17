import { describe, expect, it } from 'vitest';
import { DEMO_ITEMS, emptyData, rateOutfit, recommend, styleAffinity, Garment, Feedback } from '../src/domain';
describe('local style learning', () => {
  const initial = { ...emptyData(), items: DEMO_ITEMS };
  const outfit = recommend(initial.items, initial.preferences, 'Günlük', [], [])[0];
  it('saves likes, replaces repeated votes and removes a previous rejection', () => {
    const disliked = rateOutfit(initial, outfit, false);
    const liked = rateOutfit(rateOutfit(disliked, outfit, true), outfit, true);
    expect(liked.saved).toEqual([outfit]);
    expect(liked.rejected).toEqual([]);
    expect(liked.feedback).toHaveLength(1);
    expect(disliked.saved).toEqual([]);
    expect(disliked.rejected).toContain(outfit.id);
  });
  it('learns once per style per outfit with bounded influence', () => {
    expect(styleAffinity([{ id: '1', styles: ['Sportif', 'Sportif'], liked: true }]).Sportif).toBe(1);
    const votes: Feedback[] = Array.from({ length: 20 }, (_, n) => ({ id: String(n), styles: ['Sportif'], liked: true }));
    expect(styleAffinity(votes).Sportif).toBe(5);
  });
  it('applies learned style to new products never previously liked', () => {
    const base: Garment = { ...DEMO_ITEMS[0], styles: ['Minimal'], fit: 'Düz' };
    const items: Garment[] = [{ ...base, id: 'a', styles: ['Minimal'] }, { ...base, id: 'b', styles: ['Sportif'] }, { ...base, id: 'c', category: 'Altlar', styles: [] }, { ...base, id: 'd', category: 'Ayakkabılar', styles: [] }];
    const prefs = { ...initial.preferences, styles: [], exploration: false };
    expect(recommend(items, prefs, 'Günlük', [], [])[0].itemIds).toContain('a');
    expect(recommend(items, prefs, 'Günlük', [], [], [{ id: 'old', styles: ['Sportif'], liked: true }])[0].itemIds).toContain('b');
  });
  it('uses selected brands without requiring profile data on old records', () => {
    const items = [{ ...DEMO_ITEMS[0], id: 'a', brand: 'Mango' }, { ...DEMO_ITEMS[0], id: 'b', brand: 'Zara' }, DEMO_ITEMS[3], DEMO_ITEMS[6]];
    expect(recommend(items, initial.preferences, 'Günlük', [], [], [], ['Zara'])[0].itemIds).toContain('b');
    expect(rateOutfit(initial, outfit, true).items).toBe(initial.items);
  });
  it('undo restores the previous votes and favorites', () => {
    const next = rateOutfit(initial, outfit, true);
    const restored = { ...next, saved: initial.saved, rejected: initial.rejected, feedback: initial.feedback };
    expect(restored.saved).toEqual([]);
    expect(styleAffinity(restored.feedback).Minimal).toBe(0);
  });
});

it('shares one vote across tags and treats a rejection as weak evidence', () => {
  const liked = styleAffinity([{ id: 'mixed', styles: ['Minimal', 'Sportif'], liked: true }]);
  expect(liked.Minimal).toBe(.5);
  expect(liked.Sportif).toBe(.5);
  const rejected = styleAffinity([{ id: 'mixed', styles: ['Minimal', 'Sportif'], liked: false }]);
  expect(rejected.Minimal).toBeCloseTo(-.075);
});
