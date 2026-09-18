const cities = { 'İstanbul': [41.01, 28.98], 'Ankara': [39.93, 32.86], 'İzmir': [38.42, 27.14], 'Antalya': [36.9, 30.7], 'Bursa': [40.19, 29.06], 'Adana': [37, 35.32], 'Eskişehir': [39.77, 30.52], 'Konya': [37.87, 32.48], 'Gaziantep': [37.07, 37.38], 'Trabzon': [41, 39.72], 'Samsun': [41.29, 36.33], 'Erzurum': [39.9, 41.27] };
export function compactForecast(body, now, expiresAt) {
  const hours = (body?.properties?.timeseries ?? []).map(entry => {
    const details = entry.data?.instant?.details;
    const next = entry.data?.next_1_hours ?? entry.data?.next_6_hours;
    return { time: entry.time, temperature: details?.air_temperature, wind: details?.wind_speed, rain: (next?.details?.precipitation_amount ?? 0) > 0.1 };
  }).filter(entry => Number.isFinite(entry.temperature) && Number.isFinite(entry.wind) && Number.isFinite(Date.parse(entry.time)));
  if (!hours.length) throw new Error('invalid forecast');
  return { hours, fetchedAt: new Date(now).toISOString(), expiresAt };
}
export async function weatherResponse(request, storage, fetcher = fetch) {
  const city = new URL(request.url).searchParams.get('city'), coords = cities[city];
  if (!coords) return new Response('Unknown city', { status: 400 });
  const key = `weather:${city}`, now = Date.now(), cached = await storage.get(key);
  if (cached && Date.parse(cached.data.expiresAt) > now) return Response.json(cached.data);
  const allowed = await storage.transaction(async tx => {
    const day = new Date(now).toISOString().slice(0, 10); let budget = await tx.get('weather-budget');
    if (budget?.day !== day) budget = { day, count: 0 };
    if (budget.count >= 200) return false;
    budget.count++; await tx.put('weather-budget', budget); return true;
  });
  if (!allowed) return new Response('Manual weather available', { status: 429 });
  const headers = { 'User-Agent': 'Kombiqo/0.4 github.com/statelyx/kombiqo' };
  if (cached?.modified) headers['If-Modified-Since'] = cached.modified;
  try {
    const response = await fetcher(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${coords[0]}&lon=${coords[1]}`, { headers, signal: AbortSignal.timeout(8000) });
    if (!response.ok && response.status !== 304) return new Response('Forecast unavailable', { status: 503 });
    const expires = Date.parse(response.headers.get('Expires') ?? '');
    const expiresAt = new Date(Math.max(now + 600000, Number.isFinite(expires) ? expires : now + 3600000)).toISOString();
    const data = response.status === 304 && cached ? { ...cached.data, expiresAt, fetchedAt: new Date(now).toISOString() } : compactForecast(await response.json(), now, expiresAt);
    await storage.put(key, { data, modified: response.headers.get('Last-Modified') ?? cached?.modified });
    return Response.json(data);
  } catch { return new Response('Forecast unavailable', { status: 503 }); }
}
