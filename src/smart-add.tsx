import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Image, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Analysis, hasAnalysis } from './analysis-domain';
import { analyzePhoto, AnalysisResult, analysisRecipients, onlineAnalysisAvailable } from './analysis';
import { photoUri } from './photos';
import { C, SERIF } from './theme';

export function SmartAdd({ photo, disabled, onApply }: { photo?: string; disabled: boolean; onApply: (fields: Analysis) => void }) {
  const [smart, setSmart] = useState(false), [online, setOnline] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'review'>('idle');
  const [result, setResult] = useState<AnalysisResult>();
  const motion = useRef(new Animated.Value(0)).current;
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => { active.current?.abort(); }, []);
  useEffect(() => { active.current?.abort(); active.current = null; setPhase('idle'); setResult(undefined); }, [photo]);
  useEffect(() => {
    if (phase !== 'scanning') return;
    let alive = true;
    const animation = Animated.loop(Animated.timing(motion, { toValue: 1, duration: 1500, useNativeDriver: true }));
    motion.setValue(0);
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => { if (alive && !reduced) animation.start(); });
    return () => { alive = false; animation.stop(); };
  }, [phase, motion]);
  const close = () => { active.current?.abort(); active.current = null; setPhase('idle'); };
  async function scan() {
    if (!photo || disabled || active.current) return;
    const controller = new AbortController(); active.current = controller;
    setResult(undefined); setPhase('scanning');
    // Native work cannot always be cancelled. Ignore late results and bound UI waiting.
    const deadline = setTimeout(() => {
      if (active.current !== controller) return;
      controller.abort(); active.current = null;
      setResult({ fields: {}, source: 'device', fallback: true }); setPhase('review');
    }, 18000);
    try {
      const next = await analyzePhoto(photo, online, controller.signal);
      if (active.current === controller && !controller.signal.aborted) { setResult(next); setPhase('review'); }
    } catch {
      if (active.current === controller && !controller.signal.aborted) { setResult({ fields: {}, source: 'device', fallback: true }); setPhase('review'); }
    } finally { clearTimeout(deadline); if (active.current === controller) active.current = null; }
  }
  const fields = result?.fields ?? {};
  const rows = [['Kategori', fields.category], ['Renk', fields.colorName], ['Marka', fields.brand], ['Tarz önerisi', fields.styles?.join(', ')], ['Kesim', fields.fit], ['Kullanım', fields.occasions?.join(', ')]];
  return <View style={s.panel}>
    <View style={s.row}><Text style={s.title}>Nasıl ekleyelim?</Text><Switch accessibilityLabel="Akıllı ekleme" value={smart} onValueChange={setSmart} disabled={disabled} trackColor={{ true: C.green }} /></View>
    <Text style={s.body}>{smart ? 'Akıllı ekle · Fotoğrafı incele, bilgileri kontrol et.' : 'Elle ekle · Bilgileri aşağıdan kendin seç.'}</Text>
    {smart && <>
      <Text style={s.body}>Önce tek bir kıyafetin göründüğü fotoğraf seç. Renk için kıyafeti ortala; marka için okunaklı etiket kullan.</Text>
      {onlineAnalysisAvailable ? <View><View style={s.row}><Text style={s.body}>Çevrimiçi incelemeye izin ver</Text><Switch accessibilityLabel="Çevrimiçi fotoğraf incelemesine izin ver" value={online} onValueChange={setOnline} /></View><Text style={s.small}>Açarsan yalnızca seçtiğin fotoğraf Kombiqo analiz servisine ve {analysisRecipients} sağlayıcılarına gönderilir. Gardırobun ve profilin gönderilmez. İzin bu ekran kapandığında sıfırlanır.</Text></View> : <Text style={s.small}>Cihazında incelenir. iPhone sürümünde renk, okunabilir marka etiketi ve desteklenen kıyafet türleri önerilebilir. Bulunamayan bilgileri sen tamamlarsın.</Text>}
      <Pressable accessibilityRole="button" disabled={!photo || disabled} onPress={() => { void scan(); }} style={[s.button, (!photo || disabled) && { opacity: .4 }]}><Text style={s.white}>Fotoğrafı incele</Text></Pressable>
    </>}
    <Modal visible={phase !== 'idle'} animationType="fade" onRequestClose={close}>
      <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
        <Text style={s.kicker}>AKILLI EKLE</Text><Text style={s.heading}>{phase === 'scanning' ? 'Parçanı tanıyoruz.' : 'Son dokunuş sende.'}</Text>
        <View style={s.preview}>{photo && <Image source={{ uri: photoUri(photo) }} resizeMode="contain" style={s.image} accessibilityLabel="İncelenen kıyafet" />}{phase === 'scanning' && <Animated.View pointerEvents="none" style={[s.scan, { transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [0, 276] }) }] }]} />}</View>
        {phase === 'scanning' ? <Text accessibilityLiveRegion="polite" style={s.body}>{online ? 'Kıyafetin inceleniyor…' : 'Fotoğraf cihazında inceleniyor…'}</Text> : <>
          <Text accessibilityLiveRegion="polite" style={s.body}>{result?.fallback ? 'Cihazındaki bilgilerle devam ediyoruz. Eksik alanları sen tamamlayabilirsin.' : 'Bulunan bilgiler öneridir. Işık ve fotoğraf açısı sonucu etkileyebilir.'}</Text>
          <View style={s.results}>{rows.map(([label, value]) => <View key={label} style={s.resultRow}><Text style={s.body}>{label}</Text><Text style={[s.value, !value && { color: C.muted }]}>{value || 'Bilinmiyor'}</Text></View>)}</View>
          {hasAnalysis(fields) && <Pressable accessibilityRole="button" style={s.button} onPress={() => { onApply(fields); close(); }}><Text style={s.white}>Önerileri forma aktar</Text></Pressable>}
          <Text style={s.small}>Yalnızca bulunan alanlar forma aktarılır. Kaydetmeden önce tüm alanları düzenleyebilirsin.</Text>
        </>}
        <Pressable accessibilityRole="button" style={s.secondary} onPress={close}><Text style={s.body}>{phase === 'scanning' ? 'İptal et, elle devam et' : 'Değiştirmeden forma dön'}</Text></Pressable>
      </ScrollView></SafeAreaView>
    </Modal>
  </View>;
}
const s = StyleSheet.create({ panel: { backgroundColor: C.panel, borderRadius: 18, padding: 18, marginBottom: 20, gap: 12 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, title: { color: C.ink, fontSize: 17, fontWeight: '600' }, body: { color: C.muted, fontSize: 14, lineHeight: 22, flexShrink: 1 }, small: { color: C.muted, fontSize: 12, lineHeight: 19 }, button: { padding: 16, minHeight: 50, borderRadius: 15, backgroundColor: C.ink, alignItems: 'center', marginTop: 8 }, white: { color: C.white, fontWeight: '600', fontSize: 14 }, safe: { flex: 1, backgroundColor: C.bg }, content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 24, gap: 18 }, kicker: { color: C.green, fontSize: 11, letterSpacing: 2 }, heading: { fontFamily: SERIF, fontSize: 32, color: C.ink }, preview: { height: 280, overflow: 'hidden', backgroundColor: C.pale, borderRadius: 22 }, image: { width: '100%', height: '100%' }, scan: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: C.coral }, results: { borderRadius: 16, backgroundColor: C.panel, paddingHorizontal: 16 }, resultRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line }, value: { color: C.ink, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' }, secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center' } });
