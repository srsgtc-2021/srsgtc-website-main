import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    ssr: 'src/entry-server.jsx',
    outDir: 'dist-ssr',
    emptyOutDir: true,
    target: 'node18',
    rollupOptions: {
      output: {
        entryFileNames: 'entry-server.js',
      },
    },
  },
});
