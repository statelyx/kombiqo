import React, { useContext, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Garment } from './domain';
import { GarmentArt } from './garment-art';
import { SwipeMotion } from './swipe-card';
import { C } from './theme';

// Real wardrobe images, arranged as an editorial flat lay; never synthesized views.
export function OutfitComposition({ parts }: { parts: Garment[] }) {
  const motion = useContext(SwipeMotion);
  const [width, setWidth] = useState(280);
  const [selected, setSelected] = useState<string>();
  const long = parts.some(item => item.category === 'Elbiseler');
  const unit = Math.min(width / 2.5, 150);
  const height = unit * 2.65;
  const [second, setSecond] = useState(false);
  const detail = parts.find(item => item.id === selected);
  return <View>
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ height, marginVertical: 12, borderRadius: 20, backgroundColor: C.bg, overflow: 'hidden' }}>
      {parts.filter(item => !['Dış giyim', 'Çantalar', 'Aksesuarlar'].includes(item.category)).map((item, i) => {
        const shoe = item.category === 'Ayakkabılar';
        const bottom = item.category === 'Altlar';
        const dress = item.category === 'Elbiseler';
        const size = unit * (dress ? 1.55 : shoe ? .85 : 1.05);
        const left = shoe ? width * .55 : bottom ? width * .53 : width * .06;
        const top = shoe ? height - size * 1.2 - 10 : bottom ? unit * .26 : unit * .12;
        return <Animated.View key={item.id} style={{ position: 'absolute', left: long && shoe ? width * .59 : left, top, shadowColor: C.ink, shadowOpacity: .12, shadowRadius: 9, shadowOffset: { width: 3, height: 7 }, transform: [{ translateX: motion ? motion.interpolate({ inputRange: [-300, 0, 300], outputRange: [-(i + 1) * 3, 0, (i + 1) * 3], extrapolate: 'clamp' }) : 0 }, { rotate: shoe ? '-10deg' : bottom ? '5deg' : '-5deg' }] }}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${item.name}, kombin parçasını incele`} accessibilityState={{ selected: selected === item.id }} onPress={() => { setSelected(selected === item.id ? undefined : item.id); setSecond(false); }} style={{ padding: 3, borderRadius: 12, borderWidth: 1, borderColor: selected === item.id ? C.green : 'transparent' }}><GarmentArt item={item} size={size} /></Pressable>
        </Animated.View>;
      })}
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>{parts.filter(item => ['Dış giyim', 'Çantalar', 'Aksesuarlar'].includes(item.category)).map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.name}, ek parça`} onPress={() => { setSelected(item.id); setSecond(false); }}><GarmentArt item={item} size={78} /></Pressable>)}</View>
    {detail?.secondImage && <View style={{ alignItems: 'center' }}><GarmentArt item={{ ...detail, preferredAngle: second ? 'second' : 'main' }} size={130} /><Pressable accessibilityRole="button" onPress={() => setSecond(!second)} style={{ padding: 14 }}><Text style={{ color: C.green }}>{second ? 'Yan açıyı göster' : 'Çapraz açıyı göster'}</Text></Pressable></View>}
    <Text style={{ color: C.muted, fontSize: 11, lineHeight: 18, marginBottom: 12 }}>{detail ? `${detail.name} · ${detail.colorName} · ${detail.fit} kesim` : 'Parçalara dokun, detaylarını gör.'}</Text>
  </View>;
}
