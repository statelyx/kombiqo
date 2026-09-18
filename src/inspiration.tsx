import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { AppData, CATEGORIES, Category, COLORS, Garment, STYLES, Style } from './domain';
import { localEvidence } from './local-analysis';
import { fromEvidence } from './analysis-domain';
import { available } from './wardrobe-tools';
import { GarmentArt } from './garment-art';
import { SelectList } from './profile';
import { Action, f } from './feature-ui';
export function Inspiration({ data, onSelect }: { data: AppData; onSelect: (item: Garment) => void }) {
  const [photo, setPhoto] = useState<string>(), [category, setCategory] = useState<Category>('Üstler'), [color, setColor] = useState('Lacivert'), [styles, setStyles] = useState<Style[]>([]), [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  async function choose() {
    setBusy(true); setConfirmed(false); setNotice('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false }); if (result.canceled) return;
      const ctx = ImageManipulator.manipulate(result.assets[0].uri); ctx.resize({ width: Math.min(900, result.assets[0].width) });
      const image = await (await ctx.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: .75, base64: true });
      const uri = `data:image/jpeg;base64,${image.base64}`; setPhoto(uri);
      const analysis = fromEvidence(await localEvidence(uri));
      if (analysis.category) setCategory(analysis.category); if (analysis.colorName) setColor(analysis.colorName); setStyles(analysis.styles ?? []);
      setNotice('Fotoğraftaki bir parçayı seç: kategori, renk ve tarzı kontrol et. Ardından diğer parçalar için aynı fotoğrafla tekrar eşleştirebilirsin.');
    } catch { setNotice('Fotoğraf analiz edilemedi; görüntü açıksa özelliklerini elle seçebilirsin.'); }
    finally { setBusy(false); }
  }
  const matches = confirmed ? data.items.filter(item => item.category === category && available(item, data.profile)).map(item => ({ item, score: (item.colorName === color ? 4 : 0) + item.styles.filter(s => styles.includes(s)).length })).sort((a, b) => b.score - a.score).slice(0, 3) : [];
  return <View style={f.panel}><Text style={f.title}>İlhamdan dolabına</Text><Text style={f.muted}>Bir görünümden ilham al, kendi parçalarınla yeniden yorumla. Fotoğraf cihazdan gönderilmez ve gardırobuna kaydedilmez.</Text>
    <Action disabled={busy} label={busy ? 'Fotoğraf hazırlanıyor…' : 'İlham fotoğrafı seç'} onPress={() => { void choose(); }} />
    {photo && <><Image source={{ uri: photo }} resizeMode="contain" style={{ width: '100%', height: 240 }} accessibilityLabel="İlham fotoğrafın" />
      <Text style={f.muted}>Otomatik ipuçları yanılabilir. Eşleşmeler görselin birebir kopyası değil, onayladığın etiketlere göredir.</Text>
      <SelectList label="Eşleştireceğin parçanın kategorisi" options={CATEGORIES} values={[category]} onChange={v => { setCategory(v[0] as Category); setConfirmed(false); }} />
      <SelectList label="Parçanın rengi" options={COLORS.map(c => c.name)} values={[color]} onChange={v => { setColor(v[0]); setConfirmed(false); }} />
      <SelectList label="Tarz ipuçları" options={STYLES} multiple values={styles} onChange={v => { setStyles(v as Style[]); setConfirmed(false); }} />
      <Action label="Bu özelliklerle dolabımda ara" onPress={() => setConfirmed(true)} />
      {confirmed && !matches.length && <Text style={f.text}>Bu kategoride kullanılabilir parça yok.</Text>}
      {matches.map(({ item }) => <View key={item.id} style={{ gap: 6 }}><GarmentArt item={item} size={110} /><Text style={f.text}>{item.name}</Text><Text style={f.muted}>{item.colorName === color ? 'Renk eşleşiyor.' : `Alternatif renk: ${item.colorName}.`} {item.styles.filter(s => styles.includes(s)).join(' · ')}</Text><Action label="Bu parçayla kombin oluştur" onPress={() => onSelect(item)} /></View>)}
      <Action label="Fotoğrafı bırak" onPress={() => { setPhoto(undefined); setConfirmed(false); setNotice(''); }} />
    </>}{notice ? <Text style={f.muted} accessibilityLiveRegion="polite">{notice}</Text> : null}
  </View>;
}
