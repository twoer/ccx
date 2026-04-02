import { intro, outro, select, text, confirm, cancel, isCancel, log, note } from '@clack/prompts'
import pc from 'picocolors'
import * as manager from './providers/manager.js'
import { loadProviders } from './providers/index.js'

function guard<T>(result: T | symbol): T {
  if (isCancel(result)) {
    cancel('Cancelled')
    process.exit(0)
  }
  return result as T
}

// ── cc-run list ────────────────────────────────────────────

export async function list() {
  intro(pc.cyan(pc.bold('⚡ cc-run list')))

  const { providers, source } = await loadProviders()

  if (providers.length === 0) {
    log.warn('No providers found')
    outro(pc.dim('Run `cc-run add` to add one'))
    return
  }

  log.message(pc.dim(`${providers.length} providers from ${source}`))

  const lines = providers.map((p, i) => {
    const idx = pc.dim(`${String(i + 1).padStart(2)}.`)
    const name = pc.bold(p.name)
    const model = pc.dim(p.model)
    const url = pc.dim(p.env?.ANTHROPIC_BASE_URL || '')
    return `${idx} ${name}  ${model}\n      ${url}`
  })

  note(lines.join('\n'), 'Providers')
  outro(pc.dim(`Config: ${manager.filePath}`))
}

// ── cc-run add ─────────────────────────────────────────────

export async function add() {
  intro(pc.cyan(pc.bold('⚡ cc-run add')))

  const name = guard(await text({
    message: 'Provider name',
    placeholder: 'e.g. Zhipu GLM-5.1',
    validate: (v) => v.trim() ? undefined : 'Name is required',
  }))

  const baseUrl = guard(await text({
    message: 'API base URL',
    placeholder: 'e.g. https://open.bigmodel.cn/api/anthropic',
    validate: (v) => v.trim() ? undefined : 'URL is required',
  }))

  const authToken = guard(await text({
    message: 'API key / Auth token',
    placeholder: 'sk-xxx or your-api-key',
    validate: (v) => v.trim() ? undefined : 'Token is required',
  }))

  const model = guard(await text({
    message: 'Model name',
    placeholder: 'e.g. glm-5.1, claude-sonnet-4-20250514',
    validate: (v) => v.trim() ? undefined : 'Model is required',
  }))

  const fillAll = guard(await confirm({
    message: 'Set this model for all roles (Sonnet/Opus/Haiku)?',
    initialValue: true,
  }))

  const env: Record<string, string> = {
    ANTHROPIC_BASE_URL: baseUrl.trim(),
    ANTHROPIC_AUTH_TOKEN: authToken.trim(),
    ANTHROPIC_MODEL: model.trim(),
  }

  if (fillAll) {
    env.ANTHROPIC_DEFAULT_SONNET_MODEL = model.trim()
    env.ANTHROPIC_DEFAULT_OPUS_MODEL = model.trim()
    env.ANTHROPIC_DEFAULT_HAIKU_MODEL = model.trim()
    env.ANTHROPIC_REASONING_MODEL = model.trim()
  }

  const provider = {
    name: name.trim(),
    model: model.trim(),
    env,
  }

  note(
    [
      `${pc.bold('Name:')}  ${provider.name}`,
      `${pc.bold('Model:')} ${provider.model}`,
      `${pc.bold('URL:')}   ${env.ANTHROPIC_BASE_URL}`,
      `${pc.bold('Key:')}   ${env.ANTHROPIC_AUTH_TOKEN.slice(0, 8)}${'*'.repeat(8)}`,
    ].join('\n'),
    'Review',
  )

  const ok = guard(await confirm({ message: 'Add this provider?' }))

  if (!ok) {
    cancel('Cancelled')
    return
  }

  manager.add(provider)
  outro(pc.green('✔') + ` Added ${pc.bold(provider.name)}`)
}

// ── cc-run rm ──────────────────────────────────────────────

export async function rm() {
  intro(pc.cyan(pc.bold('⚡ cc-run rm')))

  const providers = manager.getAll()

  if (providers.length === 0) {
    log.warn('No providers in JSON config')
    outro(pc.dim('Nothing to remove'))
    return
  }

  const result = guard(await select({
    message: 'Remove which provider?',
    options: providers.map((p, i) => ({
      value: i,
      label: p.name,
      hint: pc.dim(p.model || p.env?.ANTHROPIC_MODEL || ''),
    })),
  }))

  const target = providers[result]

  const ok = guard(await confirm({
    message: `Remove ${pc.bold(target.name)}?`,
    initialValue: false,
  }))

  if (!ok) {
    cancel('Cancelled')
    return
  }

  manager.remove(result)
  outro(pc.green('✔') + ` Removed ${pc.bold(target.name)}`)
}

// ── cc-run edit ────────────────────────────────────────────

export async function edit() {
  intro(pc.cyan(pc.bold('⚡ cc-run edit')))

  const providers = manager.getAll()

  if (providers.length === 0) {
    log.warn('No providers in JSON config')
    outro(pc.dim('Run `cc-run add` to add one'))
    return
  }

  const index = guard(await select({
    message: 'Edit which provider?',
    options: providers.map((p, i) => ({
      value: i,
      label: p.name,
      hint: pc.dim(p.model || p.env?.ANTHROPIC_MODEL || ''),
    })),
  }))

  const current = providers[index]
  const env = current.env || {}

  const name = guard(await text({
    message: 'Provider name',
    initialValue: current.name,
    validate: (v) => v.trim() ? undefined : 'Name is required',
  }))

  const baseUrl = guard(await text({
    message: 'API base URL',
    initialValue: env.ANTHROPIC_BASE_URL || '',
    validate: (v) => v.trim() ? undefined : 'URL is required',
  }))

  const authToken = guard(await text({
    message: 'API key / Auth token',
    initialValue: env.ANTHROPIC_AUTH_TOKEN || '',
    validate: (v) => v.trim() ? undefined : 'Token is required',
  }))

  const model = guard(await text({
    message: 'Model name',
    initialValue: env.ANTHROPIC_MODEL || current.model || '',
    validate: (v) => v.trim() ? undefined : 'Model is required',
  }))

  const fillAll = guard(await confirm({
    message: 'Set this model for all roles (Sonnet/Opus/Haiku)?',
    initialValue: true,
  }))

  const newEnv: Record<string, string> = {
    ANTHROPIC_BASE_URL: baseUrl.trim(),
    ANTHROPIC_AUTH_TOKEN: authToken.trim(),
    ANTHROPIC_MODEL: model.trim(),
  }

  if (fillAll) {
    newEnv.ANTHROPIC_DEFAULT_SONNET_MODEL = model.trim()
    newEnv.ANTHROPIC_DEFAULT_OPUS_MODEL = model.trim()
    newEnv.ANTHROPIC_DEFAULT_HAIKU_MODEL = model.trim()
    newEnv.ANTHROPIC_REASONING_MODEL = model.trim()
  }

  const updated = {
    name: name.trim(),
    model: model.trim(),
    env: newEnv,
  }

  manager.update(index, updated)
  outro(pc.green('✔') + ` Updated ${pc.bold(updated.name)}`)
}
