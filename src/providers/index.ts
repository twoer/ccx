import * as ccSwitch from './cc-switch.js'
import * as jsonFile from './json-file.js'
import type { ProviderSource, ProvidersResult } from '../types.js'

const sources: ProviderSource[] = [ccSwitch, jsonFile]

export async function loadProviders(): Promise<ProvidersResult> {
  for (const source of sources) {
    if (source.detect()) {
      try {
        const providers = await source.list()
        if (providers.length > 0) {
          return { providers, source: source.source }
        }
      } catch {
        // Try next source
      }
    }
  }
  return { providers: [], source: null }
}
