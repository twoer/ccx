import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import type { Terminal } from '../types.js'

const terminals: Terminal[] = [
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
]

export function detectTerminals(): Terminal[] {
  return terminals.filter(t => t.detect())
}

export function getTerminal(name: string): Terminal | undefined {
  return terminals.find(t => t.name === name)
}
