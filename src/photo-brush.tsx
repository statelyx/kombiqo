import React, { useRef, useState } from 'react';
import { Modal, PanResponder, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrushStroke } from './domain';
import { ProductImage } from './product-image';
import { C } from './theme';

export function PhotoBrush({ image, initial, onSave, onClose }: { image: string; initial?: BrushStroke[]; onSave: (strokes: BrushStroke[]) => void; onClose: () => void }) {
  const [strokes, setStrokes] = useState(initial ?? []), [restore, setRestore] = useState(false), [width, setWidth] = useState(260), [radius, setRadius] = useState(60);
  const { height: screenHeight } = useWindowDimensions();
  const path = useRef('');
  const add = (x: number, y: number, first: boolean) => {
    const point = `${Math.max(0, Math.min(1000, x / width * 1000)).toFixed(1)} ${Math.max(0, Math.min(1200, y / width * 1000)).toFixed(1)}`;
    path.current = first ? `M${point} L${point}` : `${path.current} L${point}`;
    if (path.current.length > 18000) return;
    const stroke = { points: path.current, width: radius, restore };
    setStrokes(previous => first ? [...previous.slice(-99), stroke] : [...previous.slice(0, -1), stroke]);
  };
  const responder = PanResponder.create({ onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: event => add(event.nativeEvent.locationX, event.nativeEvent.locationY, true),
    onPanResponderMove: event => add(event.nativeEvent.locationX, event.nativeEvent.locationY, false) });
  const button = (label: string, action: () => void) => <Pressable accessibilityRole="button" onPress={action} style={{ padding: 13, backgroundColor: C.pale, borderRadius: 12 }}><Text style={{ color: C.ink }}>{label}</Text></Pressable>;
  return <Modal visible onRequestClose={onClose}><SafeAreaView style={{ flex: 1, backgroundColor: C.bg, padding: 18, gap: 12 }}>
    <Text style={{ fontSize: 24, color: C.ink }}>Kenarları düzelt</Text><Text>Silmek istediğin arka planı parmağınla boya. Geri getir yalnızca bu fırçayla sildiğin alanları geri açar.</Text>
    <View onLayout={event => setWidth(Math.min(event.nativeEvent.layout.width, 300, Math.max(140, (screenHeight - 340) / 1.2)))} style={{ alignItems: 'center' }}><View {...responder.panHandlers} style={{ width, height: width * 1.2, backgroundColor: '#DDD8CD' }}><View pointerEvents="none"><ProductImage image={image} strokes={strokes} width={width} height={width * 1.2} /></View></View></View>
    <View style={{ flexDirection: 'row', gap: 8 }}>{button(restore ? 'Mod: Geri getir' : 'Mod: Sil', () => setRestore(!restore))}{button(radius === 60 ? 'İnce fırça' : 'Kalın fırça', () => setRadius(radius === 60 ? 25 : 60))}</View>
    <View style={{ flexDirection: 'row', gap: 8 }}>{button('Geri al', () => setStrokes(s => s.slice(0, -1)))}{button('Sıfırla', () => setStrokes([]))}</View>
    {button('Düzeltmeyi uygula', () => onSave(strokes))}{button('Vazgeç', onClose)}
  </SafeAreaView></Modal>;
}
