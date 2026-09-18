import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppData, Outfit, outfitId } from './domain';
import { available, replacePiece } from './wardrobe-tools';
import { GarmentArt } from './garment-art';
import { OutfitComposition } from './outfit-composition';
import { SelectList } from './profile';
import { Action, f } from './feature-ui';

export function OutfitWorkshop({ outfit, data, onClose, onSave, onWear }: { outfit: Outfit; data: AppData; onClose: () => void; onSave: (outfit: Outfit) => void; onWear: (outfit: Outfit) => void }) {
  const [draft, setDraft] = useState(outfit), [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<string>();
  const parts = draft.itemIds.map(id => data.items.find(item => item.id === id)).filter(item => !!item);
  const availableItems = data.items.filter(item => available(item, data.profile) && item.occasions.includes(draft.occasion));
  const extras = availableItems.filter(item => ['Dış giyim', 'Çantalar', 'Aksesuarlar'].includes(item.category) && !draft.itemIds.includes(item.id));
  return <Modal visible animationType="slide" onRequestClose={onClose}><SafeAreaView style={f.page}><ScrollView contentContainerStyle={f.content}>
    <Text style={f.title}>Kombin atölyesi</Text><Action label="Kapat" onPress={onClose} />
    <Text style={f.muted}>Kendi parçalarını bir arada incele; tek bir parçayı değiştirirken kombinin geri kalanı aynı kalsın.</Text>
    <OutfitComposition parts={parts} onSelect={item => setSelected(item.id)} />
    {selected && parts.some(item => item.id === selected) && <View style={f.panel}><Text style={f.text}>Bu parça için alternatifler</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>{availableItems.filter(item => item.category === parts.find(part => part.id === selected)?.category).map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.name} ile değiştir`} onPress={() => { setDraft(previous => replacePiece(previous, selected, item, data.items, data.profile)); setSelected(item.id); }} style={{ width: 110, alignItems: 'center' }}><GarmentArt item={item} size={100} /><Text style={f.muted}>{item.name}</Text></Pressable>)}</ScrollView></View>}
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
