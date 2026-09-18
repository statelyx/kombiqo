import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Action, f } from './feature-ui';
import { C, SERIF } from './theme';
export function prettyDate(value: string) {
  const date = new Date(`${value}T12:00:00+03:00`);
  return Number.isFinite(+date) ? date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }) : value;
}
export function DayDate({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const [open, setOpen] = useState(false), [month, setMonth] = useState(value.slice(0, 7));
  const [year, number] = month.split('-').map(Number);
  const offset = (new Date(Date.UTC(year, number - 1, 1)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const shift = (amount: number) => setMonth(new Date(Date.UTC(year, number - 1 + amount, 1)).toISOString().slice(0, 7));
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={`Tarih seç: ${prettyDate(value)}`} onPress={() => { setMonth(value.slice(0, 7)); setOpen(true); }} style={[f.input, { backgroundColor: C.bg, minHeight: 54, justifyContent: 'center' }]}><Text style={[f.text, { fontSize: 17 }]}>{prettyDate(value)}</Text></Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}><View style={{ flex: 1, backgroundColor: C.scrim, justifyContent: 'center', padding: 20 }}><View style={[f.panel, { width: '100%', maxWidth: 420, alignSelf: 'center' }]}>
      <Text style={{ fontFamily: SERIF, fontSize: 28, color: C.ink }}>Gününü seç.</Text>
      <View style={[f.row, { alignItems: 'center', justifyContent: 'space-between' }]}><Action label="Önceki ay" onPress={() => shift(-1)} /><Text style={f.text}>{new Date(Date.UTC(year, number - 1, 1)).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</Text><Action label="Sonraki ay" onPress={() => shift(1)} /></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'].map(day => <Text key={day} style={[f.muted, { width: '14.285%', textAlign: 'center', paddingVertical: 8 }]}>{day}</Text>)}{Array.from({ length: offset + count }, (_, i) => { const day = i - offset + 1, date = `${month}-${String(day).padStart(2, '0')}`; return day <= 0 ? <View key={i} style={{ width: '14.285%' }} /> : <Pressable key={i} accessibilityRole="button" accessibilityLabel={prettyDate(date)} accessibilityState={{ selected: date === value }} onPress={() => { onChange(date); setOpen(false); }} style={{ width: '14.285%', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: date === value ? C.coral : 'transparent' }}><Text style={{ color: date === value ? C.white : C.ink }}>{day}</Text></Pressable>; })}</View>
      <Action label="Vazgeç" onPress={() => setOpen(false)} />
    </View></View></Modal>
  </>;
}
