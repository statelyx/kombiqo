import React, { useRef, useState } from 'react';
import { Linking, Switch, Text, TextInput, View } from 'react-native';
import { AppData, OCCASIONS, Occasion, Outfit } from './domain';
import { CITIES, DayPlan, dayOutfits, planRange, turkeyDate, weatherForPlan } from './day-planner';
import { calendarChoices, CalendarChoice } from './calendar-access';
import { fetchWeather } from './weather-client';
import { SelectList } from './profile';
import { OutfitComposition } from './outfit-composition';
import { Action, f } from './feature-ui';
const fresh = (): DayPlan => ({ id: `day-${Date.now()}`, title: '', date: turkeyDate(), time: '12:00', endTime: '18:00', city: 'İstanbul', venue: '', outdoors: true, occasion: 'Günlük' });
export function DayPage({ data, onChange, onOpen }: { data: AppData; onChange: React.Dispatch<React.SetStateAction<AppData>>; onOpen: (outfit: Outfit, plan?: DayPlan) => void }) {
  const [plan, setPlan] = useState(fresh), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [show, setShow] = useState(false);
  const [events, setEvents] = useState<CalendarChoice[]>([]), [temperature, setTemperature] = useState('20'), [wind, setWind] = useState('0'), [rain, setRain] = useState(false);
  const revision = useRef(0);
  function patch(values: Partial<DayPlan>, resetWeather = false) { revision.current++; setPlan(p => ({ ...p, ...values, outfit: undefined, ...(resetWeather ? { weather: undefined } : {}) })); setShow(false); setNotice(''); }
  const ideas = show ? dayOutfits(data, plan) : [];
  async function weather() {
    const rev = revision.current; setBusy(true); setNotice('');
    try { planRange(plan); const result = weatherForPlan(await fetchWeather(plan.city), plan); if (rev !== revision.current) return; patch({ weather: result }); setNotice(result ? 'Plan saatleri arasındaki en düşük sıcaklık ve yağış dikkate alındı.' : 'Bu saat aralığı için güncel tahmin yok. Hava koşullarını elle girebilirsin.'); }
    catch (error) { if (rev === revision.current) { patch({ weather: undefined }); setNotice(error instanceof Error ? error.message : 'Hava alınamadı; elle devam edebilirsin.'); } }
    finally { setBusy(false); }
  }
  function save(outfit?: Outfit) { try { planRange(plan); const saved = { ...plan, title: plan.title.trim() || 'Günün planı', outfit }; onChange(p => ({ ...p, plans: [...(p.plans ?? []).filter(entry => entry.id !== saved.id), saved].slice(-100) })); setPlan(saved); setNotice('Plan cihazında kaydedildi.'); } catch (error) { setNotice((error as Error).message); } }
  return <>
    <Text style={f.title}>Günüm</Text><Text style={f.muted}>Nereye, ne zaman? Gardırobun gününe uyum sağlasın. Saatler Türkiye saatidir (UTC+3).</Text>
    <View style={f.panel}>
      <TextInput style={f.input} accessibilityLabel="Etkinlik adı" placeholder="Örn. Akşam yemeği" maxLength={80} value={plan.title} onChangeText={title => patch({ title })} />
      <TextInput style={f.input} accessibilityLabel="Plan tarihi" placeholder="YYYY-AA-GG" value={plan.date} maxLength={10} onChangeText={date => { patch({ date }, true); setEvents([]); }} />
      <View style={f.row}><View style={{ flex: 1 }}><Text style={f.muted}>Başlangıç</Text><TextInput style={f.input} accessibilityLabel="Başlangıç saati" value={plan.time} maxLength={5} onChangeText={time => patch({ time }, true)} /></View><View style={{ flex: 1 }}><Text style={f.muted}>Dönüş</Text><TextInput style={f.input} accessibilityLabel="Dönüş saati" value={plan.endTime} maxLength={5} onChangeText={endTime => patch({ endTime }, true)} /></View></View>
      <Text style={f.muted}>Dönüş daha erkense ertesi gün kabul edilir.</Text>
      <SelectList label="Şehir · merkez tahmini" options={[...CITIES.map(c => c.name), 'Diğer · elle hava girişi']} values={[plan.city]} onChange={v => patch({ city: v[0] }, true)} />
      <TextInput style={f.input} accessibilityLabel="Gidilecek yer" placeholder="İlçe, mekân veya adres" maxLength={120} value={plan.venue} onChangeText={venue => patch({ venue })} />
      <SelectList label="Etkinlik" options={OCCASIONS} values={[plan.occasion]} onChange={v => patch({ occasion: v[0] as Occasion })} />
      <View style={f.row}><Text style={f.text}>Açık havada zaman geçireceğim</Text><Switch accessibilityLabel="Açık hava" value={plan.outdoors} onValueChange={outdoors => patch({ outdoors })} /></View>
      <Action label="Telefon takviminden etkinlik seç" onPress={() => { const rev = revision.current; void (async () => { try { planRange(plan); const found = await calendarChoices(plan.date); if (rev !== revision.current) return; setEvents(found); setNotice(found.length ? 'Aktarmak istediğin etkinliği seç; sonra bilgileri kontrol edip kaydet.' : 'Bu tarihte etkinlik yok.'); } catch (error) { setNotice((error as Error).message); } })(); }} />
      <Text style={f.muted}>Takvim isteğe bağlıdır. Etkinlik metinleri cihazında kalır.</Text>
      {events.map(event => <Action key={event.id + event.start} label={`${event.title}${event.allDay ? ' · tüm gün' : ''} · aktar`} onPress={() => { const tr = (s: string) => new Date(Date.parse(s) + 10800000).toISOString(); patch({ title: event.title.slice(0, 80), venue: event.location.slice(0, 120), date: tr(event.start).slice(0, 10), time: event.allDay ? '09:00' : tr(event.start).slice(11, 16), endTime: event.allDay ? '18:00' : tr(event.end).slice(11, 16) }, true); setEvents([]); setNotice('Aktarıldı. Şehir, etkinlik türü ve saatleri kontrol et. Çok günlük etkinlikler için ayrı günlük plan oluştur.'); }} />)}
    </View>
    <View style={f.panel}><Text style={f.title}>Havaya göre hazırlan</Text><Text style={f.muted}>Yalnızca seçtiğin şehrin koordinatları Cloudflare üzerinden MET Norway’e gönderilir. Tahmin şehir merkezi içindir.</Text>
      <Action disabled={busy || !CITIES.some(c => c.name === plan.city)} label={busy ? 'Tahmin alınıyor…' : 'Saatlerim için hava tahminini al'} onPress={() => { void weather(); }} />
      <Text style={f.muted}>Ya da koşulları kendin belirt:</Text><TextInput style={f.input} accessibilityLabel="Sıcaklık derece" placeholder="Sıcaklık °C" keyboardType="numbers-and-punctuation" value={temperature} onChangeText={setTemperature} /><TextInput style={f.input} accessibilityLabel="Rüzgâr metre saniye" placeholder="Rüzgâr m/s" keyboardType="decimal-pad" value={wind} onChangeText={setWind} />
      <View style={f.row}><Text style={f.text}>Yağış bekliyorum</Text><Switch accessibilityLabel="Yağış" value={rain} onValueChange={setRain} /></View>
      <Action label="Bu hava koşullarını kullan" onPress={() => { const t = Number(temperature.replace(',', '.')), w = Number(wind.replace(',', '.')); if (!temperature.trim() || !wind.trim() || !Number.isFinite(t) || t < -60 || t > 60 || !Number.isFinite(w) || w < 0 || w > 100) { setNotice('Sıcaklık −60 ile 60, rüzgâr 0 ile 100 arasında olmalı.'); return; } patch({ weather: { temperature: t, wind: w, rain, source: 'manual' } }); }} />
      {plan.weather && <Text style={f.text}>{plan.weather.temperature}°C · {plan.weather.rain ? 'Yağışlı' : 'Yağış beklenmiyor'} · {plan.weather.wind} m/s{plan.weather.source === 'manual' ? ' · Senin girdiğin koşullar' : ` · Tahmin alındı: ${new Date(plan.weather.fetchedAt!).toLocaleString('tr-TR')}`}</Text>}
      <Text style={f.muted}>Gerçek sıcaklık kullanılır; hissedilen sıcaklık hesaplanmaz. Kayıtlı tahminler kendiliğinden yenilenmez.</Text>
      <Text accessibilityRole="link" onPress={() => { void Linking.openURL('https://api.met.no/doc/License'); }} style={f.muted}>Hava: MET Norway · CC BY 4.0 · Veriler saat aralığı için özetlenir.</Text>
    </View>
    {notice ? <Text accessibilityLiveRegion="polite" style={f.text}>{notice}</Text> : null}
    <Action label="Günüme uygun kombinleri göster" onPress={() => { try { planRange(plan); setShow(true); } catch (error) { setNotice((error as Error).message); } }} />
    {show && !ideas.length && <Text style={f.text}>Bu etkinlik için temiz üst + alt + ayakkabı veya elbise + ayakkabı ekle.</Text>}
    {ideas.map(outfit => <View style={f.panel} key={outfit.id}><OutfitComposition parts={data.items.filter(i => outfit.itemIds.includes(i.id))} /><Text style={f.text}>{outfit.reason}</Text><Action label="Bu kombini güne kaydet" onPress={() => save(outfit)} /><Action label="Panoda düzenle" onPress={() => onOpen(outfit, plan)} /></View>)}
    <Action label="Kombin seçmeden planı kaydet" onPress={() => save()} />
    <Text style={f.title}>Planlarım</Text>
    {(data.plans ?? []).slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(entry => <View style={f.panel} key={entry.id}><Text style={f.text}>{entry.title} · {entry.date} · {entry.time}–{entry.endTime}</Text><Text style={f.muted}>{entry.city} · {entry.venue} · {entry.occasion}{entry.weather ? ' · Kayıt anındaki hava bilgisi' : ''}</Text><Action label="Planı düzenle / hava tahminini yenile" onPress={() => { revision.current++; setPlan({ ...entry, weather: entry.weather?.source === 'manual' ? entry.weather : undefined }); setShow(false); setEvents([]); setNotice('Plan formda açıldı.'); }} />{entry.outfit && <Action label="Kayıtlı kombini aç" onPress={() => onOpen(entry.outfit!, entry)} />}<Action label="Planı sil" onPress={() => onChange(p => ({ ...p, plans: p.plans?.filter(e => e.id !== entry.id) }))} /></View>)}
    <Action label="Yeni gün planla" onPress={() => { revision.current++; setPlan(fresh()); setEvents([]); setShow(false); setNotice(''); }} />
  </>;
}
