import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim() || undefined;

const config: CapacitorConfig = {
  appId: "com.zigo.education",
  appName: "Zigo",
  webDir: "public",
  ...(serverUrl
    ? {
        server: {
          cleartext: serverUrl.startsWith("http://"),
          url: serverUrl,
          allowNavigation: [serverUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""), "*.vercel.app"],
        },
      }
    : {}),
};

export default config;
