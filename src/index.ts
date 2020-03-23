import { commands, ExtensionContext, services, workspace } from 'coc.nvim';
import * as cmds from './cmds';
import { Ctx } from './ctx';
import { FileStatus } from './file_status';

export async function activate(context: ExtensionContext): Promise<void> {
  const ctx = new Ctx(context);
  if (!ctx.config.enabled) {
    return;
  }

  const bin = ctx.resolveBin();
  if (!bin) {
    workspace.showMessage(`clangd is not found, you need to install clangd first. https://clangd.github.io/installation.html`, 'error');
    return;
  }

  for (const service of services.getServiceStats()) {
    if (service.id.includes('clangd')) {
      workspace.showMessage(`Looks like you've configured clangd in coc-settings.json, you should remove it to use coc-clangd`, 'warning');
      return;
    }
  }

  try {
    await ctx.startServer(bin);
  } catch (e) {
    return;
  }

  const status = new FileStatus();
  context.subscriptions.push(
    status,

    commands.registerCommand('clangd.switchSourceHeader', cmds.switchSourceHeader(ctx)),
    commands.registerCommand('clangd.symbolInfo', cmds.symbolInfo(ctx)),

    workspace.onDidOpenTextDocument(() => {
      status.updateStatus();
    })
  );

  ctx.client?.onNotification('textDocument/clangd.fileStatus', (fileStatus) => {
    status.onFileUpdated(fileStatus);
  });
}
