// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// // https://vite.dev/config/
// export default defineConfig({
  
//   plugins: [react(),tailwindcss()],
// })
// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],

  server: {
    host: "0.0.0.0",
  },

  esbuild: mode === "production" ? {
    drop: ["console", "debugger"],
  } : {},
}))

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'
// import basicSsl from '@vitejs/plugin-basic-ssl'

// export default defineConfig(({ mode }) => ({
//   plugins: [
//     react(),
//     tailwindcss(),
//     basicSsl(),
//   ],
// server: {
//   host: "0.0.0.0",
//   https: true,

//   proxy: {
//     "http://192.168.0.101:4000/api": {
//       target: "http://192.168.0.101:4000",
//       changeOrigin: true,
//     },

//     "/socket.io": {
//       target: "http://192.168.0.101:4000",
//       ws: true,
//       changeOrigin: true,
//     },
//   },
// },

//   esbuild: mode === "production" ? {
//     drop: ["console", "debugger"],
//   } : {},
// }))
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// export default defineConfig(({ mode }) => ({
//   plugins: [react(), tailwindcss()],
//   esbuild: mode === "production" ? {
//     drop: ["console", "debugger"], // removes ALL console.* and debugger
//   } : {},
// }))
