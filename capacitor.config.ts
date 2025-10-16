import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6960cf0b885c4b85bdc3cd5349d8eacc',
  appName: 'sanare-home-health',
  webDir: 'dist',
  server: {
    url: 'https://6960cf0b-885c-4b85-bdc3-cd5349d8eacc.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
