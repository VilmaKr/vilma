import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import partytown from "@astrojs/partytown";

export default defineConfig({
  site: "https://macedonianwithvilma.com",
  integrations: [partytown()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr", "mk"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
});
