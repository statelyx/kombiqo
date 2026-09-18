import React, { useId } from 'react';
import Svg, { Defs, Mask, Rect, Path, Image as SvgImage } from 'react-native-svg';
import { BrushStroke } from './domain';
import { photoUri } from './photos';

export function ProductImage({ image, strokes = [], width, height }: { image: string; strokes?: BrushStroke[]; width: number; height: number }) {
  const id = `mask-${useId().replace(/:/g, '')}`;
  return <Svg width={width} height={height} viewBox="0 0 1000 1200">
    <Defs><Mask id={id} x="0" y="0" width="1000" height="1200" maskUnits="userSpaceOnUse"><Rect width="1000" height="1200" fill="white" />{strokes.map((stroke, i) => <Path key={i} d={stroke.points} stroke={stroke.restore ? 'white' : 'black'} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}</Mask></Defs>
    <SvgImage href={photoUri(image)} width="1000" height="1200" preserveAspectRatio="xMidYMid meet" mask={`url(#${id})`} />
  </Svg>;
}
