import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { AppData, Garment, CATEGORIES, Category, COLORS, OCCASIONS, Occasion, recommend } from './domain';
import { forgotten, packOutfits } from './wardrobe-tools';
import { SelectList } from './profile';
import { GarmentArt } from './garment-art';
import { Action, f } from './feature-ui';

export function WardrobeHub({ data, onChange, onSelect }: { data: AppData; onChange: React.Dispatch<React.SetStateAction<AppData>>; onSelect: (item: Garment) => void }) {
  const [days, setDays] = useState('3'), [tripName, setTripName] = useState('Kısa seyahat'), [occasion, setOccasion] = useState<Occasion>('Günlük');
  const [shopping, setShopping] = useState(false), [photo, setPhoto] = useState<string>(), [category, setCategory] = useState<Category>('Üstler'), [color, setColor] = useState('Ekru'), [notice, setNotice] = useState('');
  const candidate: Garment = { id: 'shopping-preview', name: 'Düşündüğüm parça', category, image: photo, colorName: color, color: COLORS.find(entry => entry.name === color)!.hex, styles: data.preferences.styles, fit: 'Düz', occasions: [occasion] };
  const matches = shopping && photo ? recommend([...data.items, candidate], data.preferences, occasion, [], [], data.feedback, data.profile?.brands, { pinned: candidate.id, profile: data.profile }) : [];
  async function choose() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false });
      if (result.canceled) return;
      const context = ImageManipulator.manipulate(result.assets[0].uri); context.resize({ width: Math.min(800, result.assets[0].width) });
      const image = await (await context.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: .7, base64: true });
      setPhoto(`data:image/jpeg;base64,${image.base64}`);
    } catch { setNotice('Fotoğraf açılamadı. Tekrar deneyebilirsin.'); }
  }
  return <>
    <View style={f.panel}><Text style={f.title}>Dolabını yeniden keşfet</Text><Text style={f.muted}>Önce hiç giyildi olarak işaretlenmeyen, sonra en uzun süredir seçilmeyen parçalar.</Text>
      {forgotten(data.items).map(item => <Action key={item.id} label={`${item.name} · ${item.wearCount ?? 0} kez`} onPress={() => onSelect(item)} />)}
      <Text style={f.text}>Çamaşırda: {data.items.filter(item => item.laundry).length}</Text>
      {data.items.filter(item => item.laundry).map(item => <Action key={item.id} label={`${item.name} · temiz olarak işaretle`} onPress={() => onChange(previous => ({ ...previous, items: previous.items.map(entry => entry.id === item.id ? { ...entry, laundry: false } : entry) }))} />)}
    </View>
    <View style={f.panel}><Text style={f.title}>Valiz ve özel gün planı</Text><TextInput accessibilityLabel="Plan adı" value={tripName} onChangeText={setTripName} maxLength={60} style={f.input} /><TextInput accessibilityLabel="Gün sayısı" keyboardType="number-pad" value={days} onChangeText={setDays} maxLength={1} style={f.input} />
      <SelectList label="Planın kullanım alanı" options={OCCASIONS} values={[occasion]} onChange={v => setOccasion(v[0] as Occasion)} />
      <Action label="1–7 günlük plan oluştur" onPress={() => {
        const ideas = recommend(data.items, data.preferences, occasion, data.saved, [], data.feedback, data.profile?.brands, { profile: data.profile });
        const outfits = packOutfits(ideas, Number(days));
        if (!outfits.length) { setNotice('Bu kullanım alanı için temiz üst + alt + ayakkabı veya elbise + ayakkabı gerekli.'); return; }
        onChange(previous => ({ ...previous, trips: [...(previous.trips ?? []), { id: `trip-${Date.now()}`, name: tripName.trim() || 'Seyahat', outfits }].slice(-12) }));
      }} />
      {(data.trips ?? []).map(trip => <View key={trip.id}><Text style={f.text}>{trip.name} · {trip.outfits.length} kombin</Text><Text style={f.muted}>{[...new Set(trip.outfits.flatMap(outfit => outfit.itemIds))].map(id => data.items.find(item => item.id === id)?.name).filter(Boolean).join(' · ')}</Text>{trip.outfits.map((outfit, i) => <Text key={outfit.id} style={f.muted}>{i + 1}. gün: {outfit.itemIds.map(id => data.items.find(item => item.id === id)?.name).filter(Boolean).join(' + ')}</Text>)}<Action label="Planı kaldır" onPress={() => onChange(previous => ({ ...previous, trips: previous.trips?.filter(entry => entry.id !== trip.id) }))} /></View>)}
    </View>
    <View style={f.panel}><Text style={f.title}>Almadan önce eşleştir</Text><Text style={f.muted}>Geçici ürün fotoğrafı bu ekranda kalır, gardırobuna kaydedilmez. Kategori ve rengi sen seçersin.</Text><Action label={shopping ? 'Denemeyi kapat ve fotoğrafı bırak' : 'Ürün dene'} onPress={() => { setShopping(!shopping); setPhoto(undefined); }} />
      {shopping && <><Action label="Ürün fotoğrafı seç" onPress={() => { void choose(); }} /><SelectList label="Geçici ürün kategorisi" options={CATEGORIES.filter(entry => !['Dış giyim', 'Çantalar', 'Aksesuarlar'].includes(entry))} values={[category]} onChange={v => setCategory(v[0] as Category)} /><SelectList label="Geçici ürün rengi" options={COLORS.map(entry => entry.name)} values={[color]} onChange={v => setColor(v[0])} />{photo && <><GarmentArt item={candidate} size={110} /><Text style={f.text}>{matches.length ? 'Dolabındaki eşleşmeler' : 'Bu ürünle tamamlanabilen kombin bulunamadı.'}</Text>{matches.slice(0, 3).map(outfit => <Text key={outfit.id} style={f.muted}>{outfit.itemIds.filter(id => id !== candidate.id).map(id => data.items.find(item => item.id === id)?.name).join(' + ')}</Text>)}</>}</>}
    </View>{notice ? <Text accessibilityLiveRegion="polite" style={f.text}>{notice}</Text> : null}
  </>;
}
