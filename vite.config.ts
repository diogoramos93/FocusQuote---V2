
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Essencial para rodar em pastas do cPanel
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild', // Usando o motor padrão mais rápido
  },
  esbuild: {
    drop: ['console', 'debugger'], // Limpa o código para produção
  },
});
