import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // IMPORTANT: Permet l'accès depuis l'extérieur du conteneur
    port: 5173,
    watch: {
      usePolling: true  // Pour le hot reload avec Docker
    }
  }
})