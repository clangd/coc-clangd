# coc-clangd

This extension connects [coc.nvim][] to the [clangd][] language server.

**The extension does not install `clangd` for you! You must [install clangd][clangd] separately.**

## Quick Start

1. make sure you have [clangd][] installed already, and set up `compile_commands.json` for your project.
1. install [Node.js][]. `coc.nvim` and `coc-clangd` run on Node.js.
1. install `coc.nvim`. Instructions using `vim-plug`
   (check out [coc.nvim Wiki][] other options):
     - Add to `.vimrc`: `vim Plug 'neoclide/coc.nvim', {'branch': 'release'}`
     - in vim, run `:PlugInstall`
1. In vim, run `:CocInstall coc-clangd`

> **Note**: If you've configured `clangd` as a languageServer in
  `coc-settings.json`, you should remove it to avoid running clangd twice!

## Protocol extensions

`clangd` supports some [extensions][] that are not in the official [Language Server Protocol specification][lsp].

`coc-clangd` adds support for:

- Switching between header and implementation file: `:CocCommand clangd.switchSourceHeader`
- File status monitor, shows on NeoVim statusline
- Describe symbol under the cursor: `:CocCommand clangd.symbolInfo`
- Completions that adjust text near the cursor (e.g. correcting `.` to `->`)

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
[extensions]: https://clangd.github.io/extensions.html
