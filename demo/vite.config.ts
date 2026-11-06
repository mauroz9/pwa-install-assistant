import { resolve } from "node:path";
import { defineConfig } from "vite";

// GitHub Pages serves the demo under /pwa-install-assistant/.
export default defineConfig({
  base: process.env.PAGES_BASE ?? "/",
  build: {
    rolldownOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        device: resolve(__dirname, "device.html"),
        csp: resolve(__dirname, "csp.html"),
      },
    },
  },
});
