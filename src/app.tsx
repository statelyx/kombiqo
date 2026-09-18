import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { ProfileEditor, SelectList, BRANDS } from './profile';
import { OutfitComposition } from './outfit-composition';
import { SwipeCard } from './swipe-card';
import { rateOutfit, styleAffinity } from './domain';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { AppData, CATEGORIES, Category, COLORS, DEMO_ITEMS, Fit, Garment, OCCASIONS, Occasion, Outfit, STYLES, Style, createBackup, emptyData, parseBackup, recommend, removeItem, toggleValue } from './domain';
import { GarmentArt } from './garment-art';
import { ErrorBoundary } from './error-boundary';
import { loadData, saveData, takeLoadNotice } from './storage';
import { persistPhoto } from './photos';
import { backupFilesAvailable, pickBackupText, writeBackupFile } from './backup';
import { cutoutAvailable, cutoutHint, removeBackground } from './cutout';
import { C, SERIF } from './theme';
import { PhotoBrush } from './photo-brush';
import { SUBTYPES, markWorn } from './wardrobe-tools';
import { WardrobeHub } from './wardrobe-hub';
import { OutfitWorkshop } from './outfit-workshop';
import { SmartAdd } from './smart-add';

type Tab = 'wardrobe' | 'ideas' | 'saved' | 'profile';
type IconName = React.ComponentProps<typeof Ionicons>['name'];
const NAV: { id: Tab; label: string; icon: IconName }[] = [{ id: 'wardrobe', label: 'Gardırobum', icon: 'grid-outline' }, { id: 'ideas', label: 'Kombinler', icon: 'sparkles-outline' }, { id: 'saved', label: 'Kaydettiklerim', icon: 'bookmark-outline' }, { id: 'profile', label: 'Tarzım', icon: 'options-outline' }];
function Icon({ name, size = 22, color = C.ink }: { name: IconName; size?: number; color?: string }) { return <Ionicons name={name} size={size} color={color} />; }
function Button({ label, onPress, secondary = false, icon, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; icon?: IconName; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 }]}>{icon && <Icon name={icon} color={secondary ? C.ink : C.white} size={18} />}<Text style={[s.buttonText, secondary && { color: C.ink }]}>{label}</Text></Pressable>;
}
function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[s.chip, selected && s.chipSelected]}><Text style={[s.chipText, selected && s.chipTextSelected]}>{label}</Text></Pressable>; }
function Empty({ title, body, action, onPress, icon = 'shirt-outline' }: { title: string; body: string; action?: string; onPress?: () => void; icon?: IconName }) { return <View style={s.empty}><View style={s.emptyIcon}><Icon name={icon} size={32} color={C.green} /></View><Text style={s.sectionTitle}>{title}</Text><Text style={[s.body, { textAlign: 'center' }]}>{body}</Text>{action && onPress && <Button label={action} onPress={onPress} />}</View>; }
const GarmentCard = React.memo(function GarmentCard({ item, onSelect }: { item: Garment; onSelect: (item: Garment) => void }) {
  const motion = useRef(new Animated.Value(0)).current;
  const animate = useCallback(() => { Animated.sequence([Animated.timing(motion, { toValue: 1, duration: 130, useNativeDriver: true }), Animated.spring(motion, { toValue: 0, friction: 3, useNativeDriver: true })]).start(); }, [motion]);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${item.name}, detayları aç`} onPressIn={animate} onPress={() => onSelect(item)} style={s.garmentCard}><Animated.View style={{ transform: [{ rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-7deg'] }) }] }}><GarmentArt item={item} size={142} hanger /></Animated.View><Text style={s.itemName} numberOfLines={1}>{item.name}</Text><Text style={s.meta}>{item.fit} kesim · {item.colorName}</Text></Pressable>;
});

export default function App() { return <SafeAreaProvider><ErrorBoundary><Main /></ErrorBoundary></SafeAreaProvider>; }
function Main() {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<Tab>('wardrobe');
  const [filter, setFilter] = useState<Category | 'Tümü'>('Tümü');
  const [query, setQuery] = useState('');
  const [occasion, setOccasion] = useState<Occasion>('Günlük');
  const [editor, setEditor] = useState<Garment | 'new' | null>(null);
  const [notice, setNotice] = useState('');
  const [saveError, setSaveError] = useState(false);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [loadWarning, setLoadWarning] = useState('');
  const [backupPath, setBackupPath] = useState('');
  const [confirm, setConfirm] = useState<{ title: string; body: string; action: () => void } | null>(null);
  const [editProfile, setEditProfile] = useState(false);
  const [undo, setUndo] = useState<Pick<AppData, 'saved' | 'rejected' | 'feedback'> | null>(null);
  const [workshop, setWorkshop] = useState<Outfit | null>(null);
  const [pinned, setPinned] = useState<string>();
  const [offset, setOffset] = useState(0);
  const scroll = useRef<ScrollView>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; loadData().then(value => { if (!mounted.current) return; setData(value); if (value.profile?.occasions?.[0]) setOccasion(value.profile.occasions[0]); setReady(true); const message = takeLoadNotice(); if (message) setLoadWarning(message); }).catch(() => { if (mounted.current) setLoadError(true); }); return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    if (ready) saveData(data).then(() => { if (active) setSaveError(false); }).catch(() => { if (active) setSaveError(true); });
    return () => { active = false; };
  }, [data, ready, saveAttempt]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 6000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [tab]);
  const ideas = useMemo(() => recommend(data.items, data.preferences, occasion, data.saved, [...data.rejected, ...data.saved.map(entry => entry.id)], data.feedback, data.profile?.brands, { pinned, profile: data.profile }), [data, occasion, pinned]);
  const visibleIdeas = ideas.length ? [...ideas.slice(offset % ideas.length), ...ideas.slice(0, offset % ideas.length)].slice(0, 3) : [];
  // A single pass over the wardrobe, grouped by category, replaces per-rail rescans.
  const rails = useMemo(() => {
    const needle = query.toLocaleLowerCase('tr');
    const groups = new Map<Category, Garment[]>();
    for (const item of data.items) {
      if (filter !== 'Tümü' && item.category !== filter) continue;
      if (needle && !`${item.name} ${item.colorName}`.toLocaleLowerCase('tr').includes(needle)) continue;
      groups.set(item.category, [...(groups.get(item.category) ?? []), item]);
    }
    return { groups, total: [...groups.values()].reduce((sum, list) => sum + list.length, 0) };
  }, [data.items, filter, query]);
  const demo = data.items.some(item => item.demo);
  const openEditor = useCallback((item: Garment) => setEditor(item), []);
  function changeTab(next: Tab) { setTab(next); setOffset(0); setUndo(null); }
  function vote(outfit: Outfit, liked: boolean) {
    setUndo({ saved: data.saved, rejected: data.rejected, feedback: data.feedback });
    setData(previous => rateOutfit(previous, outfit, liked));
    setOffset(0);
  }
  function saveOutfit(outfit: Outfit) {
    const exists = data.saved.some(entry => entry.id === outfit.id);
    setData(previous => ({ ...previous, saved: exists ? previous.saved.filter(entry => entry.id !== outfit.id) : [outfit, ...previous.saved], feedback: (previous.feedback ?? []).filter(entry => entry.id !== outfit.id) }));
    setNotice(exists ? 'Kombin kaydedilenlerden çıkarıldı.' : 'Kombin kaydedildi. Tercihlerin sonraki önerilere yansıyacak.');
  }
  async function copyBackup() {
    try { await Clipboard.setStringAsync(createBackup(data)); setNotice('Yedek panoya kopyalandı. Güvenli bir yere kaydet.'); }
    catch { setNotice('Yedek kopyalanamadı. Tekrar dene.'); }
  }
  async function exportBackup() {
    try {
      const uri = await writeBackupFile(createBackup(data), new Date().toISOString().slice(0, 10));
      setBackupPath(uri);
      setNotice('Yedek dosyası oluşturuldu.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Yedek oluşturulamadı.'); }
  }
  function applyRestore(text: string | null) {
    if (!text?.trim()) { setNotice('Yedek metni bulunamadı. Önce bir yedek oluşturup tekrar dene.'); return; }
    let restored: AppData;
    try { restored = parseBackup(text); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Yedek okunamadı.'); return; }
    setConfirm({ title: 'Yedekten geri yüklensin mi?', body: `${restored.items.length} parça ve ${restored.saved.length} kayıtlı kombin yüklenecek. Şu anki gardırobun bu yedekle değiştirilecek.`, action: () => { setData(restored); setUndo(null); setOffset(0); setNotice('Yedekten geri yüklendi.'); } });
  }
  async function restoreFromClipboard() {
    try { applyRestore(await Clipboard.getStringAsync()); } catch { setNotice('Panodaki metne erişilemedi.'); }
  }
  async function restoreFromFile() {
    try { applyRestore(await pickBackupText()); } catch (error) { setNotice(error instanceof Error ? error.message : 'Yedek dosyası açılamadı.'); }
  }
  if (loadError) return <SafeAreaView style={s.safe}><Empty title="Gardırobunu açamadık" body="Kayıtlı verilerin üzerine yazmadık. Uygulamayı kapatıp tekrar açmayı dene." icon="cloud-offline-outline" /></SafeAreaView>;
  if (!ready) return <SafeAreaView style={[s.safe, { justifyContent: 'center' }]}><ActivityIndicator color={C.coral} /><Text style={[s.body, { textAlign: 'center', marginTop: 15 }]}>Gardırobun hazırlanıyor…</Text></SafeAreaView>;
  return <SafeAreaView style={s.safe} edges={['top', 'left', 'right', 'bottom']}><StatusBar style="dark" /><View style={s.app}>
    <View style={s.header}><Pressable onPress={() => changeTab('wardrobe')} accessibilityRole="button" accessibilityLabel="Kombiqo, gardıroba dön"><Text style={s.brand}>kombiqo<Text style={{ color: C.coral }}>.</Text></Text></Pressable><View style={s.headerRight}><View style={s.localBadge}><View style={s.dot} /><Text style={s.localText}>SANA ÖZEL</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Tarz tercihlerini aç" onPress={() => changeTab('profile')} style={s.avatar}><Text style={s.avatarText}>k.</Text></Pressable></View></View>
    {loadWarning ? <View style={s.saveError}><Text accessibilityLiveRegion="assertive" style={s.error}>{loadWarning}</Text><Button secondary label="Anladım" onPress={() => setLoadWarning('')} /></View> : null}
    {saveError && <View style={s.saveError}><Text accessibilityLiveRegion="assertive" style={s.error}>Değişiklikler cihazına kaydedilemedi. Boş alanı kontrol et ve uygulamayı kapatmadan yeniden dene.</Text><Button secondary label="Kaydetmeyi yeniden dene" onPress={() => setSaveAttempt(value => value + 1)} /></View>}
    <ScrollView ref={scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {tab === 'wardrobe' && <>
        <View style={s.headingRow}><View style={{ flex: 1 }}><Text style={s.eyebrow}>AZ PARÇA. DAHA ÇOK OLASILIK.</Text><Text style={s.title}>Senin gardırobun.</Text><Text style={s.body}>{data.items.length ? `${data.items.length} parça, keşfedilecek yeni eşleşmeler.` : 'İyi kombinler, elindekilerle başlar.'}</Text></View><Pressable onPress={() => setEditor('new')} accessibilityRole="button" accessibilityLabel="Yeni kıyafet ekle" style={s.addButton}><Icon name="add" color={C.white} size={26} /></Pressable></View>
        {!data.onboarded && <View style={s.welcome}><View style={s.row}><Icon name="sunny-outline" color={C.coral} /><Text style={s.cardLabel}>TANIŞALIM MI?</Text></View><Text style={s.welcomeTitle}>{'Yeni kıyafet değil,\nyeni bir bakış.'}</Text><Text style={s.body}>Dolabındaki parçaları bir araya getir. Tarzını keşfet, sana uyan kombinleri sakla.</Text><View style={s.welcomeArt}>{[DEMO_ITEMS[0], DEMO_ITEMS[3], DEMO_ITEMS[6]].map(item => <GarmentArt key={item.id} item={item} size={92} />)}</View><Button label="İlk kıyafetimi ekle" icon="add" onPress={() => setEditor('new')} /><Button secondary label="Örnek gardıropla keşfet" onPress={() => setData(previous => ({ ...previous, items: [...DEMO_ITEMS], onboarded: true }))} /><Text style={s.fine}>Fotoğrafların ve tercihlerin bu cihazda saklanır.</Text></View>}
        {data.onboarded && <>
          <Pressable accessibilityRole="button" onPress={() => changeTab('ideas')} style={s.inspiration}><View style={{ flex: 1 }}><Text style={[s.eyebrow, { color: C.coral }]}>BUGÜN NE GİYSEM?</Text><Text style={s.inspirationTitle}>Dolabında yeni bir fikir var.</Text><Text style={s.meta}>Kendi parçalarınla kombinlerini keşfet</Text></View><View style={s.roundArrow}><Icon name="arrow-forward" color={C.coral} /></View></Pressable>
          <View style={s.search}><Icon name="search-outline" size={18} color={C.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Gardırobunda ara" placeholderTextColor={C.muted} style={s.searchInput} accessibilityLabel="Gardırobunda ara" />{query.length > 0 && <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Aramayı temizle"><Icon name="close-circle" size={18} color={C.muted} /></Pressable>}</View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{(['Tümü', ...CATEGORIES] as const).map(category => <Chip key={category} label={category} selected={filter === category} onPress={() => setFilter(category)} />)}</ScrollView>
          {demo && <View style={s.demoBanner}><Icon name="information-circle-outline" size={16} color={C.green} /><Text style={s.demoText}>Örnek parçalar gösteriliyor. Kendi kıyafetlerini ekleyebilirsin.</Text></View>}
          {!rails.total && <Empty title={query ? 'Bu parça görünmüyor' : 'Burada henüz bir parça yok'} body={query ? 'Başka bir isim veya renk ile aramayı dene.' : 'Fotoğrafını ekle, gardırobunda yerini alsın.'} action="Kıyafet ekle" onPress={() => setEditor('new')} />}
          {CATEGORIES.map(category => { const rail = rails.groups.get(category); return rail?.length ? <View key={category} style={s.railSection}><View style={s.sectionRow}><Text style={s.sectionTitle}>{category}</Text><Text style={s.count}>{rail.length} parça</Text></View><View style={s.railLine} /><FlatList horizontal data={rail} keyExtractor={item => item.id} renderItem={({ item }) => <GarmentCard item={item} onSelect={openEditor} />} showsHorizontalScrollIndicator={false} contentContainerStyle={s.rail} initialNumToRender={6} /></View> : null; })}
          <View style={s.footerNote}><Icon name="leaf-outline" color={C.green} size={17} /><Text style={s.meta}>En iyi başlangıç, zaten sahip oldukların.</Text></View>
        </>}
      </>}
      {tab === 'ideas' && <>
        <SelectList label="Bu parçayla kombin yap" options={['Serbest', ...data.items.filter(item => !item.laundry).map(item => `${item.name} · ${item.id}`)]} values={[pinned ? `${data.items.find(item => item.id === pinned)?.name} · ${pinned}` : 'Serbest']} onChange={v => { setPinned(v[0] === 'Serbest' ? undefined : v[0].split(' · ').pop()); setOffset(0); }} />
        <Text style={s.eyebrow}>BİRAZ İLHAM, TAMAMEN SEN.</Text><Text style={s.title}>Bugünün olasılıkları.</Text><Text style={s.body}>Sağa kaydır, kaydet. Sola kaydır, geç. Beğenilerin sonraki eşleşmeleri şekillendirsin.</Text>
        <View style={[s.chips, { marginTop: 24 }]}>{OCCASIONS.map(value => <Chip key={value} label={value} selected={occasion === value} onPress={() => { setOccasion(value); setOffset(0); }} />)}</View>
        <View style={s.sectionRow}><Text style={s.meta}>{ideas.length} eşleşme · {data.preferences.styles.join(' / ')}</Text><Pressable accessibilityRole="button" accessibilityLabel="Farklı kombinler göster" onPress={() => setOffset(value => value + 1)}><Icon name="shuffle-outline" color={C.coral} /></Pressable></View>
        {!visibleIdeas.length && <Empty title={data.rejected.length ? 'Yeni bir başlangıç yapalım' : data.saved.length ? 'Bu tur tamamlandı' : 'Birkaç parça daha lazım'} body={`${occasion} için işaretlenmiş bir üst, bir alt (veya elbise) ve ayakkabı ekle. Kıyafetlerin kullanım alanlarını da düzenleyebilirsin.`} action={data.rejected.length ? 'Gizlenen önerileri geri getir' : 'Gardırobuma git'} onPress={() => data.rejected.length ? setData(previous => ({ ...previous, rejected: [] })) : changeTab('wardrobe')} icon="sparkles-outline" />}
        {visibleIdeas[0] && <SwipeCard key={visibleIdeas[0].id} onRate={liked => vote(visibleIdeas[0], liked)}><OutfitCard outfit={visibleIdeas[0]} items={data.items} index={0} saved={false} onOpen={() => setWorkshop(visibleIdeas[0])} onSave={() => vote(visibleIdeas[0], true)} /></SwipeCard>}
        {undo && <Button secondary label="Son kaydırmayı geri al" icon="arrow-undo-outline" onPress={() => { setData(previous => ({ ...previous, ...undo })); setUndo(null); setOffset(0); }} />}
        {data.feedback?.length && data.feedback[data.feedback.length - 1].liked === false ? <SelectList label="Son öneriyi neden geçtin? · isteğe bağlı" options={['Tarz', 'Renk', 'Kesim', 'Fazla açık', 'Fazla kapalı', 'Fazla resmi']} values={data.feedback[data.feedback.length - 1].reason ? [data.feedback[data.feedback.length - 1].reason!] : []} onChange={values => setData(previous => ({ ...previous, feedback: previous.feedback?.map((vote, index, all) => index === all.length - 1 ? { ...vote, reason: values[0] } : vote) }))} /> : null}
        <Text style={[s.fine, { marginTop: 22 }]}>Kombinler renk, kesim ve tercihlerine göre cihazında hazırlanır.</Text>
      </>}
      {tab === 'saved' && <>
        <Text style={s.eyebrow}>TEKRAR GİYMEYE DEĞER.</Text><Text style={s.title}>İyi fikirlerin burada.</Text><Text style={s.body}>{data.saved.length} kayıtlı kombin · Bir sonraki güne hazır.</Text>
        {!data.saved.length ? <Empty title="İlk favorin seni bekliyor" body="Beğendiğin kombindeki yer imi simgesine dokun. Sonra burada kolayca bul." action="Kombinleri keşfet" onPress={() => changeTab('ideas')} icon="bookmark-outline" /> : data.saved.map((outfit, index) => <OutfitCard key={outfit.id} outfit={outfit} items={data.items} index={index} saved onOpen={() => setWorkshop(outfit)} onSave={() => saveOutfit(outfit)} />)}
      </>}
      {tab === 'profile' && <>
        <WardrobeHub data={data} onChange={setData} onSelect={item => { setPinned(item.id); changeTab('ideas'); }} />
        <Text style={s.eyebrow}>BİR KALIBA SIĞMAK ZORUNDA DEĞİLSİN.</Text><Text style={s.title}>Tarzın, senin kuralların.</Text><Text style={s.body}>Bugün sade, yarın biraz daha cesur. Birden fazla tarz seçebilirsin.</Text>
        <View style={s.panel}><Text style={s.sectionTitle}>{data.profile?.name ? `Merhaba ${data.profile.name}` : 'Kişisel profilin'}</Text><Text style={s.body}>{data.profile?.brands.length ? data.profile.brands.join(' · ') : 'Markalarını seçerek başlayabilirsin.'}</Text><Button secondary label="Profilimi düzenle" onPress={() => setEditProfile(true)} /><Text style={s.meta}>{(data.feedback ?? []).length} değerlendirme · Beğenilerinde öne çıkan: {Object.entries(styleAffinity(data.feedback)).filter(([, weight]) => weight > 0).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([style]) => style).join(' / ') || 'Henüz keşfediyoruz'}</Text>{!!data.feedback?.length && <Button secondary label="Öğrenilen tercihleri sıfırla" onPress={() => { setData(previous => ({ ...previous, feedback: [] })); setUndo(null); }} />}</View>
        <View style={s.panel}><Text style={s.sectionTitle}>Sana yakın olanlar</Text><Text style={s.meta}>En az bir tarz seç.</Text><View style={s.wrap}>{STYLES.map(value => <Chip key={value} label={value} selected={data.preferences.styles.includes(value)} onPress={() => { const styles = toggleValue(data.preferences.styles, value); if (styles.length) setData(previous => ({ ...previous, preferences: { ...previous.preferences, styles } })); }} />)}</View></View>
        <View style={s.panel}><Text style={s.sectionTitle}>Nasıl bir kesim?</Text><Text style={s.meta}>Rahat hissettiğin seçenekler öne çıksın.</Text><View style={s.wrap}>{(['Dar', 'Düz', 'Bol'] as Fit[]).map(value => <Chip key={value} label={value} selected={data.preferences.fits.includes(value)} onPress={() => { const fits = toggleValue(data.preferences.fits, value); if (fits.length) setData(previous => ({ ...previous, preferences: { ...previous.preferences, fits } })); }} />)}</View></View>
        <View style={[s.panel, s.row]}><View style={{ flex: 1 }}><Text style={s.sectionTitle}>Biraz şaşırt beni</Text><Text style={s.body}>Tarzına yakın önerilerin yanına farklı eşleşmeler de ekle.</Text></View><Switch accessibilityLabel="Yeni tarzlar keşfet" value={data.preferences.exploration} onValueChange={exploration => setData(previous => ({ ...previous, preferences: { ...previous.preferences, exploration } }))} trackColor={{ true: C.green, false: C.line }} thumbColor={C.white} /></View>
        <View style={s.panel}><View style={s.row}><Icon name="lock-closed-outline" color={C.green} /><Text style={s.sectionTitle}>Gardırobun sende kalsın.</Text></View><Text style={s.body}>Fotoğrafların, yalnızca çevrimiçi incelemeye izin verirsen analiz servisine gönderilir. Kayıtlar bu cihazdadır; uygulamayı silersen kaybolabilir.</Text><Text style={s.fine}>Kombiqo 0.3 · Kişisel gardırobun</Text></View>
        <View style={s.panel}><View style={s.row}><Icon name="shield-checkmark-outline" color={C.green} /><Text style={s.sectionTitle}>Yedekleme</Text></View><Text style={s.body}>Kayıtların yalnızca bu cihazda. Telefon değiştirmeden veya uygulamayı silmeden önce yedek alman iyi olur.</Text><Button secondary label="Yedeği panoya kopyala" icon="copy-outline" onPress={copyBackup} /><Button secondary label="Panodaki yedeği geri yükle" icon="clipboard-outline" onPress={restoreFromClipboard} />{backupFilesAvailable ? <><Button secondary label="Yedek dosyası oluştur" icon="download-outline" onPress={exportBackup} /><Button secondary label="Yedek dosyasından geri yükle" icon="folder-open-outline" onPress={restoreFromFile} /></> : null}{backupPath ? <Text style={s.fine}>Yedek dosyası hazır: {backupPath}</Text> : null}<Text style={s.fine}>Yedek, gardırobunun tamamını içeren bir metindir. Geri yükleme mevcut gardırobunun yerini alır; önce yedek almanı öneririz.</Text></View>
        {data.rejected.length > 0 && <Button secondary label={`${data.rejected.length} gizlenen öneriyi geri getir`} onPress={() => { setData(previous => ({ ...previous, rejected: [] })); setNotice('Gizlenen öneriler geri getirildi.'); }} />}
        {demo && <Button secondary label="Örnek parçaları kaldır" onPress={() => setConfirm({ title: 'Örnek gardırop kaldırılsın mı?', body: 'Kendi eklediğin parçalar kalacak. Örnek parçaları içeren kayıtlı kombinler de kaldırılacak.', action: () => setData(previous => ({ ...previous, items: previous.items.filter(item => !item.demo), saved: previous.saved.filter(outfit => outfit.itemIds.every(id => !previous.items.find(item => item.id === id)?.demo)), rejected: [] })) })} />}
      </>}
    </ScrollView>
    {notice ? <Pressable onPress={() => setNotice('')} accessibilityRole="button" accessibilityLabel="Bildirimi kapat" style={s.toast}><Text accessibilityLiveRegion="polite" style={s.toastText}>{notice}</Text><Icon name="close" color={C.white} size={18} /></Pressable> : null}
    <View style={s.nav}>{NAV.map(entry => <Pressable key={entry.id} onPress={() => changeTab(entry.id)} accessibilityRole="tab" accessibilityState={{ selected: tab === entry.id }} style={s.navItem}><View style={[s.navIcon, tab === entry.id && s.navIconActive]}><Icon name={entry.icon} color={tab === entry.id ? C.coral : C.muted} size={22} /></View><Text style={[s.navText, tab === entry.id && { color: C.coral }]}>{entry.label}</Text></Pressable>)}</View>
  </View>
  {(!data.profile || editProfile) && <ProfileEditor profile={data.profile} preferences={data.preferences} onSave={(profile, styles) => { setData(previous => ({ ...previous, profile, preferences: { ...previous.preferences, styles } })); setEditProfile(false); }} />}
  {workshop && <OutfitWorkshop outfit={workshop} data={data} onClose={() => setWorkshop(null)} onSave={outfit => { setData(previous => ({ ...previous, saved: [outfit, ...previous.saved.filter(entry => entry.id !== outfit.id)], rejected: previous.rejected.filter(id => id !== outfit.id) })); setNotice('Kombin kaydedildi.'); setWorkshop(null); }} onWear={outfit => { setData(previous => markWorn(previous, outfit)); setNotice('Bugün giydiklerin kaydedildi.'); }} />}
  {editor && <GarmentEditor item={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} onSave={item => { setData(previous => ({ ...previous, onboarded: true, items: previous.items.some(entry => entry.id === item.id) ? previous.items.map(entry => entry.id === item.id ? item : entry) : [...previous.items, item], saved: previous.saved.filter(outfit => !outfit.itemIds.includes(item.id)), trips: previous.trips?.map(trip => ({ ...trip, outfits: trip.outfits.filter(outfit => !outfit.itemIds.includes(item.id)) })), rejected: [] })); setEditor(null); setNotice('Parçan gardıroba eklendi.'); }} onDelete={editor === 'new' ? undefined : () => { const item = editor; setEditor(null); setConfirm({ title: 'Bu parça kaldırılsın mı?', body: 'Bu parçayı içeren kayıtlı kombinler de kaldırılacak.', action: () => setData(previous => removeItem(previous, item.id)) }); }} />}
  <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}><View style={s.backdrop}><View style={s.confirm}><Text style={s.sectionTitle}>{confirm?.title}</Text><Text style={s.body}>{confirm?.body}</Text><Button label="Kaldır" onPress={() => { confirm?.action(); setConfirm(null); }} /><Button secondary label="Vazgeç" onPress={() => setConfirm(null)} /></View></View></Modal>
  </SafeAreaView>;
}

function OutfitCard({ outfit, items, index, saved, onSave, onReject, onOpen }: { outfit: Outfit; items: Garment[]; index: number; saved: boolean; onSave: () => void; onReject?: () => void; onOpen?: () => void }) {
  const parts = outfit.itemIds.map(id => items.find(item => item.id === id)).filter((item): item is Garment => !!item);
  return <View style={s.outfitCard}><View style={s.sectionRow}><Text style={s.eyebrow}>EŞLEŞME {String(index + 1).padStart(2, '0')} · {outfit.occasion.toLocaleUpperCase('tr')}</Text><Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Kombini kayıtlardan çıkar' : 'Kombini kaydet'} onPress={onSave} style={s.iconButton}><Icon name={saved ? 'bookmark' : 'bookmark-outline'} color={C.coral} /></Pressable></View><OutfitComposition parts={parts} />{onOpen && <Button secondary label="Düzenle · mankende gör" onPress={onOpen} />}<View style={s.palette}>{parts.map(item => <View key={item.id} style={[s.paletteDot, { backgroundColor: item.color }]} />)}</View><Text style={s.outfitTitle}>{outfit.title}</Text><Text style={s.body}>{outfit.reason}</Text><Text style={s.outfitParts}>{parts.map(item => item.name).join(' + ')}</Text>{onReject && <Pressable accessibilityRole="button" onPress={onReject} style={s.reject}><Text style={s.meta}>Bu eşleşme bana göre değil</Text><Icon name="close-outline" size={17} color={C.muted} /></Pressable>}</View>;
}

function GarmentEditor({ item, onClose, onSave, onDelete }: { item?: Garment; onClose: () => void; onSave: (item: Garment) => void; onDelete?: () => void }) {
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<Category>(item?.category ?? 'Üstler');
  const [color, setColor] = useState(item ? { name: item.colorName, hex: item.color } : COLORS[0]);
  const [brand, setBrand] = useState(item?.brand ?? '');
  const [fit, setFit] = useState<Fit>(item?.fit ?? 'Düz');
  const [styles, setStyles] = useState<Style[]>(item?.styles ?? ['Minimal']);
  const [occasions, setOccasions] = useState<Occasion[]>(item?.occasions ?? ['Günlük']);
  const [subtype, setSubtype] = useState(item?.subtype ?? '');
  const [collection, setCollection] = useState(item?.collection ?? 'Unisex');
  const [coverage, setCoverage] = useState(item?.coverage ?? 'Belirtilmedi');
  const [backdrop, setBackdrop] = useState(item?.backdrop ?? 'Krem');
  const [laundry, setLaundry] = useState(item?.laundry ?? false);
  const [brush, setBrush] = useState(item?.brush ?? []);
  const [brushOpen, setBrushOpen] = useState(false);
  const [photoType, setPhotoType] = useState('Düz zeminde');
  const [secondOriginal, setSecondOriginal] = useState(item?.secondOriginal);
  const [secondCutout, setSecondCutout] = useState(item?.secondCutout ?? false);
  const [secondImage, setSecondImage] = useState(item?.secondImage);
  const [preferredAngle, setPreferredAngle] = useState<'main' | 'second'>(item?.preferredAngle ?? 'main');
  const [photo, setPhoto] = useState(item?.image);
  const [originalPhoto, setOriginalPhoto] = useState(item?.originalImage ?? item?.image);
  const [cleanedPhoto, setCleanedPhoto] = useState(item?.cutout ? item.image : undefined);
  const [isCutout, setIsCutout] = useState(item?.cutout ?? false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function prepareProductPhoto(next: string) {
    setPhoto(next); setOriginalPhoto(next); setCleanedPhoto(undefined); setIsCutout(false); setBrush([]); setPreferredAngle('main');
    if (!cutoutAvailable || photoType === 'Kişi üzerinde') return;
    try {
      const cleaned = await removeBackground(next);
      setCleanedPhoto(cleaned);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ürün ayrılamadı. Orijinal fotoğrafın korundu.');
    }
  }
  async function pickPhoto(camera = false, second = false) {
    setError(''); setBusy(true);
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) { setError('Kamera izni verilmedi. Galeriden fotoğraf seçebilir veya Ayarlar üzerinden izin verebilirsin.'); return; }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: false, quality: 0.9 };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled) {
        const resized = await ImageManipulator.manipulateAsync(result.assets[0].uri, [{ resize: { width: Math.min(result.assets[0].width, 1280) } }], { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG, base64: true });
        if (!resized.base64) throw new Error('Fotoğraf okunamadı.');
        const next = `data:image/jpeg;base64,${resized.base64}`;
        if (second) { setSecondImage(next); setSecondOriginal(next); setSecondCutout(false); } else await prepareProductPhoto(next);
      }
    } catch { setError('Fotoğraf açılamadı. Fotoğraf erişimini kontrol edip tekrar dene.'); }
    finally { setBusy(false); }
  }
  async function pastePhoto() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const image = await Clipboard.getImageAsync({ format: 'png' });
      if (!image) { setError('Panoda görsel bulunamadı. Ürün görselini kopyala veya ekran görüntüsünü galeriden seç.'); return; }
      const resized = await ImageManipulator.manipulateAsync(image.data, [{ resize: { width: Math.min(image.size.width, 1280) } }], { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG, base64: true });
      if (!resized.base64) throw new Error('Görsel okunamadı.');
      const next = `data:image/jpeg;base64,${resized.base64}`;
      await prepareProductPhoto(next);
    } catch { setError('Panodaki görsele erişilemedi. Ekran görüntüsünü galeriden ekleyebilirsin.'); }
    finally { setBusy(false); }
  }
  async function cleanPhoto() {
    if (!originalPhoto || busy) return;
    setBusy(true); setError('');
    try {
      const cleaned = await removeBackground(originalPhoto);
      setCleanedPhoto(cleaned);
    } catch (error) { setError(error instanceof Error ? error.message : 'Temizleme tamamlanamadı. Orijinal fotoğrafın korundu.'); }
    finally { setBusy(false); }
  }
  const preview: Garment = { id: 'preview', brand: brand || undefined, name: name || 'Yeni parça', category, color: color.hex, colorName: color.name, fit, styles, occasions, image: photo, cutout: isCutout, subtype: SUBTYPES[category].includes(subtype) ? subtype : undefined, collection, coverage, backdrop, brush, secondImage, secondOriginal, secondCutout, preferredAngle, laundry, lastWorn: item?.lastWorn, wearCount: item?.wearCount };
  function submit() {
    if (!name.trim()) { setError('Parçana bir isim ver.'); return; }
    if (!styles.length || !occasions.length) { setError('En az bir tarz ve kullanım alanı seç.'); return; }
    try {
      const image = persistPhoto(photo);
      const originalImage = isCutout ? persistPhoto(originalPhoto) : undefined;
      onSave({ ...preview, image, originalImage, secondImage: persistPhoto(secondImage), secondOriginal: persistPhoto(secondOriginal), id: item?.id ?? `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: name.trim(), demo: item?.demo });
    } catch { setError('Fotoğraf kaydedilemedi. Cihazındaki boş alanı kontrol edip tekrar dene.'); }
  }
  return <Modal visible animationType="slide" onRequestClose={onClose}><SafeAreaView style={s.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={[s.app, { flex: 1 }]}><View style={s.editorHeader}><Text style={s.sectionTitle}>{item ? 'Parçanı düzenle' : 'Gardırobuna ekle'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Kıyafet düzenleyiciyi kapat" onPress={onClose} style={s.iconButton}><Icon name="close" /></Pressable></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    <SelectList label="Fotoğraf türü" options={['Düz zeminde', 'Askıda', 'Mağaza görseli', 'Kişi üzerinde']} values={[photoType]} onChange={v => setPhotoType(v[0])} />
    {photoType === 'Kişi üzerinde' && <Text style={s.fine}>Kişi üzerindeki fotoğraftan düz ve ütülü ürün üretilmez. Orijinali kullanabilir veya ürün fotoğrafı seçebilirsin.</Text>}
    <SmartAdd photo={photo} disabled={busy} onApply={fields => {
      if (fields.category) setCategory(fields.category);
      const detectedColor = COLORS.find(c => c.name === fields.colorName);
      if (detectedColor) setColor(detectedColor);
      if (fields.brand) setBrand(fields.brand);
      if (fields.fit) setFit(fields.fit);
      if (fields.styles?.length) setStyles(fields.styles);
      if (fields.occasions?.length) setOccasions(fields.occasions);
      if (!name.trim() && fields.category) setName(`${fields.colorName ?? ''} ${fields.category === 'Üstler' ? 'üst' : fields.category === 'Altlar' ? 'alt parça' : fields.category === 'Elbiseler' ? 'elbise' : fields.category === 'Ayakkabılar' ? 'ayakkabı' : 'dış giyim'}`.trim());
    }} />
    <View style={s.photoPreview}><GarmentArt item={preview} size={180} hanger={isCutout} /><Text style={s.meta}>{photo ? 'Fotoğrafın hazır' : 'Fotoğraf ekleyebilir veya çizimle başlayabilirsin'}</Text></View><Button secondary label={busy ? 'Fotoğraf hazırlanıyor…' : photo ? 'Fotoğrafı değiştir' : 'Galeriden fotoğraf seç'} icon="image-outline" onPress={() => pickPhoto()} disabled={busy} />{Platform.OS !== 'web' && <Button secondary label="Kamerayla çek" icon="camera-outline" onPress={() => pickPhoto(true)} disabled={busy} />}
    <Button secondary label="Görsel yapıştır" icon="clipboard-outline" onPress={pastePhoto} disabled={busy} /><Text style={s.fine}>Zara veya başka bir mağazadan aldığın ürünün ekran görüntüsünü galeriden seçebilir, kopyaladığın görseli yapıştırabilirsin. Bağlantı yerine görsel kopyala; sayfa yazılarını kırparak daha temiz sonuç al.</Text>
    <View style={s.panel}><Text style={s.sectionTitle}>Fotoğraf stüdyosu</Text><Text style={s.body}>Ürünü düz bir zeminde, tek başına ve tamamı görünecek şekilde çek. Desteklenen iPhone’da temizleme önerisi hazırlanır; uygulamadan önce önizlemeyi kontrol et; renk, logo ve kumaş detayları korunur. Kırışıklıklar veya görünmeyen bölümler yeniden çizilmez.</Text>
    {cutoutAvailable ? <Button label={busy ? 'Fotoğraf işleniyor…' : 'Arka planı temizle'} icon="sparkles-outline" onPress={cleanPhoto} disabled={busy || !originalPhoto} /> : <Text style={s.fine}>{cutoutHint}</Text>}
    {cleanedPhoto && <View style={s.wrap}><Chip label="Orijinal" selected={!isCutout} onPress={() => { if (!busy) { setPhoto(originalPhoto); setIsCutout(false); setBrush([]); } }} /><Chip label="Temizlenmiş" selected={isCutout} onPress={() => { if (!busy) { setPhoto(cleanedPhoto); setIsCutout(true); setBrush([]); } }} /></View>}
    <SelectList label="Stüdyo fonu" options={['Krem', 'Taş', 'Şeffaf']} values={[backdrop]} onChange={v => setBackdrop(v[0])} />
    {photo && <Button secondary label="Fırçayla kenarları düzelt" disabled={busy} onPress={() => setBrushOpen(true)} />}
    {brushOpen && photo && <PhotoBrush image={photo} initial={brush} onClose={() => setBrushOpen(false)} onSave={next => { setBrush(next); setBrushOpen(false); }} />}
    <Text style={s.fine}>Fotoğraf cihazında işlenir. Sonuç uygun değilse orijinali kaydedebilirsin.</Text></View>
    {photo && <Pressable disabled={busy} onPress={() => { setPhoto(undefined); setOriginalPhoto(undefined); setCleanedPhoto(undefined); setIsCutout(false); setBrush([]); }} accessibilityRole="button" style={s.reject}><Text style={s.meta}>Fotoğrafı kaldır</Text></Pressable>}
    <Text style={s.fieldLabel}>PARÇANIN ADI</Text><TextInput accessibilityLabel="Parçanın adı" value={name} onChangeText={setName} maxLength={60} placeholder="Örn. Mavi bol kesim gömlek" placeholderTextColor={C.muted} style={s.input} />
    <SelectList label="Marka · isteğe bağlı" options={BRANDS} values={brand ? [brand] : []} custom onChange={values => setBrand(values[0] ?? '')} />{!brand && <Text style={s.fine}>Marka: Bilinmiyor · İstersen seçebilir veya boş bırakabilirsin.</Text>}{!!brand && <Pressable accessibilityRole="button" onPress={() => setBrand('')} style={s.reject}><Text style={s.meta}>Markayı temizle</Text></Pressable>}
    <Text style={s.fieldLabel}>KATEGORİ</Text><View style={s.wrap}>{CATEGORIES.map(value => <Chip key={value} label={value} selected={category === value} onPress={() => setCategory(value)} />)}</View>
    <SelectList label="Ürün türü" options={SUBTYPES[category]} values={SUBTYPES[category].includes(subtype) ? [subtype] : []} onChange={v => setSubtype(v[0])} />
    <SelectList label="Koleksiyon" options={['Kadın', 'Erkek', 'Unisex']} values={[collection]} onChange={v => setCollection(v[0])} />
    <SelectList label="Örtücülük" options={['Belirtilmedi', 'Örtücü', 'Açık']} values={[coverage]} onChange={v => setCoverage(v[0])} />
    <View style={s.row}><Text style={s.body}>Çamaşırda · önerilerde kullanma</Text><Switch accessibilityLabel="Çamaşırda" value={laundry} onValueChange={setLaundry} /></View>
    {category === 'Ayakkabılar' && <View style={s.panel}><Text style={s.sectionTitle}>İki açı, tek ayakkabı</Text><Text style={s.body}>Ana fotoğrafı dış yandan, ikinciyi önden çapraz ve hafif yukarıdan çek. Ayakkabının tamamı görünsün. İkinci fotoğraf isteğe bağlı.</Text><Button secondary label={secondImage ? 'İkinci açıyı değiştir' : 'İkinci açı ekle'} disabled={busy} onPress={() => pickPhoto(false, true)} />{secondImage && <><View style={s.wrap}><Chip label="Yan açı" selected={preferredAngle === 'main'} onPress={() => setPreferredAngle('main')} /><Chip label="Çapraz açı" selected={preferredAngle === 'second'} onPress={() => setPreferredAngle('second')} /></View>{cutoutAvailable && <Button secondary label="İkinci açının arka planını temizle" disabled={busy} onPress={async () => { setBusy(true); try { setSecondImage(await removeBackground(secondOriginal ?? secondImage)); setSecondCutout(true); setPreferredAngle('second'); } catch { setError('İkinci açı temizlenemedi; orijinal korundu.'); } finally { setBusy(false); } }} />}{secondCutout && <Button secondary label="İkinci açının orijinaline dön" onPress={() => { setSecondImage(secondOriginal); setSecondCutout(false); }} />}<Button secondary label="İkinci açıyı kaldır" onPress={() => { setSecondImage(undefined); setSecondOriginal(undefined); setSecondCutout(false); setPreferredAngle('main'); }} /></>}</View>}
    <Text style={s.fieldLabel}>ANA RENK · {color.name.toLocaleUpperCase('tr')}</Text><View style={s.wrap}>{COLORS.map(value => <Pressable key={value.name} accessibilityRole="button" accessibilityLabel={value.name} accessibilityState={{ selected: color.name === value.name }} onPress={() => setColor(value)} style={[s.colorButton, { backgroundColor: value.hex }, color.name === value.name && { borderColor: C.coral, borderWidth: 3 }]}>{color.name === value.name && <Icon name="checkmark" size={18} color={value.name === 'Siyah' || value.name === 'Bordo' || value.name === 'Lacivert' ? C.white : C.ink} />}</Pressable>)}</View>
    <Text style={s.fieldLabel}>KESİM</Text><View style={s.wrap}>{(['Dar', 'Düz', 'Bol'] as Fit[]).map(value => <Chip key={value} label={value} selected={fit === value} onPress={() => setFit(value)} />)}</View>
    <Text style={s.fieldLabel}>HANGİ TARZLARA YAKIN?</Text><View style={s.wrap}>{STYLES.map(value => <Chip key={value} label={value} selected={styles.includes(value)} onPress={() => setStyles(toggleValue(styles, value))} />)}</View>
    <Text style={s.fieldLabel}>NERELERDE GİYERSİN?</Text><View style={s.wrap}>{OCCASIONS.map(value => <Chip key={value} label={value} selected={occasions.includes(value)} onPress={() => setOccasions(toggleValue(occasions, value))} />)}</View>
    {error ? <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text> : null}<View style={{ marginTop: 24 }}><Button label="Gardırobuma kaydet" icon="checkmark" onPress={submit} disabled={busy} /></View>{onDelete && <Button secondary label="Bu parçayı kaldır" onPress={onDelete} />}<Text style={s.fine}>Bilgileri kontrol et; tüm seçimleri değiştirebilirsin. Akıllı ekle yalnızca öneri sunar, sen kaydedene kadar gardırobun değişmez.</Text>
    </ScrollView></View></KeyboardAvoidingView></SafeAreaView></Modal>;
}

const s = StyleSheet.create({
  saveError: { backgroundColor: C.warningBg, padding: 14, marginHorizontal: 24, borderRadius: 14 },
  safe: { flex: 1, backgroundColor: C.bg }, app: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  header: { paddingHorizontal: 24, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.line }, brand: { fontSize: 31, fontWeight: '800', letterSpacing: -1.5, color: C.ink }, headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 }, localBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 }, dot: { width: 5, height: 5, backgroundColor: C.green, borderRadius: 3 }, localText: { fontSize: 9, letterSpacing: 1.2, color: C.green, fontWeight: '700' }, avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontFamily: SERIF, fontSize: 23, color: C.green },
  content: { padding: 24, paddingBottom: 34 }, headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 24 }, eyebrow: { color: C.green, fontSize: 9, letterSpacing: 1.7, fontWeight: '700', marginBottom: 9 }, title: { fontFamily: SERIF, fontSize: 32, lineHeight: 40, letterSpacing: -1, color: C.ink, marginBottom: 8 }, body: { color: C.muted, fontSize: 14, lineHeight: 22 }, meta: { fontSize: 11, color: C.muted, lineHeight: 18 }, fine: { fontSize: 11, lineHeight: 18, color: C.muted, marginTop: 12 },
  addButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.coral, justifyContent: 'center', alignItems: 'center' }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, button: { minHeight: 49, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 15, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 10 }, secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.line }, buttonText: { color: C.white, fontSize: 14, fontWeight: '600' },
  welcome: { backgroundColor: C.warmPanel, borderRadius: 25, padding: 23, marginBottom: 20 }, cardLabel: { fontSize: 10, letterSpacing: 1.5, color: C.coral, fontWeight: '700' }, welcomeTitle: { fontFamily: SERIF, fontSize: 38, lineHeight: 44, color: C.ink, marginTop: 22, marginBottom: 14 }, welcomeArt: { flexDirection: 'row', justifyContent: 'center', marginVertical: 12 }, inspiration: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: C.accentPanel, padding: 19, borderRadius: 18, marginBottom: 23 }, inspirationTitle: { color: C.ink, fontFamily: SERIF, fontSize: 22, lineHeight: 28, marginBottom: 5 }, roundArrow: { width: 36, height: 36, backgroundColor: C.softPanel, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  search: { flexDirection: 'row', gap: 9, alignItems: 'center', borderBottomWidth: 1, borderColor: C.line, paddingBottom: 12, marginBottom: 17 }, searchInput: { flex: 1, fontSize: 14, color: C.ink, paddingVertical: 5 }, chips: { flexDirection: 'row', gap: 8, paddingBottom: 8 }, chip: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 24, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg }, chipSelected: { backgroundColor: C.ink, borderColor: C.ink }, chipText: { color: C.muted, fontSize: 12 }, chipTextSelected: { color: C.white }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  demoBanner: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 }, demoText: { flex: 1, color: C.green, fontSize: 10, lineHeight: 16 }, railSection: { marginTop: 28 }, sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginVertical: 12 }, sectionTitle: { color: C.ink, fontSize: 18, fontWeight: '600', lineHeight: 25 }, count: { fontSize: 11, color: C.muted }, railLine: { height: 1, backgroundColor: C.rail, position: 'absolute', top: 65, left: 0, right: 0 }, rail: { gap: 8, paddingTop: 2, paddingBottom: 7 }, garmentCard: { width: 154, alignItems: 'center' }, itemName: { width: '100%', fontSize: 12, fontWeight: '500', color: C.ink, marginTop: 9, textAlign: 'center' }, footerNote: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 35 },
  nav: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 9, paddingBottom: 9, borderTopWidth: 1, borderColor: C.line, backgroundColor: C.bg }, navItem: { flex: 1, alignItems: 'center', gap: 4, minHeight: 53 }, navIcon: { paddingHorizontal: 15, paddingVertical: 5, borderRadius: 16 }, navIconActive: { backgroundColor: C.navActive }, navText: { fontSize: 10, color: C.muted, fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 38, paddingHorizontal: 10, gap: 12 }, emptyIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: C.pale, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }, panel: { backgroundColor: C.panel, borderRadius: 18, padding: 20, marginTop: 22, gap: 8 }, outfitCard: { borderRadius: 23, padding: 20, backgroundColor: C.cardPanel, marginTop: 20 }, outfitArt: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', minHeight: 160, paddingVertical: 12 }, palette: { flexDirection: 'row', gap: 5, marginBottom: 14 }, paletteDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: C.hairline }, outfitTitle: { fontFamily: SERIF, fontSize: 28, color: C.ink, marginBottom: 9 }, outfitParts: { fontSize: 11, lineHeight: 19, color: C.green, marginTop: 15 }, reject: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, paddingVertical: 14, marginTop: 7 }, iconButton: { padding: 10, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 8, borderBottomWidth: 1, borderColor: C.line }, photoPreview: { backgroundColor: C.pale, borderRadius: 20, alignItems: 'center', padding: 18 }, fieldLabel: { fontSize: 10, letterSpacing: 1.5, color: C.green, fontWeight: '700', marginTop: 26 }, input: { marginTop: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 12, padding: 15, fontSize: 15, color: C.ink }, colorButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.hairlineStrong, alignItems: 'center', justifyContent: 'center' }, error: { color: C.warningText, fontSize: 13, marginTop: 18 }, backdrop: { flex: 1, backgroundColor: C.scrim, justifyContent: 'center', alignItems: 'center', padding: 25 }, confirm: { width: '100%', maxWidth: 400, backgroundColor: C.bg, borderRadius: 22, padding: 24, gap: 12 }, toast: { position: 'absolute', bottom: 82, left: 20, right: 20, backgroundColor: C.ink, padding: 16, borderRadius: 14, flexDirection: 'row', gap: 10, alignItems: 'center' }, toastText: { color: C.white, fontSize: 12, lineHeight: 19, flex: 1 },
});
