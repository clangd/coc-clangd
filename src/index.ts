import { commands, ExtensionContext, services, State, window, workspace } from 'coc.nvim';
import * as cmds from './cmds';
import { Ctx } from './ctx';
import { FileStatus, Status } from './file_status';
import * as install from './install';
import { ReloadFeature } from './reload';

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
    await ctx.startServer(clangdPath, new ReloadFeature(ctx, () => activate(context)));
  } catch (e) {
    return;
  }

  const fileStatus = new FileStatus();

  context.subscriptions.push(
    fileStatus,

    commands.registerCommand('clangd.switchSourceHeader', cmds.switchSourceHeader(ctx)),
    commands.registerCommand('clangd.symbolInfo', cmds.symbolInfo(ctx)),

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
