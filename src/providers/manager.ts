import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import type { Provider } from '../types.js'
import { getConfigBaseDir } from '../config.js'

interface ProvidersData {
  providers: Provider[]
}

const PROVIDERS_FILE = join(getConfigBaseDir(), 'providers.json')

function ensureFile() {
  const dir = dirname(PROVIDERS_FILE)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  if (!existsSync(PROVIDERS_FILE)) {
    writeFileSync(PROVIDERS_FILE, JSON.stringify({ providers: [] }, null, 2) + '\n')
  }
}

function load(): ProvidersData {
  ensureFile()
  return JSON.parse(readFileSync(PROVIDERS_FILE, 'utf-8'))
}

function save(data: ProvidersData) {
  ensureFile()
  writeFileSync(PROVIDERS_FILE, JSON.stringify(data, null, 2) + '\n')
}

export function getAll(): Provider[] {
  return load().providers || []
}

export function add(provider: Provider) {
  const data = load()
  data.providers = data.providers || []
  data.providers.push(provider)
  save(data)
}

export function remove(index: number) {
  const data = load()
  data.providers.splice(index, 1)
  save(data)
}

export function update(index: number, provider: Provider) {
  const data = load()
  data.providers[index] = provider
  save(data)
}

export const filePath = PROVIDERS_FILE
