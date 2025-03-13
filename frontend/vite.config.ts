import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
    }
  },
  server: {
    host: "0.0.0.0",
    port: 3000
  },
  css: {
    preprocessorOptions: {
      sass: {
        quietDeps: true
      }
    }
  }
})
