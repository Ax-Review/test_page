import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/test-page/', // GitHub 저장소 이름에 맞게 수정하세요
})
