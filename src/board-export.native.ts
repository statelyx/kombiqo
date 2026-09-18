import type { RefObject } from 'react';
import type { View } from 'react-native';
export async function exportBoard(ref: RefObject<View | null>) {
  const { captureRef, releaseCapture } = await import('react-native-view-shot');
  const Sharing = await import('expo-sharing');
  if (!await Sharing.isAvailableAsync()) throw new Error('Paylaşım bu cihazda kullanılamıyor.');
  const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
  try { await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Kombinini paylaş' }); }
  finally { releaseCapture(uri); }
}
