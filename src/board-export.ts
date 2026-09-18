import type { RefObject } from 'react';
import type { View } from 'react-native';
export async function exportBoard(ref: RefObject<View | null>) {
  // Browser captures use the library's DOM renderer; native uses the platform module.
  const { captureRef } = await import('react-native-view-shot');
  const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'data-uri' });
  const link = document.createElement('a'); link.href = uri; link.download = 'kombiqo-kombin.png'; link.click();
}
