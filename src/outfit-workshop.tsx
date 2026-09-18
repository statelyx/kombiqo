import React, { useState } from 'react';
import { Image, Modal, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { AppData, Outfit, outfitId } from './domain';
import { available, replacePiece } from './wardrobe-tools';
import { GarmentArt } from './garment-art';
import { OutfitComposition } from './outfit-composition';
import { SelectList } from './profile';
import { Action, f } from './feature-ui';

export function OutfitWorkshop({ outfit, data, onClose, onSave, onWear }: { outfit: Outfit; data: AppData; onClose: () => void; onSave: (outfit: Outfit) => void; onWear: (outfit: Outfit) => void }) {
  const [draft, setDraft] = useState(outfit), [figure, setFigure] = useState(data.profile?.mannequin ?? 'Nötr'), [view, setView] = useState('Kolaj'), [notice, setNotice] = useState('');
  const [personal, setPersonal] = useState<string>();
  const [adjust, setAdjust] = useState<string>();
  const [poses, setPoses] = useState<Record<string, { x: number; y: number; scale: number }>>({});
  async function choosePersonal() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false });
      if (result.canceled) return;
      const context = ImageManipulator.manipulate(result.assets[0].uri); context.resize({ height: Math.min(result.assets[0].height, 1000) });
      const image = await (await context.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: .75, base64: true });
      if (!image.base64) throw new Error('image');
      setPersonal(`data:image/jpeg;base64,${image.base64}`); setView('Fotoğrafım');
    } catch { setNotice('Fotoğraf açılamadı; tekrar deneyebilirsin.'); }
  }
  function move(dx: number, dy: number, ds: number) {
    if (!adjust) return;
    setPoses(previous => { const current = previous[adjust] ?? { x: 0, y: 0, scale: 1 }; return { ...previous, [adjust]: { x: Math.max(-100, Math.min(100, current.x + dx)), y: Math.max(-180, Math.min(180, current.y + dy)), scale: Math.max(.4, Math.min(1.7, current.scale + ds)) } }; });
  }
  const parts = draft.itemIds.map(id => data.items.find(item => item.id === id)).filter(item => !!item);
  const availableItems = data.items.filter(item => available(item, data.profile) && item.occasions.includes(draft.occasion));
  const extras = availableItems.filter(item => ['Dış giyim', 'Çantalar', 'Aksesuarlar'].includes(item.category) && !draft.itemIds.includes(item.id));
  return <Modal visible animationType="slide" onRequestClose={onClose}><SafeAreaView style={f.page}><ScrollView contentContainerStyle={f.content}>
    <Text style={f.title}>Kombin atölyesi</Text><Action label="Kapat" onPress={onClose} />
    <View style={f.row}>{['Kolaj', 'Manken', ...(personal ? ['Fotoğrafım'] : [])].map(label => <Action key={label} label={label} onPress={() => setView(label)} />)}</View>
    {view === 'Kolaj' ? <OutfitComposition parts={parts} /> : <>
      <SelectList label="Manken seçimi" options={['Kadın', 'Erkek', 'Nötr']} values={[figure]} onChange={v => setFigure(v[0])} />
      <View style={{ alignSelf: 'center', width: 270, height: 470 }}>
        {view === 'Fotoğrafım' && personal ? <Image source={{ uri: personal }} resizeMode="contain" style={{ width: 270, height: 470 }} /> : <Svg width={270} height={470} viewBox="0 0 270 470"><Ellipse cx="135" cy="38" rx="23" ry="29" fill="#D7CABA" /><Path d={figure === 'Kadın' ? 'M113 73 L90 91 L66 226 L82 230 L108 139 L118 169 L96 237 L111 433 L130 433 L135 266 L143 433 L162 433 L177 237 L152 169 L162 139 L189 230 L205 225 L179 92 L156 73 Z' : figure === 'Erkek' ? 'M110 73 L76 89 L56 227 L75 232 L98 139 L99 245 L108 433 L129 433 L135 276 L142 433 L163 433 L171 245 L171 139 L195 232 L214 227 L193 89 L159 73 Z' : 'M112 73 L83 92 L62 226 L80 231 L103 140 L104 242 L111 433 L130 433 L135 273 L142 433 L161 433 L166 242 L167 140 L190 231 L208 226 L186 92 L158 73 Z'} fill="#DDD4C7" /></Svg>}
        {parts.filter(item => ['Üstler', 'Altlar', 'Elbiseler', 'Ayakkabılar'].includes(item.category)).map(item => {
          const dress = item.category === 'Elbiseler', bottom = item.category === 'Altlar', shoe = item.category === 'Ayakkabılar';
          const size = dress ? 220 : shoe ? 85 : bottom ? 155 : 175;
          return <View key={item.id} style={{ position: 'absolute', left: (270 - size) / 2, top: shoe ? 363 : bottom ? 210 : 69, transform: [{ translateX: poses[item.id]?.x ?? 0 }, { translateY: poses[item.id]?.y ?? 0 }, { scale: poses[item.id]?.scale ?? 1 }] }}><GarmentArt item={item} size={size} /></View>;
        })}
      </View><Text style={f.muted}>Temsili önden yerleşim. Beden uyumu veya gerçekçi sanal deneme değildir. Aksesuar ve dış katmanları kolajda inceleyebilirsin.</Text>
    </>}
    <Text style={f.muted}>Kendi fotoğrafında yalnızca temsili yerleşim yapabilirsin; gerçekçi giydirme değildir. Fotoğraf cihazdan gönderilmez, kaydedilmez ve bu ekran kapanınca bırakılır.</Text>
    <Action label="Fotoğrafımda yerleştir · temsili" onPress={() => { void choosePersonal(); }} />
    {personal && <Action label="Kişisel fotoğrafımı kaldır" onPress={() => { setPersonal(undefined); setView('Kolaj'); }} />}
    {view !== 'Kolaj' && <><SelectList label="Konumunu ayarlayacağın parça" options={parts.filter(item => !['Dış giyim', 'Çantalar', 'Aksesuarlar'].includes(item.category)).map(item => `${item.name} · ${item.id}`)} values={adjust ? [`${parts.find(item => item.id === adjust)?.name} · ${adjust}`] : []} onChange={v => setAdjust(v[0].split(' · ').pop())} /><View style={f.row}>{[['Sola', -8, 0, 0], ['Sağa', 8, 0, 0], ['Yukarı', 0, -8, 0], ['Aşağı', 0, 8, 0], ['Küçült', 0, 0, -.1], ['Büyüt', 0, 0, .1]].map(([label, x, y, scale]) => <Action key={label} label={String(label)} disabled={!adjust} onPress={() => move(Number(x), Number(y), Number(scale))} />)}<Action label="Konumları sıfırla" onPress={() => setPoses({})} /></View></>}
    {notice ? <Text accessibilityLiveRegion="polite" style={f.text}>{notice}</Text> : null}
    <Text style={f.title}>Tek parçayı değiştir</Text>
    {parts.map(item => <View key={item.id}><SelectList label={item.name} options={availableItems.filter(candidate => candidate.category === item.category).map(candidate => `${candidate.name} · ${candidate.id}`)} values={[`${item.name} · ${item.id}`]} onChange={v => { const replacement = availableItems.find(candidate => candidate.id === v[0].split(' · ').pop()); if (replacement) setDraft(previous => replacePiece(previous, item.id, replacement, data.items, data.profile)); }} />
      {['Dış giyim', 'Çantalar', 'Aksesuarlar'].includes(item.category) && <Action label="Bu ek parçayı çıkar" onPress={() => setDraft(previous => { const itemIds = previous.itemIds.filter(id => id !== item.id); return { ...previous, itemIds, id: outfitId(itemIds, previous.occasion) }; })} />}
      {item.category === 'Ayakkabılar' && item.secondImage && <><Text style={f.muted}>İkinci açı</Text><GarmentArt item={{ ...item, preferredAngle: 'second' }} size={110} /></>}
    </View>)}
    {!!extras.length && <SelectList label="Katman veya aksesuar ekle" options={extras.map(item => `${item.name} · ${item.id}`)} values={[]} onChange={v => { const extra = extras.find(item => item.id === v[0].split(' · ').pop()); if (extra) setDraft(previous => { const retained = previous.itemIds.filter(id => data.items.find(item => item.id === id)?.category !== extra.category); const itemIds = [...retained, extra.id]; return { ...previous, itemIds, id: outfitId(itemIds, previous.occasion), reason: 'Seçtiğin katman ve aksesuarlarla tamamlandı.' }; }); }} />}
    <Action label="Bu kombini kaydet" onPress={() => onSave(draft)} />
    <Action label="Bugün giydim" onPress={() => { onWear(draft); setNotice('Bugün giydiklerin kaydedildi. Aynı gün tekrar dokunmak sayıyı artırmaz.'); }} />
  </ScrollView></SafeAreaView></Modal>;
}
