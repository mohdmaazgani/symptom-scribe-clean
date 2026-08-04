// vite.config.ts
import { defineConfig } from "file:///C:/Users/KIIT0001/symptom-scribe-clean/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/KIIT0001/symptom-scribe-clean/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/KIIT0001/symptom-scribe-clean/node_modules/lovable-tagger/dist/index.js";
import { VitePWA } from "file:///C:/Users/KIIT0001/symptom-scribe-clean/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\KIIT0001\\symptom-scribe-clean";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxLSUlUMDAwMVxcXFxzeW1wdG9tLXNjcmliZS1jbGVhblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcS0lJVDAwMDFcXFxcc3ltcHRvbS1zY3JpYmUtY2xlYW5cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0tJSVQwMDAxL3N5bXB0b20tc2NyaWJlLWNsZWFuL3ZpdGUuY29uZmlnLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcclxuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiBcIjo6XCIsXHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gIH0sXHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3QoKSxcclxuICAgIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKSxcclxuICAgIFZpdGVQV0Eoe1xyXG4gICAgICByZWdpc3RlclR5cGU6IFwiYXV0b1VwZGF0ZVwiLFxyXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbXCJmYXZpY29uLnN2Z1wiLCBcImFwcGxlLXRvdWNoLWljb24tMTgweDE4MC5wbmdcIiwgXCJtYXNrYWJsZS1pY29uLTUxMng1MTIucG5nXCJdLFxyXG4gICAgICBtYW5pZmVzdDoge1xyXG4gICAgICAgIG5hbWU6IFwiU3ltcHRvbSBTY3JpYmVcIixcclxuICAgICAgICBzaG9ydF9uYW1lOiBcIlN5bXB0b20gU2NyaWJlXCIsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiQUktcG93ZXJlZCBzeW1wdG9tIGNoZWNrZXIgYW5kIGhlYWx0aCB0cmFja2VyLlwiLFxyXG4gICAgICAgIHRoZW1lX2NvbG9yOiBcIiMyMmQzZWVcIixcclxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiMwZjE3MmFcIixcclxuICAgICAgICBkaXNwbGF5OiBcInN0YW5kYWxvbmVcIixcclxuICAgICAgICBzdGFydF91cmw6IFwiL1wiLFxyXG4gICAgICAgIGljb25zOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogXCJwd2EtNjR4NjQucG5nXCIsXHJcbiAgICAgICAgICAgIHNpemVzOiBcIjY0eDY0XCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCJcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogXCJwd2EtMTkyeDE5Mi5wbmdcIixcclxuICAgICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6IFwicHdhLTUxMng1MTIucG5nXCIsXHJcbiAgICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcclxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIlxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiBcIm1hc2thYmxlLWljb24tNTEyeDUxMi5wbmdcIixcclxuICAgICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICBwdXJwb3NlOiBcIm1hc2thYmxlXCJcclxuICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICB9LFxyXG4gICAgICB3b3JrYm94OiB7XHJcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbXCIqKi8qLntqcyxjc3MsaHRtbCxpY28scG5nLHN2Z31cIl0sXHJcbiAgICAgICAgbmF2aWdhdGVGYWxsYmFjazogXCIvaW5kZXguaHRtbFwiLFxyXG4gICAgICB9LFxyXG4gICAgfSksXHJcbiAgXS5maWx0ZXIoQm9vbGVhbiksXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgdGVzdDoge1xyXG4gICAgLyoqXHJcbiAgICAgKiBVc2UganNkb20gdG8gc2ltdWxhdGUgYSBicm93c2VyIERPTSBlbnZpcm9ubWVudCwgd2hpY2ggaXMgcmVxdWlyZWQgZm9yXHJcbiAgICAgKiBSZWFjdCBUZXN0aW5nIExpYnJhcnkgdG8gcmVuZGVyIGNvbXBvbmVudHMgYW5kIHF1ZXJ5IHRoZSBET00uXHJcbiAgICAgKi9cclxuICAgIGVudmlyb25tZW50OiBcImpzZG9tXCIsXHJcbiAgICAvKipcclxuICAgICAqIFJ1biB0aGUgZ2xvYmFsIHNldHVwIGZpbGUgYmVmb3JlIGVhY2ggdGVzdCBzdWl0ZS4gVGhpcyBmaWxlIGV4dGVuZHNcclxuICAgICAqIFZpdGVzdCdzIGBleHBlY3RgIHdpdGggYEB0ZXN0aW5nLWxpYnJhcnkvamVzdC1kb21gIG1hdGNoZXJzLlxyXG4gICAgICovXHJcbiAgICBzZXR1cEZpbGVzOiBbXCIuL3NyYy90ZXN0L3NldHVwLnRzXCJdLFxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWtlIFZpdGVzdCBnbG9iYWxzIChkZXNjcmliZSwgaXQsIGV4cGVjdCwgdmksIGV0Yy4pIGF2YWlsYWJsZSBpbiBldmVyeVxyXG4gICAgICogdGVzdCBmaWxlIHdpdGhvdXQgZXhwbGljaXQgaW1wb3J0cy5cclxuICAgICAqL1xyXG4gICAgZ2xvYmFsczogdHJ1ZSxcclxuICAgIC8qKlxyXG4gICAgICogQ29sbGVjdCB0ZXN0IGNvdmVyYWdlIGZyb20gc291cmNlIGZpbGVzIChleGNsdWRpbmcgY29uZmlnLCB0eXBlcywgYW5kXHJcbiAgICAgKiB0ZXN0IGZpbGVzIHRoZW1zZWx2ZXMpLiBSdW4gYG5wbSBydW4gdGVzdDpjb3ZlcmFnZWAgdG8gZ2VuZXJhdGUgYSByZXBvcnQuXHJcbiAgICAgKi9cclxuICAgIGNvdmVyYWdlOiB7XHJcbiAgICAgIHByb3ZpZGVyOiBcInY4XCIsXHJcbiAgICAgIGluY2x1ZGU6IFtcInNyYy8qKi8qLnt0cyx0c3h9XCJdLFxyXG4gICAgICBleGNsdWRlOiBbXHJcbiAgICAgICAgXCJzcmMvKiovKi50ZXN0Lnt0cyx0c3h9XCIsXHJcbiAgICAgICAgXCJzcmMvdGVzdC8qKlwiLFxyXG4gICAgICAgIFwic3JjL3ZpdGUtZW52LmQudHNcIixcclxuICAgICAgICBcInNyYy9tYWluLnRzeFwiLFxyXG4gICAgICBdLFxyXG4gICAgICByZXBvcnRlcjogW1widGV4dFwiLCBcImh0bWxcIl0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pKTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxlQUFlO0FBTHhCLElBQU0sbUNBQW1DO0FBUXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFNBQVMsaUJBQWlCLGdCQUFnQjtBQUFBLElBQzFDLFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLGVBQWUsQ0FBQyxlQUFlLGdDQUFnQywyQkFBMkI7QUFBQSxNQUMxRixVQUFVO0FBQUEsUUFDUixNQUFNO0FBQUEsUUFDTixZQUFZO0FBQUEsUUFDWixhQUFhO0FBQUEsUUFDYixhQUFhO0FBQUEsUUFDYixrQkFBa0I7QUFBQSxRQUNsQixTQUFTO0FBQUEsUUFDVCxXQUFXO0FBQUEsUUFDWCxPQUFPO0FBQUEsVUFDTDtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsVUFDUjtBQUFBLFVBQ0E7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFlBQ04sU0FBUztBQUFBLFVBQ1g7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsU0FBUztBQUFBLFFBQ1AsY0FBYyxDQUFDLGdDQUFnQztBQUFBLFFBQy9DLGtCQUFrQjtBQUFBLE1BQ3BCO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSCxFQUFFLE9BQU8sT0FBTztBQUFBLEVBQ2hCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBS0osYUFBYTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFLYixZQUFZLENBQUMscUJBQXFCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtsQyxTQUFTO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtULFVBQVU7QUFBQSxNQUNSLFVBQVU7QUFBQSxNQUNWLFNBQVMsQ0FBQyxtQkFBbUI7QUFBQSxNQUM3QixTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFVBQVUsQ0FBQyxRQUFRLE1BQU07QUFBQSxJQUMzQjtBQUFBLEVBQ0Y7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
