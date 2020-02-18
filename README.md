# coc-clangd

clangd extension for coc.nvim

## Install

`:CocInstall coc-clangd`

> **Note**: remove `clangd` config from `coc-settings.json` if you set

You need [clangd](https://clangd.github.io/installation.html) installed already, and `compile_commands.json` for your project.

## Protocol extensions

`clangd` supports some features that are not in the official [Language Server Protocol specification](https://microsoft.github.io/language-server-protocol/specification), called [Protocol extensions](https://clangd.github.io/extensions.html). `coc-clangd` adds these support:

- Switch between source/header, use command `:CocCommand clangd.switchSourceHeader`
- File status, shows on statusline
- Force diagnostics generation
- Diagnostic categories & inline fixes
- Symbol info request, use command: `:CocCommand clangd.symbolInfo`

## License

MIT

---

> This extension is created by [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
