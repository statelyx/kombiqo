import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, SERIF } from './theme';

// A render error must never leave the user with a blank screen and unreachable wardrobe data.
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { if (__DEV__) console.error('Kombiqo arayüz hatası', error, info.componentStack); }
  retry = () => this.setState({ failed: false });
  render() {
    if (!this.state.failed) return this.props.children;
    return <SafeAreaView style={s.safe}><View style={s.card}>
      <Text style={s.kicker}>KAYITLARIN GÜVENDE</Text>
      <Text style={s.title}>Beklenmedik bir hata oldu.</Text>
      <Text style={s.body}>Gardırobun ve fotoğrafların cihazında korunuyor. Hiçbir kayıt silinmedi.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Ekranı yeniden dene" onPress={this.retry} style={s.button}><Text style={s.buttonText}>Yeniden dene</Text></Pressable>
    </View></SafeAreaView>;
  }
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg, justifyContent: 'center' },
  card: { padding: 25, margin: 24, backgroundColor: C.warmPanel, borderRadius: 25 },
  kicker: { fontSize: 10, letterSpacing: 1.5, color: C.coral, fontWeight: '700', marginBottom: 16 },
  title: { fontFamily: SERIF, fontSize: 30, lineHeight: 38, color: C.ink, marginBottom: 10 },
  body: { color: C.muted, fontSize: 14, lineHeight: 22 },
  button: { minHeight: 49, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 15, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  buttonText: { color: C.white, fontSize: 14, fontWeight: '600' },
});