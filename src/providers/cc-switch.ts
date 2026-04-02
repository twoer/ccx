import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Provider } from '../types.js'

const DB_PATH = join(homedir(), '.cc-switch', 'cc-switch.db')

export function detect(): boolean {
  return existsSync(DB_PATH)
}

export async function list(): Promise<Provider[]> {
  const Database = (await import('better-sqlite3')).default
  const db = new Database(DB_PATH, { readonly: true })

  try {
    const rows = db.prepare(`
      SELECT id, name, json_extract(settings_config, '$.env.ANTHROPIC_MODEL') as model,
             json_extract(settings_config, '$.env') as env
      FROM providers
      WHERE app_type = 'claude' AND settings_config LIKE '%"env"%'
      ORDER BY sort_index
    `).all() as { id: string; name: string; model: string; env: string }[]

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      model: row.model || 'unknown',
      env: JSON.parse(row.env || '{}'),
    }))
  } finally {
    db.close()
  }
}

export const source = 'cc-switch'
