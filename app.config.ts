import type { ExpoConfig, ConfigContext } from 'expo/config';
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Kombiqo', slug: 'kombiqo', version: '0.2.0', scheme: 'kombiqo',
  orientation: 'portrait', userInterfaceStyle: 'light', icon: './assets/icon.png',
  ios: { supportsTablet: false, bundleIdentifier: 'com.kombiqo.app', buildNumber: process.env.BUILD_NUMBER || '1', infoPlist: { ITSAppUsesNonExemptEncryption: false } },
  android: { package: 'com.kombiqo.app', versionCode: Number(process.env.BUILD_NUMBER || 1), adaptiveIcon: { foregroundImage: './assets/android-icon-foreground.png', monochromeImage: './assets/android-icon-monochrome.png', backgroundColor: '#C35F45' } },
  plugins: ['expo-font', ['expo-splash-screen', { image: './assets/splash-icon.png', imageWidth: 160, backgroundColor: '#F8F6F1' }], ['expo-image-picker', { photosPermission: 'Kıyafet fotoğraflarını seçerek gardırobuna ekleyebilmen için fotoğraf erişimi gerekir.', cameraPermission: 'Kıyafetlerini fotoğraflayıp gardırobuna eklemek için kamera erişimi gerekir.', microphonePermission: false }]],
  web: { favicon: './assets/favicon.png', name: 'Kombiqo', shortName: 'Kombiqo' },
});
