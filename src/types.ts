export interface Provider {
  id?: string
  name: string
  model: string
  env: Record<string, string>
}

export interface ProviderSource {
  source: string
  detect: () => boolean
  list: () => Provider[] | Promise<Provider[]>
}

export interface ProvidersResult {
  providers: Provider[]
  source: string | null
}

export interface Terminal {
  name: string
  detect: () => boolean
  open: (cmd: string) => void
}

export interface ParsedFlags {
  newWindow: boolean
  help: boolean
  version: boolean
  reset: boolean
  yolo: boolean
}

export interface ParsedArgs {
  flags: ParsedFlags
  command: string | null
  query: string
}
