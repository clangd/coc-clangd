# coc-clangd

This extension connects [coc.nvim][] to the [clangd][] language server.

## Quick Start

1. install [Node.js][]. `coc.nvim` and `coc-clangd` run on Node.js.
1. install `coc.nvim`. Instructions using `vim-plug` (check out [coc.nvim Wiki][] other options):
   - add to `.vimrc`: `vim Plug 'neoclide/coc.nvim', {'branch': 'release'}`
   - in vim, run `:PlugInstall`
1. in vim, run `:CocInstall coc-clangd`
1. `coc-clangd` will try to find `clangd` from your `$PATH`, if not found, you can run `:CocCommand clangd.install` to install the [latest release][] from GitHub
1. follow [Project setup][] to generate `compile_commands.json` for your project

> **Note**: If you've configured `clangd` as a languageServer in `coc-settings.json`, you should remove it to avoid running clangd twice!

## Protocol extensions

`clangd` supports some [extensions][] that are not in the official [Language Server Protocol specification][lsp].

`coc-clangd` adds support for:

- Switching between header and implementation file: `:CocCommand clangd.switchSourceHeader`
- File status monitor, shows on NeoVim statusline
- Describe symbol under the cursor: `:CocCommand clangd.symbolInfo`
- Completions that adjust text near the cursor (e.g. correcting `.` to `->`)

## Configurations

- `clangd.enabled`: enable `coc-clangd`, default `true`
- `clangd.arguments`: arguments for `clangd` server, default `[]`
- `clangd.checkUpdates`: check for clangd language server updates on startup, default `false`
- `clangd.disableDiagnostics`: disable diagnostics from clangd, default `false`
- `clangd.disableSnippetCompletion`: disable completion snippet from clangd, default `false`
- `clangd.compilationDatabasePath`: specifies the directory containing the compilation database, default `''`
- `clangd.fallbackFlags`: extra clang flags used to parse files when no compilation database is found, default `[]`
- `clangd.path`: path to `clangd` executable, default `clangd`
- `clangd.semanticHighlighting`: enable semantic highlighting, requires [jackguo380/vim-lsp-cxx-highlight](https://github.com/jackguo380/vim-lsp-cxx-highlight) to work, default `false`

## Commands

- `clangd.switchSourceHeader`: switch between source/header files
- `clangd.symbolInfo`: resolve symbol info under the cursor
- `clangd.install`: install latest clangd release from GitHub
- `clangd.update`: check for updates to clangd from GitHub

## License

Apache 2.0 with LLVM Exception

This is the [standard LLVM license](https://llvm.org/foundation/relicensing/).

---

> This extension is created by [create-coc-extension](https://github.com/fannheyward/create-coc-extension)

[node.js]: https://nodejs.org/en/
[clangd]: https://clangd.llvm.org/installation.html
[coc.nvim]: https://github.com/neoclide/coc.nvim
[coc.nvim wiki]: https://github.com/neoclide/coc.nvim/wiki/Install-coc.nvim
[lsp]: https://microsoft.github.io/language-server-protocol/specification
[extensions]: https://clangd.llvm.org/extensions.html
[latest release]: https://github.com/clangd/clangd/releases
[project setup]: https://clangd.llvm.org/installation.html#project-setup
