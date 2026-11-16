import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base must match the GitHub Pages repo path
export default defineConfig({
  base: "/startle-dreams/",
  plugins: [react()],
  build: { outDir: "build", chunkSizeWarningLimit: 1000 }, // firebase is large
});
