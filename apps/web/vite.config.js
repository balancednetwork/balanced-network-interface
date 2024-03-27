import { lingui } from '@lingui/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig((command, mode) => {
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
      react({
        babel: {
          plugins: ['macros'],
        },
      }),
      nodePolyfills({
        include: ['buffer'],
        global: {
          Buffer: true,
          global: false,
          process: false,
        },
      }),
      lingui(),
    ],
    server: {
      // this ensures that the browser opens upon server start
      open: true,
      // this sets a default port to 3000
      port: 3000,
    },
    define: {
      'process.env': env,
    },
  };
});
