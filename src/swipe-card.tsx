import React, { useRef } from 'react';
import { Animated, PanResponder, Pressable, Text, View } from 'react-native';
export function SwipeCard({ children, onRate }: { children: React.ReactNode; onRate: (liked: boolean) => void }) {
  const x = useRef(new Animated.Value(0)).current;
  const locked = useRef(false);
  function rate(liked: boolean) {
    if (locked.current) return;
    locked.current = true;
    Animated.timing(x, { toValue: liked ? 450 : -450, duration: 180, useNativeDriver: true }).start(({ finished }) => { if (finished) onRate(liked); });
  }
  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => !locked.current && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderMove: (_, g) => x.setValue(g.dx),
    onPanResponderRelease: (_, g) => { if (Math.abs(g.dx) > 80) rate(g.dx > 0); else Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(); },
    onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(),
  });
  return <View><Text style={{ color: '#65715A', textAlign: 'center', marginTop: 16 }}>← Bana göre değil     ·     Beğendim →</Text><Animated.View {...responder.panHandlers} style={{ transform: [{ translateX: x }, { rotate: x.interpolate({ inputRange: [-300, 0, 300], outputRange: ['-12deg', '0deg', '12deg'], extrapolate: 'clamp' }) }] }}>{children}</Animated.View><View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>{[false, true].map(liked => <Pressable key={String(liked)} accessibilityRole="button" accessibilityLabel={liked ? 'Kombini beğen' : 'Kombini beğenme'} onPress={() => rate(liked)} style={{ flex: 1, padding: 17, borderRadius: 18, backgroundColor: liked ? '#65715A' : '#EEECE3', alignItems: 'center' }}><Text style={{ color: liked ? 'white' : '#282F29', fontWeight: '600' }}>{liked ? '♡ Beğendim' : '× Bana göre değil'}</Text></Pressable>)}</View></View>;
}
