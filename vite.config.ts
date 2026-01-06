import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // API 키를 빌드에 포함하지 않음 - 사용자가 직접 입력해야 함
    return {
      base: './', // Electron에서 상대 경로 사용
      server: {
        port: 5173, // Electron에서 참조하는 포트
        host: '0.0.0.0',
      },
      build: {
        outDir: 'dist',
        emptyOutDir: true,
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
