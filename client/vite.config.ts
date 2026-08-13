import path from "node:path";
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port: Number(process.env.CLIENT_PORT ?? 5173),
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    // Replit's proxied preview does not reliably forward Vite's HMR websocket.
    // Disable it so the preview uses stable HTTP requests without websocket errors.
    hmr: false,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${process.env.API_PORT ?? 5001}`,
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
    },
  },
  preview: {
    port: Number(process.env.CLIENT_PORT ?? 4173),
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
