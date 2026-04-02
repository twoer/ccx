import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { platform } from 'node:os'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { Terminal } from '../types.js'

const isMac = platform() === 'darwin'
const isWin = platform() === 'win32'

const terminals: Terminal[] = isMac ? [
  {
    name: 'Ghostty',
    detect: () => existsSync('/Applications/Ghostty.app'),
    open: (cmd) => execSync(`open -na Ghostty.app --args -e bash -c "${cmd}"`),
  },
  {
    name: 'iTerm2',
    detect: () => existsSync('/Applications/iTerm.app'),
    open: (cmd) => execSync(`osascript -e 'tell application "iTerm" to create window with default profile command "bash -c \\"${cmd}\\""'`),
  },
  {
    name: 'Warp',
    detect: () => existsSync('/Applications/Warp.app'),
    open: (cmd) => execSync(`open -na Warp.app --args bash -c "${cmd}"`),
  },
  {
    name: 'kitty',
    detect: () => existsSync('/Applications/kitty.app'),
    open: (cmd) => execSync(`/Applications/kitty.app/Contents/MacOS/kitty bash -c "${cmd}" &`),
  },
  {
    name: 'Terminal',
    detect: () => true,
    open: (cmd) => execSync(`osascript -e 'tell application "Terminal" to do script "${cmd}"'`),
  },
] : isWin ? [
  {
    name: 'Windows Terminal',
    detect: () => {
      try { execSync('where wt.exe', { stdio: 'pipe' }); return true } catch { return false }
    },
    open: (cmd) => execSync(`wt.exe bash -c "${cmd}"`, { shell: 'cmd.exe' }),
  },
  {
    name: 'PowerShell',
    detect: () => true,
    open: (cmd) => execSync(`start powershell -NoExit -Command "${cmd}"`, { shell: 'cmd.exe' }),
  },
] : [
  {
    name: 'gnome-terminal',
    detect: () => {
      try { execSync('which gnome-terminal', { stdio: 'pipe' }); return true } catch { return false }
    },
    open: (cmd) => execSync(`gnome-terminal -- bash -c "${cmd}"`),
  },
  {
    name: 'konsole',
    detect: () => {
      try { execSync('which konsole', { stdio: 'pipe' }); return true } catch { return false }
    },
    open: (cmd) => execSync(`konsole -e bash -c "${cmd}"`),
  },
  {
    name: 'xterm',
    detect: () => {
      try { execSync('which xterm', { stdio: 'pipe' }); return true } catch { return false }
    },
    open: (cmd) => execSync(`xterm -e bash -c "${cmd}" &`),
  },
]

export function detectTerminals(): Terminal[] {
  return terminals.filter(t => t.detect())
}

export function getTerminal(name: string): Terminal | undefined {
  return terminals.find(t => t.name === name)
}
