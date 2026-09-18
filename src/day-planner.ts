import { AppData, Garment, Occasion, Outfit, outfitId, recommend } from './domain';
import { available } from './wardrobe-tools';

export type Weather = { temperature: number; rain: boolean; wind: number; source: 'manual' | 'forecast'; fetchedAt?: string; expiresAt?: string };
export type DayPlan = { id: string; title: string; date: string; time: string; endTime: string; city: string; venue: string; outdoors: boolean; occasion: Occasion; weather?: Weather; outfit?: Outfit };
export const CITIES = [
  { name: 'İstanbul', lat: 41.01, lon: 28.98 }, { name: 'Ankara', lat: 39.93, lon: 32.86 },
  { name: 'İzmir', lat: 38.42, lon: 27.14 }, { name: 'Antalya', lat: 36.9, lon: 30.7 },
  { name: 'Bursa', lat: 40.19, lon: 29.06 }, { name: 'Adana', lat: 37, lon: 35.32 },
  { name: 'Eskişehir', lat: 39.77, lon: 30.52 }, { name: 'Konya', lat: 37.87, lon: 32.48 },
  { name: 'Gaziantep', lat: 37.07, lon: 37.38 }, { name: 'Trabzon', lat: 41, lon: 39.72 },
  { name: 'Samsun', lat: 41.29, lon: 36.33 }, { name: 'Erzurum', lat: 39.9, lon: 41.27 },
];
export function turkeyDate(date = new Date()) { return new Date(date.getTime() + 10800000).toISOString().slice(0, 10); }
export function planRange(plan: Pick<DayPlan, 'date' | 'time' | 'endTime'>) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(plan.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(plan.time) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(plan.endTime)) throw new Error('Tarihi YYYY-AA-GG, saatleri SS:DD olarak gir.');
  const start = new Date(`${plan.date}T${plan.time}:00+03:00`);
  if (!Number.isFinite(+start) || turkeyDate(start) !== plan.date) throw new Error('Geçerli bir tarih gir.');
  let end = new Date(`${plan.date}T${plan.endTime}:00+03:00`);
  if (+end <= +start) end = new Date(+end + 86400000);
  return { start, end };
}
export function dayOutfits(data: AppData, plan: DayPlan): Outfit[] {
  const weather = plan.weather?.source === 'forecast' && (!plan.weather.expiresAt || Date.parse(plan.weather.expiresAt) <= Date.now()) ? undefined : plan.weather;
  const items = data.items.filter(item => available(item, data.profile));
  const score = (item: Garment) => {
    if (!weather) return 0;
    const desired = weather.temperature < 12 ? 'Sıcak' : weather.temperature > 24 ? 'Hafif' : 'Orta';
    let value = item.warmth ? (item.warmth === desired ? 3 : -2) : 0;
    const month = Number(plan.date.slice(5, 7));
    const season = month <= 2 || month === 12 ? 'Kış' : month <= 5 ? 'İlkbahar' : month <= 8 ? 'Yaz' : 'Sonbahar';
    if (item.seasons?.length) value += item.seasons.includes(season) ? 1 : -1;
    if (plan.outdoors && weather.rain) value += item.rainReady === true ? 4 : item.rainReady === false ? -4 : 0;
    return value;
  };
  const bases = recommend(items, data.preferences, plan.occasion, data.saved, data.rejected, data.feedback, data.profile?.brands, { profile: data.profile, itemBonus: score });
  return bases.map((outfit, index) => {
    const parts = outfit.itemIds.map(id => items.find(item => item.id === id)!);
    if (weather && (weather.temperature < 17 || (plan.outdoors && (weather.wind >= 8 || weather.rain)))) {
      const layer = items.filter(item => item.category === 'Dış giyim' && item.occasions.includes(plan.occasion)).sort((a, b) => score(b) - score(a))[0];
      if (layer) parts.push(layer);
    }
    const itemIds = parts.map(item => item.id);
    const reason = weather ? `${weather.temperature}°C${weather.rain ? ', yağışlı' : ''} koşullar ve ${plan.outdoors ? 'açık' : 'kapalı'} mekân için sıralandı. ${parts.some(item => !item.warmth) ? 'Bazı parçaların sıcaklık bilgisi eksik; seçimini kontrol et.' : 'Kıyafetlere eklediğin sıcaklık bilgileri kullanıldı.'}` : 'Hava bilgisi olmadan, etkinlik ve tarz tercihlerine göre seçildi.';
    return { outfit: { ...outfit, id: outfitId(itemIds, plan.occasion), itemIds, reason }, score: parts.reduce((sum, item) => sum + score(item), 0) - index * .1 };
  }).sort((a, b) => b.score - a.score).slice(0, 3).map(entry => entry.outfit);
}
export type Forecast = { fetchedAt: string; expiresAt: string; hours: { time: string; temperature: number; wind: number; rain: boolean }[] };
export function weatherForPlan(forecast: Forecast, plan: DayPlan, now = Date.now()): Weather | undefined {
  if (!Number.isFinite(Date.parse(forecast.expiresAt)) || Date.parse(forecast.expiresAt) <= now) return;
  const { start, end } = planRange(plan);
  const hours = forecast.hours.filter(hour => Date.parse(hour.time) >= +start - 3600000 && Date.parse(hour.time) <= +end);
  if (!hours.length || Date.parse(hours[0].time) > +start || Date.parse(hours[hours.length - 1].time) < +end - 3600000) return;
  if (hours.some((hour, i) => i > 0 && Date.parse(hour.time) - Date.parse(hours[i - 1].time) > 3600000)) return;
  return { temperature: Math.round(Math.min(...hours.map(hour => hour.temperature))), wind: Math.max(...hours.map(hour => hour.wind)), rain: hours.some(hour => hour.rain), source: 'forecast', fetchedAt: forecast.fetchedAt, expiresAt: forecast.expiresAt };
}
