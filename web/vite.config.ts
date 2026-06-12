import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// MapRaiders Web Observer Cockpit is served under mapraiders.com/play
export default defineConfig({
  base: '/play/',
  plugins: [react()],
  server: {
    port: 5174,
  },
});
