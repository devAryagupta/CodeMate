import { defineConfig, defineWebExtConfig } from "wxt";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: () => ({
    plugins: [react(), tailwindcss()],
  }),
  manifest: {
    name: "CodeMate",
    description: "AI‐powered coding companion for LeetCode",
    version: "0.0.0",
    permissions: ["storage", "tabs", "activeTab"],
    host_permissions: ["http://localhost:3000/*", "*://leetcode.com/*"],
    web_accessible_resources: [
      { matches: ["*://leetcode.com/*"], resources: ["icon/*.png"] },
    ],
    action: {
      default_popup: "popup.html",
      default_icon: {
        "16": "icon/16.png",
        "32": "icon/32.png",
        "48": "icon/48.png",
        "96": "icon/96.png",
        "128": "icon/128.png",
      },
    },
  },
  devServer: {
    port: 5175,
  },
  webExt: defineWebExtConfig({
    binaries: {
      firefox: "/home/aryan/firefox/firefox",
    },
  }),
});
