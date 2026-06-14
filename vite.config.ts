/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon-180x180.png", "maskable-icon-512x512.png"],
      manifest: {
        name: "Symptom Scribe",
        short_name: "Symptom Scribe",
        description: "AI-powered symptom checker and health tracker.",
        theme_color: "#22d3ee",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png"
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        navigateFallback: "/index.html",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    /**
     * Use jsdom to simulate a browser DOM environment, which is required for
     * React Testing Library to render components and query the DOM.
     */
    environment: "jsdom",
    /**
     * Run the global setup file before each test suite. This file extends
     * Vitest's `expect` with `@testing-library/jest-dom` matchers.
     */
    setupFiles: ["./src/test/setup.ts"],
    /**
     * Make Vitest globals (describe, it, expect, vi, etc.) available in every
     * test file without explicit imports.
     */
    globals: true,
    /**
     * Collect test coverage from source files (excluding config, types, and
     * test files themselves). Run `npm run test:coverage` to generate a report.
     */
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/vite-env.d.ts",
        "src/main.tsx",
      ],
      reporter: ["text", "html"],
    },
  },
}));
