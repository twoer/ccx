# ccx-run

**C**laude **C**ode **Run** — 轻松切换 Provider 和模型。

```
$ ccx

┌  ⚡ ccx — Claude Code eXecutor
│
│  5 providers from cc-switch · v0.3.0
│    ccx add   Add provider    ccx edit  Edit provider
│    ccx list  List providers   ccx rm    Remove provider
│    ccx -n    New window       ccx help  Show help
│
◆  Select provider
│  ● Zhipu GLM-5.1           glm-5.1
│  ○ Zhipu GLM-5 Turbo       glm-5-turbo
│  ○ Claude Official
└
```

## 为什么做 ccx-run

日常使用 Claude Code 时，大部分时间用 Claude Official，但偶尔需要临时切换到其他 provider（如 GLM）。

用 cc-switch 切换存在两个问题：

**1. 污染全局配置**

cc-switch 直接修改 `~/.claude/settings.json`，把 `ANTHROPIC_BASE_URL`、`ANTHROPIC_AUTH_TOKEN` 等写入全局配置。这意味着无法同时使用多个 provider——全局配置只有一份，切换后会影响所有正在运行的 Claude Code 会话。

ccx 通过临时文件注入：每次启动写入临时 `settings.json`，通过 `claude --settings <tmpfile>` 传入，退出后自动清理，全局配置始终保持不变。

**2. 打开新终端不可靠**

cc-switch 提供了"在新终端中打开"的功能，但实际使用中发现：如果已经在 Ghostty 中运行了 Claude Code，再次点击"打开终端"并不会新开一个 Ghostty 窗口，而是激活当前已有的窗口，无法实现多 provider 并行使用。

ccx 使用终端原生 API 创建新窗口，确保每次都打开独立终端。

## 安装

```bash
npm i -g ccx-run
```

### 环境要求

- Node.js >= 18
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- 操作系统：macOS / Windows / Linux

## 使用

```bash
# 交互选择，在当前终端运行
ccx

# 模糊匹配 provider 名称
ccx glm

# 在新终端窗口中打开
ccx --new
ccx -n glm
```

## 命令

```bash
# 管理 Provider
ccx add           # 交互式添加 provider
ccx list          # 列出所有 provider
ccx edit          # 编辑 provider
ccx rm            # 删除 provider

# 其他
ccx help          # 显示帮助
ccx --reset       # 重置所有配置
```

## Provider 数据源

ccx 会自动检测可用的数据源：

### 1. cc-switch（自动检测）

如果你使用 [cc-switch](https://github.com/nicepkg/cc-switch)，ccx 会直接读取 `~/.cc-switch/cc-switch.db`，无需额外配置。

### 2. JSON 文件（手动配置）

使用 `ccx add` 交互式创建，或手动创建配置文件：

- macOS / Linux：`~/.config/ccx-run/providers.json`
- Windows：`%APPDATA%/ccx-run/providers.json`

```json
{
  "providers": [
    {
      "name": "My Provider",
      "model": "model-name",
      "env": {
        "ANTHROPIC_BASE_URL": "https://...",
        "ANTHROPIC_AUTH_TOKEN": "sk-...",
        "ANTHROPIC_MODEL": "model-name"
      }
    }
  ]
}
```

## 终端支持

使用 `ccx --new` 时，首次运行会自动检测已安装的终端：

**macOS：**
- Ghostty
- iTerm2
- Warp
- kitty
- Terminal.app

**Windows：**
- Windows Terminal
- PowerShell

**Linux：**
- gnome-terminal
- konsole
- xterm

## License

MIT
