import { defineConfig } from "vite";

// GitHub Pages serves the demo under /pwa-install-assistant/.
export default defineConfig({
  base: process.env.PAGES_BASE ?? "/",
});
