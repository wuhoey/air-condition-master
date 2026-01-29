// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  // 必須與您的 GitHub 專案名稱一致，前後都要有斜線
  base: '/air-condition-master/', 
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false, // 如果端口被占用，尝试其他端口
  },
})
