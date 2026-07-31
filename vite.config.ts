import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static SPA build. base './' keeps asset paths relative for easy static hosting.
export default defineConfig({
  base: './',
  plugins: [react()],
});
