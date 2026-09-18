import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_ANALYSIS_URL } from './analysis-config';
import { Forecast } from './day-planner';
export async function fetchWeather(city: string): Promise<Forecast> {
  const key = `kombiqo-weather:${city}`;
  try { const cached = JSON.parse(await AsyncStorage.getItem(key) ?? 'null'); if (cached && Date.parse(cached.expiresAt) > Date.now() && Array.isArray(cached.hours)) return cached; } catch { /* A cache failure must not block manual planning. */ }
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${DEFAULT_ANALYSIS_URL.replace(/\/analyze$/, '/weather')}?city=${encodeURIComponent(city)}`, { signal: controller.signal });
    if (!response.ok) throw new Error('Hava bilgisi alınamadı. Koşulları elle seçebilirsin.');
    const result = await response.json() as Forecast;
    if (!Array.isArray(result.hours) || !result.hours.length || !Number.isFinite(Date.parse(result.expiresAt)) || !result.hours.every(h => Number.isFinite(h.temperature) && Number.isFinite(h.wind) && Number.isFinite(Date.parse(h.time)) && typeof h.rain === 'boolean')) throw new Error('Hava verisi doğrulanamadı.');
    await AsyncStorage.setItem(key, JSON.stringify(result)).catch(() => {});
    return result;
  } finally { clearTimeout(timer); }
}
