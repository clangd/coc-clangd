import { commands, ExtensionContext, services, State, workspace } from 'coc.nvim';
import { basename } from 'path';
import * as cmds from './cmds';
import { Ctx } from './ctx';
import { FileStatus } from './file_status';
import * as install from './install';

export async function activate(context: ExtensionContext): Promise<void> {
  const ctx = new Ctx(context);
  if (!ctx.config.enabled) {
    return;
  }

  for (const service of services.getServiceStats()) {
    if (service.id.includes('clangd')) {
      workspace.showMessage(`Looks like you've configured clangd in coc-settings.json, you should remove it to use coc-clangd`, 'warning');
      return;
    }
  }

  const clangdPath = await install.activate(context);
  if (!clangdPath) {
    return;
  }

  try {
    await ctx.startServer(clangdPath);
  } catch (e) {
    return;
  }

  const fileStatus = new FileStatus();
  const fileWatcher = workspace.createFileSystemWatcher('**/{compile_commands.json,compile_flags.txt,.clang-tidy}');
  fileWatcher.onDidChange((e) => reload(e.fsPath, ctx, context));
  fileWatcher.onDidCreate((e) => reload(e.fsPath, ctx, context));

  context.subscriptions.push(
    fileWatcher,
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

  ctx.client?.onNotification('textDocument/clangd.fileStatus', (status) => {
    fileStatus.onFileUpdated(status);
  });
}

async function reload(url: string, ctx: Ctx, context: ExtensionContext) {
  const notification = ctx.config.showDBChangedNotification;
  if (notification) {
    const msg = `${basename(url)} has changed, clangd is reloading...`;
    workspace.showMessage(msg);
  }

  for (const sub of ctx.subscriptions) {
    try {
      sub.dispose();
    } catch (e) {
      console.error(e);
    }
  }

  await activate(context);

  if (notification) workspace.showMessage(`clangd has reloaded`);
}
