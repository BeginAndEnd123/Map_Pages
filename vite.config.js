/**
 * Vite 构建配置 — GitHub Pages 静态部署
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/Map_Pages/',
  plugins: [vue()],
  server: {
    port: 5173,
  },
})
