import { Platform } from 'react-native';

// Single source for the Kombiqo palette. Import this instead of repeating hex values.
export const C = {
  bg: '#F8F6F1', ink: '#282F29', muted: '#7D8178', line: '#E6E5DD',
  coral: '#C35F45', pale: '#EEECE3', green: '#65715A', white: '#FFFFFF',
  warningBg: '#F7E6DF', warningText: '#AF382E',
  warmPanel: '#F0ECE2', accentPanel: '#F0E8DE', softPanel: '#FAF6EE',
  panel: '#F0EFE7', cardPanel: '#F0EDE4', navActive: '#F0E4DA',
  rail: '#BFBEB0', scrim: '#17201966', hairline: '#00000012', hairlineStrong: '#00000018',
};

export const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
