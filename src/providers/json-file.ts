import { existsSync, readFileSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { join } from 'node:path'
import type { Provider } from '../types.js'

function getConfigBaseDir(): string {
  if (platform() === 'win32') {
    return join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'ccx')
  }
  return join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'ccx')
}

const PROVIDERS_FILE = join(getConfigBaseDir(), 'providers.json')

export function detect(): boolean {
  return existsSync(PROVIDERS_FILE)
}

export function list(): Provider[] {
  const data = JSON.parse(readFileSync(PROVIDERS_FILE, 'utf-8'))
  const providers = data.providers || []

  return providers.map((p: Provider, i: number) => ({
    id: `json:${i}`,
    name: p.name,
    model: p.model || p.env?.ANTHROPIC_MODEL || 'unknown',
    env: p.env || {},
  }))
}

export const source = 'json'
export const filePath = PROVIDERS_FILE
