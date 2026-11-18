import { resolve } from 'node:path'
import { defineConfig } from 'electron-vite'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    base: './',
    publicDir: resolve(__dirname, 'assets')
  }
})
