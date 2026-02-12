import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const isCapacitor = process.env.BUILD_TARGET === 'capacitor'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const ossBaseUrl = (env.VITE_OSS_BASE_URL || '').replace(/\/+$/, '')

  return {
    plugins: [vue()],
    server: {
      port: 3000,
      open: true,
      // 开发模式代理 OSS 请求，绕过 CORS（APK 不受影响）
      proxy: ossBaseUrl
        ? {
            '/oss-proxy': {
              target: ossBaseUrl,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/oss-proxy/, '')
            }
          }
        : {}
    },
    base: isCapacitor ? './' : '/duiyou/'
  }
})
