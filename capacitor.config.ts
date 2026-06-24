import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL || undefined;

const config: CapacitorConfig = {
  appId: "com.zigo.education",
  appName: "Zigo",
  webDir: "public",
  ...(serverUrl
    ? {
        server: {
          cleartext: serverUrl.startsWith("http://"),
          url: serverUrl,
        },
      }
    : {}),
};

export default config;
