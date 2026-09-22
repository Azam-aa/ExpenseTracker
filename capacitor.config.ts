import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.personal.daytodayexpenses',
  appName: 'Daily Expenses',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    StatusBar: {
      backgroundColor: '#0f1513',
      style: 'DARK'
    }
  }
};

export default config;
