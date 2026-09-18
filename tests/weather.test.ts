import { expect, it, vi } from 'vitest';
// @ts-ignore server module is plain JavaScript
import { weatherResponse, compactForecast } from '../server/weather.mjs';
function storage() { const values = new Map(); const store = { get: async (key: string) => values.get(key), put: async (key: string, value: unknown) => { values.set(key, value); }, transaction: async (fn: (tx: unknown) => unknown): Promise<unknown> => fn(store) }; return store; }
const body = { properties: { timeseries: [{ time: '2026-09-18T17:00:00Z', data: { instant: { details: { air_temperature: 18, wind_speed: 3 } }, next_1_hours: { details: { precipitation_amount: 1 } } } }] } };
it('normalizes weather without manufacturing a temperature', () => { expect(compactForecast(body, Date.now(), '2026-09-19').hours[0].rain).toBe(true); expect(() => compactForecast({}, Date.now(), '')).toThrow(); });
it('caches forecasts and limits provider calls', async () => {
  const db = storage(); const get = vi.fn(async () => Response.json(body, { headers: { Expires: new Date(Date.now() + 3600000).toUTCString() } }));
  const req = new Request('https://internal/weather?city=Ankara');
  expect((await weatherResponse(req, db, get)).status).toBe(200);
  expect((await weatherResponse(req, db, get)).status).toBe(200); expect(get).toHaveBeenCalledTimes(1);
  await db.put('weather-budget', { day: new Date().toISOString().slice(0,10), count: 200 });
  expect((await weatherResponse(new Request('https://internal/weather?city=Bursa'), db, get)).status).toBe(429);
  expect((await weatherResponse(new Request('https://internal/weather?city=unknown'), db, get)).status).toBe(400);
});
