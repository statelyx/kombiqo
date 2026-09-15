import React, { useId } from 'react';
import { Image, View } from 'react-native';
import Svg, { Path, Line, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Garment } from './domain';
import { photoUri } from './photos';
export function GarmentArt({ item, size = 130, hanger = false }: { item: Garment; size?: number; hanger?: boolean }) {
  const gradientId = `fabric-${useId().replace(/:/g, '')}`;
  if (item.image) return <View style={{ width: size, height: size * 1.2 }}>
    {item.cutout && <Svg width={size} height={size * 1.2} viewBox="0 0 160 192" style={{ position: 'absolute' }}>
      <Ellipse cx="80" cy="179" rx="43" ry="5" fill="#30251C" opacity="0.09" />
      {hanger && item.category !== 'Ayakkabılar' && <><Path d="M75 14 C75 4 88 5 87 13 C87 18 80 18 80 25 L80 29" fill="none" stroke="#AB8B67" strokeWidth="2" /><Path d="M80 27 L44 46 Q42 49 47 49 L113 49 Q118 49 115 46 Z" fill="none" stroke="#AB8B67" strokeWidth="3" /></>}
    </Svg>}
    <Image source={{ uri: photoUri(item.image) }} style={{ width: size, height: item.cutout ? size * 0.9 : size * 1.2, marginTop: item.cutout ? size * 0.21 : 0, borderRadius: item.cutout ? 0 : 16 }} resizeMode="contain" accessibilityLabel={item.name} />
  </View>;
  return <View accessible accessibilityLabel={item.name}><Svg width={size} height={size * 1.2} viewBox="0 0 160 192">
    <Defs><LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={item.color} /><Stop offset="1" stopColor={item.color} stopOpacity="0.78" /></LinearGradient></Defs>
    <Ellipse cx="80" cy="181" rx="42" ry="4" fill="#30251C" opacity="0.06" />
    {hanger && item.category !== 'Ayakkabılar' && <><Path d="M75 14 C75 4 88 5 87 13 C87 18 80 18 80 25 L80 29" fill="none" stroke="#AB8B67" strokeWidth="2" /><Path d="M80 27 L44 46 Q42 49 47 49 L113 49 Q118 49 115 46 Z" fill="none" stroke="#AB8B67" strokeWidth="3" /></>}
    {item.category === 'Üstler' && <><Path d="M56 40 L35 49 L10 80 L32 98 L45 80 L44 169 Q80 175 116 169 L115 80 L128 98 L150 80 L125 49 L104 40 Q80 55 56 40Z" fill={`url(#${gradientId})`} stroke="#403A32" strokeOpacity="0.14" /><Path d="M58 42 Q80 67 102 42 M48 163 Q80 167 112 163 M45 81 L49 113 M115 81 L111 111" stroke="#403A32" strokeOpacity="0.18" fill="none" strokeWidth="2" />{item.name.includes('Çizgili') && Array.from({length:9},(_,i)=><Line key={i} x1={49+i*8} y1={57} x2={48+i*8} y2={163} stroke="#FAF8F2" strokeWidth="2" opacity="0.7" />)}</>}
    {item.category === 'Altlar' && <><Path d="M48 47 L112 47 L121 174 L88 174 L79 97 L72 174 L39 174 Z" fill={`url(#${gradientId})`} stroke="#403A32" strokeOpacity="0.2" /><Path d="M48 55 L113 55 M80 56 L80 91 M53 61 Q54 79 44 85 M107 61 Q106 78 116 85 M61 69 L54 167 M98 68 L105 167" stroke="#403A32" strokeOpacity="0.23" strokeWidth="1.5" fill="none" /></>}
    {item.category === 'Dış giyim' && <><Path d="M58 39 L36 50 L18 151 L38 158 L48 87 L45 174 L116 174 L112 87 L126 158 L145 151 L126 50 L103 39 L81 58Z" fill={`url(#${gradientId})`} stroke="#403A32" strokeOpacity="0.2" /><Path d="M58 39 L68 71 L59 78 L81 116 L103 78 L94 71 L103 39 M81 116 L81 171 M51 136 L68 136 M92 136 L110 136" stroke="#403A32" strokeOpacity="0.27" strokeWidth="2" fill="none" /></>}
    {item.category === 'Elbiseler' && <><Path d="M58 40 L45 53 L54 85 L29 174 Q80 185 131 174 L106 85 L115 53 L102 40 Q80 58 58 40Z" fill={`url(#${gradientId})`} stroke="#403A32" strokeOpacity="0.2" /><Path d="M54 85 L106 85 M67 95 L53 165 M93 95 L108 165" stroke="#403A32" strokeOpacity="0.18" fill="none" /></>}
    {item.category === 'Ayakkabılar' && <><Path d="M37 96 L57 105 L77 92 L93 118 L129 132 Q149 137 144 153 L24 153 Q19 140 27 125Z" fill={`url(#${gradientId})`} stroke="#403A32" strokeOpacity="0.25" strokeWidth="2" /><Path d="M24 153 L144 153 L143 161 L25 161 Z" fill="#EAE5DA" stroke="#403A32" strokeOpacity="0.15" /><Path d="M81 113 L96 115 M86 120 L104 122 M92 127 L111 129 M33 132 Q50 148 72 141" stroke="#403A32" strokeOpacity="0.25" strokeWidth="2" fill="none" /></>}
  </Svg></View>;
}
