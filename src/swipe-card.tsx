import React, { createContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, PanResponder, Pressable, Text, View } from 'react-native';
import { C } from './theme';
export const SwipeMotion = createContext<Animated.Value | null>(null);
export function SwipeCard({ children, onRate }: { children: React.ReactNode; onRate: (liked: boolean) => void }) {
  const x = useRef(new Animated.Value(0)).current;
  const locked = useRef(false);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => listener.remove();
  }, []);
  function rate(liked: boolean) {
    if (locked.current) return;
    locked.current = true;
    if (reduced) { onRate(liked); return; }
    Animated.timing(x, { toValue: liked ? 450 : -450, duration: 180, useNativeDriver: true }).start(({ finished }) => { if (finished) onRate(liked); });
  }
  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => !locked.current && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderMove: (_, g) => x.setValue(g.dx),
    onPanResponderRelease: (_, g) => { if (Math.abs(g.dx) > 80) rate(g.dx > 0); else Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(); },
    onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(),
  });
  return <View><Text style={{ color: C.green, textAlign: 'center', marginTop: 16 }}>← Bana göre değil     ·     Beğendim →</Text><Animated.View {...responder.panHandlers} style={{ transform: [{ translateX: x }, { rotate: reduced ? '0deg' : x.interpolate({ inputRange: [-300, 0, 300], outputRange: ['-6deg', '0deg', '6deg'], extrapolate: 'clamp' }) }] }}><SwipeMotion.Provider value={reduced ? null : x}>{children}</SwipeMotion.Provider></Animated.View><View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>{[false, true].map(liked => <Pressable key={String(liked)} accessibilityRole="button" accessibilityLabel={liked ? 'Kombini beğen' : 'Kombini beğenme'} onPress={() => rate(liked)} style={{ flex: 1, padding: 17, borderRadius: 18, backgroundColor: liked ? C.green : C.pale, alignItems: 'center' }}><Text style={{ color: liked ? C.white : C.ink, fontWeight: '600' }}>{liked ? '♡ Beğendim' : '× Bana göre değil'}</Text></Pressable>)}</View></View>;
}
