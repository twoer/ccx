import { intro, outro, select, cancel, isCancel, log } from '@clack/prompts'
import pc from 'picocolors'
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir, platform } from 'node:os'
import { spawn } from 'node:child_process'
import { loadProviders } from './providers/index.js'
import { detectTerminals, getTerminal } from './terminals/index.js'
import * as config from './config.js'
import * as commands from './commands.js'
import type { ParsedArgs, ParsedFlags, Terminal } from './types.js'

const VERSION = '0.2.0'

const SUBCOMMANDS = ['list', 'ls', 'add', 'rm', 'remove', 'edit', 'help']

function parseArgs(argv: string[]): ParsedArgs {
  const flags: ParsedFlags = { newWindow: false, help: false, version: false, reset: false, yolo: false }
  let command: string | null = null
  let query = ''

  for (const arg of argv) {
    switch (arg) {
      case '--new': case '-n': flags.newWindow = true; break
      case '--yes': case '-y': flags.yolo = true; break
      case '--help': case '-h': flags.help = true; break
      case '--version': case '-v': flags.version = true; break
      case '--reset': flags.reset = true; break
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`)
          process.exit(1)
        }
        if (!command && SUBCOMMANDS.includes(arg)) {
          command = arg
        } else {
          query = arg
        }
    }
  }

  return { flags, command, query }
}

function showHelp() {
  console.log(`
  ${pc.cyan(pc.bold('⚡ cc-run'))} ${pc.dim(`v${VERSION}`)}
  ${pc.dim('Claude Code launcher')}

  ${pc.bold('Usage:')} cc-run [command] [options] [provider-name]

  ${pc.bold('Commands:')}
    ${pc.cyan('list')}, ${pc.cyan('ls')}     List all providers
    ${pc.cyan('add')}           Add a new provider
    ${pc.cyan('edit')}          Edit an existing provider
    ${pc.cyan('rm')}            Remove a provider

  ${pc.bold('Options:')}
    ${pc.cyan('-n')}, ${pc.cyan('--new')}      Open in a new terminal window
    ${pc.cyan('-y')}, ${pc.cyan('--yes')}      Skip permissions (dangerously)
    ${pc.cyan('-h')}, ${pc.cyan('--help')}     Show this help
    ${pc.cyan('-v')}, ${pc.cyan('--version')}  Show version
    ${pc.cyan('--reset')}        Reset all configuration

  ${pc.bold('Examples:')}
    ${pc.dim('$')} cc-run              ${pc.dim('# Interactive select, current terminal')}
    ${pc.dim('$')} cc-run glm          ${pc.dim('# Fuzzy match provider name')}
    ${pc.dim('$')} cc-run --new        ${pc.dim('# Interactive select, new window')}
    ${pc.dim('$')} cc-run add          ${pc.dim('# Add a new provider')}
    ${pc.dim('$')} cc-run list         ${pc.dim('# List all providers')}
    ${pc.dim('$')} cc-run edit         ${pc.dim('# Edit a provider')}
    ${pc.dim('$')} cc-run rm           ${pc.dim('# Remove a provider')}

  ${pc.bold('Providers:')}
    ${pc.cyan('cc-switch')}  ${pc.dim('auto-detected from cc-switch.db')}
    ${pc.cyan('JSON file')}  ${pc.dim(`configure at ${config.configDir}/providers.json`)}

  ${pc.bold('Config:')} ${pc.dim(config.configFile)}
`)
}

function writeTempSettings(env: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'cc-run-'))
  const file = join(dir, 'settings.json')
  writeFileSync(file, JSON.stringify({ env }, null, 2))
  return file
}

async function selectTerminal(): Promise<Terminal> {
  const saved = config.get('terminal') as string | undefined
  if (saved) {
    const t = getTerminal(saved)
    if (t) return t
  }

  const available = detectTerminals()
  if (available.length === 1) {
    config.set('terminal', available[0].name)
    return available[0]
  }

  const result = await select({
    message: 'Select default terminal for new windows',
    options: available.map(t => ({ value: t.name, label: t.name })),
  })

  if (isCancel(result)) {
    cancel('Cancelled')
    process.exit(0)
  }

  config.set('terminal', result)
  return getTerminal(result as string)!
}

export async function run(argv: string[]) {
  const { flags, command, query } = parseArgs(argv)

  if (flags.version) {
    console.log(`cc-run ${VERSION}`)
    return
  }

  if (flags.help) {
    showHelp()
    return
  }

  if (flags.reset) {
    config.reset()
    log.success('Config reset')
    return
  }

  // Handle subcommands
  if (command) {
    switch (command) {
      case 'help': showHelp(); return
      case 'list': case 'ls': return commands.list()
      case 'add': return commands.add()
      case 'rm': case 'remove': return commands.rm()
      case 'edit': return commands.edit()
    }
  }

  // Default: launch claude
  intro(`${pc.cyan(pc.bold('⚡ cc-run'))} ${pc.dim('— Claude Code eXecutor')}`)
  const { providers, source } = await loadProviders()
  log.message(
    pc.dim(`${providers.length} providers from ${source || 'none'} · v${VERSION}\n`) +
    pc.dim(`  cc-run ${pc.cyan('add')}   Add provider    cc-run ${pc.cyan('edit')}  Edit provider\n`) +
    pc.dim(`  cc-run ${pc.cyan('list')}  List providers   cc-run ${pc.cyan('rm')}    Remove provider\n`) +
    pc.dim(`  cc-run ${pc.cyan('-n')}    New window       cc-run ${pc.cyan('help')}  Show help`),
  )

  if (providers.length === 0) {
    log.error('No providers found')
    log.message('')
    log.message(`  ${pc.cyan('1.')} Run ${pc.bold('cc-run add')} to add a provider`)
    log.message(`  ${pc.cyan('2.')} Or install ${pc.bold('cc-switch')} for auto-detection`)
    log.message('')
    cancel('Setup a provider first')
    return
  }

  // Select provider
  let selected

  if (query) {
    const lowerQuery = query.toLowerCase()
    selected = providers.find(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.model.toLowerCase().includes(lowerQuery),
    )

    if (!selected) {
      log.warn(`No match for "${query}"`)
    }
  }

  if (!selected) {
    const result = await select({
      message: 'Select provider',
      options: providers.map(p => ({
        value: p.id,
        label: p.name,
        hint: pc.dim(p.model),
      })),
    })

    if (isCancel(result)) {
      cancel('Cancelled')
      process.exit(0)
    }

    selected = providers.find(p => p.id === result)
  }

  // Write temp settings
  const settingsFile = writeTempSettings(selected!.env)
  const yoloFlag = flags.yolo ? ' --dangerously-skip-permissions' : ''

  if (flags.newWindow) {
    const terminal = await selectTerminal()
    const cwd = process.cwd()
    const cmd = platform() === 'win32'
      ? `cd /d "${cwd}" & echo === Claude Code [${selected!.name}] === & echo. & claude --settings "${settingsFile}"${yoloFlag} & del /f "${settingsFile}"`
      : `cd '${cwd}'; echo '=== Claude Code [${selected!.name}] ==='; echo; claude --settings '${settingsFile}'${yoloFlag}; rm -f '${settingsFile}'; exec bash`
    terminal.open(cmd)
    outro(`${pc.green('⚡')} ${selected!.name} ${pc.dim(`(${selected!.model})`)} → ${pc.dim(terminal.name)}`)
  } else {
    outro(`${pc.green('⚡')} ${selected!.name} ${pc.dim(`(${selected!.model})`)}`)

    const claudeArgs = ['--settings', settingsFile]
    if (flags.yolo) claudeArgs.push('--dangerously-skip-permissions')

    const child = spawn('claude', claudeArgs, {
      stdio: 'inherit',
      env: { ...process.env },
      shell: platform() === 'win32',
    })

    child.on('exit', (code) => {
      try { rmSync(settingsFile, { force: true }) } catch {}
      process.exit(code ?? 0)
    })
  }
}
