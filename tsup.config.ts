import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'bin/ccx': 'src/bin.ts',
  },
  format: 'esm',
  target: 'node18',
  platform: 'node',
  splitting: false,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: ['better-sqlite3'],
})
