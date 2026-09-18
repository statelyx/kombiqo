import { describe, expect, it } from 'vitest';
import { DayPlan, dayOutfits, planRange, weatherForPlan } from '../src/day-planner';
import { createBackup, DEMO_ITEMS, emptyData, parseBackup, removeItem } from '../src/domain';
const plan: DayPlan = { id: 'test', title: 'Yemek', date: '2026-09-18', time: '20:00', endTime: '23:00', city: 'İstanbul', venue: 'Teras', outdoors: true, occasion: 'Dışarıda', weather: { temperature: 8, rain: true, wind: 12, source: 'manual' } };
describe('day planning', () => {
  it('validates dates and handles overnight in Turkey time', () => {
    expect(() => planRange({ ...plan, date: '2026-02-30' })).toThrow();
    expect(() => planRange({ ...plan, time: '25:00' })).toThrow();
    const range = planRange({ ...plan, endTime: '01:00' });
    expect((+range.end - +range.start) / 3600000).toBe(5);
    expect(range.start.toISOString()).toBe('2026-09-18T17:00:00.000Z');
  });
  it('adds a cold-weather layer and never uses laundry', () => {
    const data = { ...emptyData(), items: DEMO_ITEMS.map(i => ({ ...i, laundry: i.id === 'demo-3', warmth: 'Sıcak' as const })) };
    const ideas = dayOutfits(data, plan);
    expect(ideas.length).toBe(3);
    expect(ideas.every(o => o.itemIds.includes('demo-9') && !o.itemIds.includes('demo-3'))).toBe(true);
  });
  it('does not use expired forecasts', () => {
    const ideas = dayOutfits({ ...emptyData(), items: DEMO_ITEMS }, { ...plan, weather: { ...plan.weather!, source: 'forecast', expiresAt: '2000-01-01' } });
    expect(ideas[0].reason).toContain('Hava bilgisi olmadan');
  });
  it('requires current forecast coverage for the entire event', () => {
    const forecast = { fetchedAt: '2026-09-18T10:00:00Z', expiresAt: '2026-09-18T22:00:00Z', hours: [17,18,19,20].map(h => ({ time: `2026-09-18T${h}:00:00Z`, temperature: 20-h/2, wind: 5, rain: h === 19 })) };
    expect(weatherForPlan(forecast, plan, Date.parse(forecast.fetchedAt))?.rain).toBe(true);
    expect(weatherForPlan({ ...forecast, hours: forecast.hours.slice(0, 1) }, plan, Date.parse(forecast.fetchedAt))).toBeUndefined();
    expect(weatherForPlan(forecast, plan, Date.parse('2026-09-19'))).toBeUndefined();
  });
  it('round trips plans, packing and board layout and removes orphan plan outfits', () => {
    const data = { ...emptyData(), items: DEMO_ITEMS };
    const outfit = { ...dayOutfits(data, plan)[0], layout: { 'demo-1': { x: .1, y: .2, scale: 1, angle: 5 } } };
    const full = { ...data, plans: [{ ...plan, outfit }], trips: [{ id: 'trip', name: 'Valiz', outfits: [outfit], packed: [outfit.itemIds[0]] }] };
    expect(parseBackup(createBackup(full))).toEqual(full);
    expect(removeItem(full, outfit.itemIds[0]).plans?.[0].outfit).toBeUndefined();
  });
});
