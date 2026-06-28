// vite.config.ts
import { defineConfig } from "file:///C:/Users/param/Downloads/gssoc/symptom-scribe-clean/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/param/Downloads/gssoc/symptom-scribe-clean/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/param/Downloads/gssoc/symptom-scribe-clean/node_modules/lovable-tagger/dist/index.js";
import { VitePWA } from "file:///C:/Users/param/Downloads/gssoc/symptom-scribe-clean/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\param\\Downloads\\gssoc\\symptom-scribe-clean";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
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
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        navigateFallback: "/index.html"
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
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
        "src/main.tsx"
      ],
      reporter: ["text", "html"]
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwYXJhbVxcXFxEb3dubG9hZHNcXFxcZ3Nzb2NcXFxcc3ltcHRvbS1zY3JpYmUtY2xlYW5cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHBhcmFtXFxcXERvd25sb2Fkc1xcXFxnc3NvY1xcXFxzeW1wdG9tLXNjcmliZS1jbGVhblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvcGFyYW0vRG93bmxvYWRzL2dzc29jL3N5bXB0b20tc2NyaWJlLWNsZWFuL3ZpdGUuY29uZmlnLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSBcInZpdGUtcGx1Z2luLXB3YVwiO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogXCI6OlwiLFxuICAgIHBvcnQ6IDgwODAsXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKSxcbiAgICBWaXRlUFdBKHtcbiAgICAgIHJlZ2lzdGVyVHlwZTogXCJhdXRvVXBkYXRlXCIsXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbXCJmYXZpY29uLnN2Z1wiLCBcImFwcGxlLXRvdWNoLWljb24tMTgweDE4MC5wbmdcIiwgXCJtYXNrYWJsZS1pY29uLTUxMng1MTIucG5nXCJdLFxuICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgbmFtZTogXCJTeW1wdG9tIFNjcmliZVwiLFxuICAgICAgICBzaG9ydF9uYW1lOiBcIlN5bXB0b20gU2NyaWJlXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIkFJLXBvd2VyZWQgc3ltcHRvbSBjaGVja2VyIGFuZCBoZWFsdGggdHJhY2tlci5cIixcbiAgICAgICAgdGhlbWVfY29sb3I6IFwiIzIyZDNlZVwiLFxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiMwZjE3MmFcIixcbiAgICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXG4gICAgICAgIHN0YXJ0X3VybDogXCIvXCIsXG4gICAgICAgIGljb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBcInB3YS02NHg2NC5wbmdcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjY0eDY0XCIsXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IFwicHdhLTE5MngxOTIucG5nXCIsXG4gICAgICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IFwicHdhLTUxMng1MTIucG5nXCIsXG4gICAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IFwibWFza2FibGUtaWNvbi01MTJ4NTEyLnBuZ1wiLFxuICAgICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICAgIHB1cnBvc2U6IFwibWFza2FibGVcIlxuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB3b3JrYm94OiB7XG4gICAgICAgIGdsb2JQYXR0ZXJuczogW1wiKiovKi57anMsY3NzLGh0bWwsaWNvLHBuZyxzdmd9XCJdLFxuICAgICAgICBuYXZpZ2F0ZUZhbGxiYWNrOiBcIi9pbmRleC5odG1sXCIsXG4gICAgICB9LFxuICAgIH0pLFxuICBdLmZpbHRlcihCb29sZWFuKSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuICB0ZXN0OiB7XG4gICAgLyoqXG4gICAgICogVXNlIGpzZG9tIHRvIHNpbXVsYXRlIGEgYnJvd3NlciBET00gZW52aXJvbm1lbnQsIHdoaWNoIGlzIHJlcXVpcmVkIGZvclxuICAgICAqIFJlYWN0IFRlc3RpbmcgTGlicmFyeSB0byByZW5kZXIgY29tcG9uZW50cyBhbmQgcXVlcnkgdGhlIERPTS5cbiAgICAgKi9cbiAgICBlbnZpcm9ubWVudDogXCJqc2RvbVwiLFxuICAgIC8qKlxuICAgICAqIFJ1biB0aGUgZ2xvYmFsIHNldHVwIGZpbGUgYmVmb3JlIGVhY2ggdGVzdCBzdWl0ZS4gVGhpcyBmaWxlIGV4dGVuZHNcbiAgICAgKiBWaXRlc3QncyBgZXhwZWN0YCB3aXRoIGBAdGVzdGluZy1saWJyYXJ5L2plc3QtZG9tYCBtYXRjaGVycy5cbiAgICAgKi9cbiAgICBzZXR1cEZpbGVzOiBbXCIuL3NyYy90ZXN0L3NldHVwLnRzXCJdLFxuICAgIC8qKlxuICAgICAqIE1ha2UgVml0ZXN0IGdsb2JhbHMgKGRlc2NyaWJlLCBpdCwgZXhwZWN0LCB2aSwgZXRjLikgYXZhaWxhYmxlIGluIGV2ZXJ5XG4gICAgICogdGVzdCBmaWxlIHdpdGhvdXQgZXhwbGljaXQgaW1wb3J0cy5cbiAgICAgKi9cbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIC8qKlxuICAgICAqIENvbGxlY3QgdGVzdCBjb3ZlcmFnZSBmcm9tIHNvdXJjZSBmaWxlcyAoZXhjbHVkaW5nIGNvbmZpZywgdHlwZXMsIGFuZFxuICAgICAqIHRlc3QgZmlsZXMgdGhlbXNlbHZlcykuIFJ1biBgbnBtIHJ1biB0ZXN0OmNvdmVyYWdlYCB0byBnZW5lcmF0ZSBhIHJlcG9ydC5cbiAgICAgKi9cbiAgICBjb3ZlcmFnZToge1xuICAgICAgcHJvdmlkZXI6IFwidjhcIixcbiAgICAgIGluY2x1ZGU6IFtcInNyYy8qKi8qLnt0cyx0c3h9XCJdLFxuICAgICAgZXhjbHVkZTogW1xuICAgICAgICBcInNyYy8qKi8qLnRlc3Que3RzLHRzeH1cIixcbiAgICAgICAgXCJzcmMvdGVzdC8qKlwiLFxuICAgICAgICBcInNyYy92aXRlLWVudi5kLnRzXCIsXG4gICAgICAgIFwic3JjL21haW4udHN4XCIsXG4gICAgICBdLFxuICAgICAgcmVwb3J0ZXI6IFtcInRleHRcIiwgXCJodG1sXCJdLFxuICAgIH0sXG4gIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLGVBQWU7QUFMeEIsSUFBTSxtQ0FBbUM7QUFRekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUEsSUFDMUMsUUFBUTtBQUFBLE1BQ04sY0FBYztBQUFBLE1BQ2QsZUFBZSxDQUFDLGVBQWUsZ0NBQWdDLDJCQUEyQjtBQUFBLE1BQzFGLFVBQVU7QUFBQSxRQUNSLE1BQU07QUFBQSxRQUNOLFlBQVk7QUFBQSxRQUNaLGFBQWE7QUFBQSxRQUNiLGFBQWE7QUFBQSxRQUNiLGtCQUFrQjtBQUFBLFFBQ2xCLFNBQVM7QUFBQSxRQUNULFdBQVc7QUFBQSxRQUNYLE9BQU87QUFBQSxVQUNMO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsVUFDUjtBQUFBLFVBQ0E7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsWUFDTixTQUFTO0FBQUEsVUFDWDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxTQUFTO0FBQUEsUUFDUCxjQUFjLENBQUMsZ0NBQWdDO0FBQUEsUUFDL0Msa0JBQWtCO0FBQUEsTUFDcEI7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNILEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsTUFBTTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFLSixhQUFhO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtiLFlBQVksQ0FBQyxxQkFBcUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBS2xDLFNBQVM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBS1QsVUFBVTtBQUFBLE1BQ1IsVUFBVTtBQUFBLE1BQ1YsU0FBUyxDQUFDLG1CQUFtQjtBQUFBLE1BQzdCLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsVUFBVSxDQUFDLFFBQVEsTUFBTTtBQUFBLElBQzNCO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
