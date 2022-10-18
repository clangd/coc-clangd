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
  - You can open in split buffer by `:CocCommand clangd.switchSourceHeader vsplit`
- File status monitor, shows on NeoVim statusline
- Describe symbol under the cursor: `:CocCommand clangd.symbolInfo`
- Completions that adjust text near the cursor (e.g. correcting `.` to `->`)

## Configurations

`:CocConfig` opens your global `coc-settings.json`. `:CocLocalConfig` opens local configuration for your project (`$PROJECTROOT/.vim/coc-settings.json`)

| Configurations                        | Description                                                                          | Default  |
| -------------------------------       | ------------------------------------------------------------------------------------ | -------- |
| clangd.enabled                        | enable `coc-clangd`                                                                  | `true`   |
| clangd.arguments                      | arguments for `clangd` server                                                        | `[]`     |
| clangd.checkUpdates                   | check for clangd language server updates on startup                                  | `false`  |
| clangd.disableCompletion              | disable completion source from clangd                                                | `false`  |
| clangd.disableDiagnostics             | disable diagnostics from clangd                                                      | `false`  |
| clangd.disableSnippetCompletion       | disable completion snippet from clangd                                               | `false`  |
| clangd.disableProgressNotifications   | disable indexing progress notifications from clangd                                  | `false`  |
| clangd.compilationDatabasePath        | specifies the directory containing the compilation database                          | `''`     |
| clangd.compilationDatabaseCandidates  | specifies directories that may contain the compilation database, you can use `${workspaceFolder}` variables <https://code.visualstudio.com/docs/editor/variables-reference>               | `[]`     |
| clangd.fallbackFlags                  | extra clang flags used to parse files when no compilation database is found          | `[]`     |
| clangd.path                           | path to `clangd` executable                                                          | `clangd` |

## Commands

- `clangd.switchSourceHeader`: switch between source/header files
- `clangd.symbolInfo`: resolve symbol info under the cursor
- `clangd.memoryUsage`: show memory usage
- `clangd.ast`: show AST
- `clangd.install`: install latest clangd release from GitHub
- `clangd.update`: check for updates to clangd from GitHub

## License

Apache 2.0 with LLVM Exception

This is the [standard LLVM license](https://llvm.org/foundation/relicensing/).

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)

[node.js]: https://nodejs.org/en/
[clangd]: https://clangd.llvm.org/installation.html
[coc.nvim]: https://github.com/neoclide/coc.nvim
[coc.nvim wiki]: https://github.com/neoclide/coc.nvim/wiki/Install-coc.nvim
[lsp]: https://microsoft.github.io/language-server-protocol/specification
[extensions]: https://clangd.llvm.org/extensions.html
[latest release]: https://github.com/clangd/clangd/releases
[project setup]: https://clangd.llvm.org/installation.html#project-setup
