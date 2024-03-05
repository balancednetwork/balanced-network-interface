import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from "vite-plugin-svgr";
import { lingui } from "@lingui/vite-plugin";

export default defineConfig((command, mode) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // depending on your application, base can also be "/"
    base: '/',
    plugins: [
      svgr({
        include: "**/*.svg",
      }),
      viteTsconfigPaths(),
      react({
        babel: {
          plugins: [
            "macros",
          ]
        }
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
      'process.env': env
    }
  }
});
