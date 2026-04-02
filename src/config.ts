import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CONFIG_DIR = join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'ccx')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

function ensureDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function load(): Record<string, unknown> {
  ensureDir()
  if (!existsSync(CONFIG_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function save(config: Record<string, unknown>) {
  ensureDir()
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n')
}

export function get(key: string): unknown {
  return load()[key]
}

export function set(key: string, value: unknown) {
  const config = load()
  config[key] = value
  save(config)
}

export function reset() {
  save({})
}

export const configDir = CONFIG_DIR
export const configFile = CONFIG_FILE
