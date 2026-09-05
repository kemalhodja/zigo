import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = (process.env.CAPACITOR_SERVER_URL?.trim() || "https://zigo-kohl.vercel.app").replace(/\/$/, "");

const config: CapacitorConfig = {
  appId: "com.zigo.education",
  appName: "Zigo",
  webDir: "public",
  appendUserAgent: "Capacitor/ZigoApp",
  server: {
    cleartext: serverUrl.startsWith("http://"),
    url: serverUrl,
    allowNavigation: [
      serverUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      "*.vercel.app",
      "zigo-kohl.vercel.app",
    ],
    errorPath: "error.html",
  },
};

export default config;
