import { commands, ExtensionContext, services, State, window, workspace } from 'coc.nvim';
import * as cmds from './cmds';
import { Ctx, ClangdExtensionFeature } from './ctx';
import { FileStatus, Status } from './file-status';
import { InlayHintsFeature } from './inlay-hints';
import * as install from './install';
import { ReloadFeature } from './reload';
import { MemoryUsageFeature } from './memory-usage';
import { ASTFeature } from './ast';

export async function activate(context: ExtensionContext): Promise<void> {
  const ctx = new Ctx(context);
  if (!ctx.config.enabled) {
    return;
  }

  const service = services.getService('clangd');
  if (service) {
    window.showMessage(`Looks like you've configured clangd in coc-settings.json, you should remove it to use coc-clangd`, 'warning');
    return;
  }

  const clangdPath = await install.activate(context);
  if (!clangdPath) {
    return;
  }

  try {
    const astFeature = new ASTFeature(ctx);
    const extFeature = new ClangdExtensionFeature();
    const reloadFeature = new ReloadFeature(ctx, () => activate(context));
    const memoryUsageFeature = new MemoryUsageFeature(ctx);
    const inlayFeature = new InlayHintsFeature(ctx);
    await ctx.startServer(clangdPath, ...[astFeature, extFeature, reloadFeature, memoryUsageFeature, inlayFeature]);
  } catch (e) {
    return;
  }

  const fileStatus = new FileStatus(ctx.config);
  context.subscriptions.push(
    fileStatus,

    commands.registerCommand('clangd.switchSourceHeader', cmds.switchSourceHeader(ctx)),
    commands.registerCommand('clangd.symbolInfo', cmds.symbolInfo(ctx)),
    commands.registerCommand('clangd.userConfig', cmds.userConfig),
    commands.registerCommand('clangd.projectConfig', cmds.projectConfig),

    ctx.client!.onDidChangeState((e) => {
      if (e.newState === State.Running) {
        ctx.client?.onNotification('textDocument/clangd.fileStatus', (status) => {
          fileStatus.onFileUpdated(status);
        });
      } else if (e.newState === State.Stopped) {
        fileStatus.clear();
      }
    }),

    workspace.onDidOpenTextDocument(() => {
      fileStatus.updateStatus();
    })
  );

  ctx.client?.onNotification('textDocument/clangd.fileStatus', (status: Status) => {
    fileStatus.onFileUpdated(status);
  });
}
