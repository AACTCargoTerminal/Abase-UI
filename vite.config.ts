import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // ← 이거 중요. true 또는 '0.0.0.0'
    port: 3000, // 너 쓰는 포트
  },
});
