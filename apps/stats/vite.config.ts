import path from 'path';
import react from '@vitejs/plugin-react';
import { ConfigEnv } from 'vite';
import { defineConfig, loadEnv } from 'vite';

import svgr from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ command, mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // depending on your application, base can also be "/"
    base: '/',
    plugins: [
      svgr({
        include: '**/*.svg',
        svgrOptions: {
          ref: true,
        },
      }),
      viteTsconfigPaths(),
      react(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      // this ensures that the browser opens upon server start
      open: true,
      // this sets a default port to 3000
      port: 3000,
    },
    define: {
      'process.env': env,
      'process.version': JSON.stringify(''),
    },
  };
});
