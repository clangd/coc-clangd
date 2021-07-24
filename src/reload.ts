import { StaticFeature, window, workspace } from 'coc.nvim';
import { basename } from 'path';
import { ServerCapabilities } from 'vscode-languageserver-protocol';
import { Ctx } from './ctx';

interface ClangdClientCapabilities {
  compilationDatabase?: { automaticReload?: boolean };
}

// FIXME: remove this feature once clangd 12 is old enough to assume that
// server-side reload is always supported.
export class ReloadFeature implements StaticFeature {
  constructor(private ctx: Ctx, private activate: () => void) {}
  dispose(): void {}
  initialize(caps: ServerCapabilities) {
    // Don't restart the server if it's able to reload config files itself.
    if ((caps as ClangdClientCapabilities).compilationDatabase?.automaticReload) {
      return;
    }

    const fileWatcher = workspace.createFileSystemWatcher('**/{compile_commands.json,compile_flags.txt,.clangd}');
    this.ctx.subscriptions.push(
      fileWatcher,
      fileWatcher.onDidChange((e) => this.reload(e.fsPath)),
      fileWatcher.onDidCreate((e) => this.reload(e.fsPath))
    );
  }

  fillClientCapabilities() {}

  async reload(url: string) {
    const notification = this.ctx.config.showDBChangedNotification;
    if (notification) {
      const msg = `${basename(url)} has changed, clangd is reloading...`;
      window.showMessage(msg);
    }

    for (const sub of this.ctx.subscriptions) {
      try {
        sub.dispose();
      } catch (e) {
        console.error(e);
      }
    }

    this.activate();
    if (notification) window.showMessage(`clangd has reloaded`);
  }
}
