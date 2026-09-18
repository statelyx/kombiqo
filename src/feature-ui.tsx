import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { C } from './theme';
export function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[f.button, disabled && { opacity: .4 }]}><Text style={f.text}>{label}</Text></Pressable>;
}
export const f = StyleSheet.create({ page: { flex: 1, backgroundColor: C.bg }, content: { padding: 22, gap: 12, width: '100%', maxWidth: 700, alignSelf: 'center' }, title: { fontSize: 26, color: C.ink }, text: { fontSize: 14, lineHeight: 21, color: C.ink }, muted: { fontSize: 12, lineHeight: 19, color: C.muted }, button: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel, minHeight: 48, justifyContent: 'center' }, panel: { padding: 18, borderRadius: 20, backgroundColor: C.panel, gap: 10, marginVertical: 12 }, input: { padding: 14, borderWidth: 1, borderColor: C.line, borderRadius: 12, color: C.ink }, row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' } });
