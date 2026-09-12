import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_VARIANT = process.env.APP_VARIANT === 'production' ? 'production' : 'development';

const variant = {
  development: {
    name: 'Global Invitation DEV',
    bundleIdentifier: 'com.globalinvitation.app.dev',
    androidPackage: 'com.globalinvitation.app.dev',
    scheme: 'globalinvitation-dev',
  },
  production: {
    name: 'Global Invitation',
    bundleIdentifier: 'com.globalinvitation.app',
    androidPackage: 'com.globalinvitation.app',
    scheme: 'globalinvitation',
  },
}[APP_VARIANT];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: variant.name,
  slug: 'global-invitation',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: variant.scheme,
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: false,
    bundleIdentifier: variant.bundleIdentifier,
  },
  android: {
    package: variant.androidPackage,
    softwareKeyboardLayoutMode: 'resize',
    adaptiveIcon: {
      backgroundColor: '#F4EFE6',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: true,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#F4EFE6',
      },
    ],
    'expo-secure-store',
    'expo-sharing',
    'expo-audio',
    'expo-asset',
    [
      'expo-image-picker',
      {
        photosPermission: '초대장 사진을 선택하려면 사진 라이브러리 접근이 필요합니다.',
        cameraPermission: '초대장 사진을 촬영하려면 카메라 접근이 필요합니다.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appVariant: APP_VARIANT,
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? 'global-invitation-native',
    },
  },
});
