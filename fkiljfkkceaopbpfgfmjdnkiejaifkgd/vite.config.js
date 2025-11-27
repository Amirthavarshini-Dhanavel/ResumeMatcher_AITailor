import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "firebase-init.js",
      formats: ["es"],
      fileName: () => "firebase-bundle.js",
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
