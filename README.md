# coc-clangd

clangd extension for [coc.nvim][]

## Quick Start

1. make sure you have [clangd][] install already, and setup `compile_commands.json` for your project.
1. install [Node.js][], `coc.nvim` and `coc-clangd` are runs on Node.js.
1. install `coc.nvim` by `vim-plug`. Checkout [coc.nvim Wiki][] for more info.

   ```vim
   Plug 'neoclide/coc.nvim', {'branch': 'release'}
   ```

1. `:CocInstall coc-clangd`

> **Note**: remove `clangd` config from `coc-settings.json` if you set

## Protocol extensions

`clangd` supports some features that are not in the official [Language Server Protocol specification][lsp], called [Protocol extensions][]. `coc-clangd` adds these support:

- Switch between source/header, using command `:CocCommand clangd.switchSourceHeader`
- File status monitor, shows on statusline
- Diagnostic inline fixes
- Symbol info under cursor, using command: `:CocCommand clangd.symbolInfo`

## Configurations

- `clangd.enabled`: enable `coc-clangd`, default `true`
- `clangd.path`: path to `clangd` executable, default `clangd`
- `clangd.arguments`: arguments for `clangd` server

## License

MIT

---

> This extension is created by [create-coc-extension](https://github.com/fannheyward/create-coc-extension)

[node.js]: https://nodejs.org/en/
[clangd]: https://clangd.github.io/installation.html
[coc.nvim]: https://github.com/neoclide/coc.nvim
[coc.nvim wiki]: https://github.com/neoclide/coc.nvim/wiki/Install-coc.nvim
[lsp]: https://microsoft.github.io/language-server-protocol/specification
[protocol extensions]: https://clangd.github.io/extensions.html
