# coc-clangd

clangd extension for coc.nvim

## Install

`:CocInstall coc-clangd`

> **Note**: remove `clangd` config from `coc-settings.json` if you set

You need [clangd](https://clangd.github.io/installation.html) installed already, and `compile_commands.json` for your project.

## Protocol extensions

`clangd` supports some features that are not in the official [Language Server Protocol specification](https://microsoft.github.io/language-server-protocol/specification), called [Protocol extensions](https://clangd.github.io/extensions.html). `coc-clangd` adds these support:

- Switch between source/header, using command `:CocCommand clangd.switchSourceHeader`
- File status monitor, shows on statusline
- Force diagnostics generation, default `true`
- Diagnostic categories & inline fixes
- Symbol info under cursor, using command: `:CocCommand clangd.symbolInfo`

## Configurations

- `clangd.enabled`: enable `coc-clangd`, default `true`
- `clangd.path`: path to `clangd` executable, default `clangd`
- `clangd.arguments`: arguments for `clangd` server

## License

MIT

---

> This extension is created by [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
