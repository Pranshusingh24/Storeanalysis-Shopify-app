import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals({ nativeFetch: true });

// Extract host from Shopify tunnel environment variable if provided by CLI
const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost").hostname;
const isTunnel =
  host.includes("trycloudflare.com") ||
  host.includes("ngrok") ||
  host.includes("spin.dev");

let hmrConfig;
if (!isTunnel) {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: parseInt(process.env.FRONTEND_PORT || "8002", 10),
    clientPort: 443,
  };
}

export default defineConfig({
  server: {
    allowedHosts: [
      host,
      "localhost",
      "127.0.0.1",
      ".trycloudflare.com",
      ".ngrok-free.app",
      ".spin.dev",
    ],
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
  },
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
        v3_singleFetch: true,
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    assetsInlineLimit: 0,
  },
});
