import React, { useRef, useState } from 'react';
import { PanResponder, Text, View } from 'react-native';
import { Garment, Outfit } from './domain';
import { GarmentArt } from './garment-art';
import { Action, f } from './feature-ui';
import { exportBoard } from './board-export';
type Pose = { x: number; y: number; scale: number; angle: number };
const bound = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));
function safe(pose: Pose | undefined, index: number): Pose { return pose && ['x', 'y', 'scale', 'angle'].every(key => Number.isFinite(pose[key as keyof Pose])) ? { x: bound(pose.x, 0, .6), y: bound(pose.y, 0, .68), scale: bound(pose.scale, .6, 1.4), angle: bound(pose.angle, -45, 45) } : { x: index % 2 * .48 + .04, y: Math.floor(index / 2) * .30 + .06, scale: 1.1, angle: index % 2 ? 5 : -5 }; }
function Piece({ item, pose, width, onMove, onSelect }: { item: Garment; pose: Pose; width: number; onMove: (p: Pose) => void; onSelect: () => void }) {
  const current = useRef({ pose, onMove, onSelect }); current.current = { pose, onMove, onSelect };
  const start = useRef(pose);
  const pan = React.useMemo(() => PanResponder.create({ onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true, onPanResponderGrant: () => { start.current = current.current.pose; current.current.onSelect(); }, onPanResponderMove: (_, g) => current.current.onMove({ ...start.current, x: bound(start.current.x + g.dx / width, 0, .6), y: bound(start.current.y + g.dy / (width * 1.3), 0, .68) }), onPanResponderTerminationRequest: () => false }), [width]);
  return <View {...pan.panHandlers} accessible accessibilityRole="button" accessibilityLabel={`${item.name}, düzenlemek için seç`} onAccessibilityTap={onSelect} style={{ position: 'absolute', left: pose.x * width, top: pose.y * width * 1.3, transform: [{ rotate: `${pose.angle}deg` }, { scale: pose.scale }] }}><GarmentArt item={item} size={width * .34} /></View>;
}
export function FreeBoard({ parts, outfit, onChange, onSelect }: { parts: Garment[]; outfit: Outfit; onChange: (outfit: Outfit) => void; onSelect?: (id: string) => void }) {
  const [width, setWidth] = useState(300), [selected, setSelected] = useState<string>(), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  const capture = useRef<View>(null);
  function change(id: string, pose: Pose) { onChange({ ...outfit, layout: { ...outfit.layout, [id]: pose } }); }
  function adjust(delta: Partial<Pose>) { const index = parts.findIndex(p => p.id === selected); if (index < 0) return; const pose = safe(outfit.layout?.[selected!], index); change(selected!, safe({ ...pose, ...Object.fromEntries(Object.entries(delta).map(([key, n]) => [key, pose[key as keyof Pose] + n!])) }, index)); }
  return <View style={{ gap: 10 }}>
    <Text style={f.text}>Serbest kombin panosu</Text><Text style={f.muted}>Parçaları sürükle. Seçtiğin parçayı aşağıdaki kontrollerle büyüt veya döndür.</Text>
    <View ref={capture} collapsable={false} onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ width: '100%', aspectRatio: 1 / 1.3, backgroundColor: '#F2EDE3', overflow: 'hidden', borderRadius: 18 }}>
      {parts.map((item, index) => <Piece key={item.id} item={item} width={width} pose={safe(outfit.layout?.[item.id], index)} onSelect={() => { setSelected(item.id); onSelect?.(item.id); }} onMove={pose => change(item.id, pose)} />)}
      <Text style={{ position: 'absolute', bottom: 12, right: 16, color: '#856F5A', fontSize: 14 }}>kombiqo.</Text>
    </View>
    <View style={f.row}>{parts.map(item => <Action key={item.id} label={`${selected === item.id ? '✓ ' : ''}${item.name}`} onPress={() => setSelected(item.id)} />)}</View>
    {selected && <View style={f.row}><Action label="Küçült" onPress={() => adjust({ scale: -.1 })} /><Action label="Büyüt" onPress={() => adjust({ scale: .1 })} /><Action label="Sola döndür" onPress={() => adjust({ angle: -5 })} /><Action label="Sağa döndür" onPress={() => adjust({ angle: 5 })} /><Action label="←" onPress={() => adjust({ x: -.03 })} /><Action label="→" onPress={() => adjust({ x: .03 })} /><Action label="↑" onPress={() => adjust({ y: -.03 })} /><Action label="↓" onPress={() => adjust({ y: .03 })} /></View>}
    <View style={f.row}>{['Dergi', 'Düzenli', 'Çapraz'].map(template => <Action key={template} label={template} onPress={() => onChange({ ...outfit, layout: Object.fromEntries(parts.map((item, i) => [item.id, { x: i % 2 * .45 + .07, y: Math.floor(i / 2) * .26 + .04, scale: template === 'Dergi' ? 1.1 : .9, angle: template === 'Düzenli' ? 0 : (i % 2 ? 1 : -1) * (template === 'Çapraz' ? 15 : 5) }])) })} />)}</View>
    <Action label="Düzeni sıfırla" onPress={() => onChange({ ...outfit, layout: undefined })} />
    <Action disabled={busy} label={busy ? 'Görsel hazırlanıyor…' : 'Panoyu görsel olarak paylaş / indir'} onPress={() => { setBusy(true); void exportBoard(capture).then(() => setNotice('Görsel paylaşım için hazırlandı.')).catch(() => setNotice('Görsel oluşturulamadı. Tekrar deneyebilirsin.')).finally(() => setBusy(false)); }} />
    {notice ? <Text style={f.muted} accessibilityLiveRegion="polite">{notice}</Text> : null}
  </View>;
}
