import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aijobtracker.app',
  appName: 'JobTracker AI',
  webDir: 'out',
  server: {
    url: 'https://ai-job-tracker-demo.vercel.app',
    cleartext: true
  }
};

export default config;
