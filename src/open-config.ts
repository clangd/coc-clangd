import { commands, ExtensionContext, Uri, window, workspace } from 'coc.nvim';
import * as fs from 'fs';
import * as path from 'path';

function getUserConfigFile(): string {
  let dir: string;
  switch (process.platform) {
    case 'win32':
      dir = process.env.LOCALAPPDATA!;
      break;
    case 'darwin':
      dir = path.join(process.env.HOME!, 'Library', 'Preferences');
      break;
    default:
      dir = process.env.XDG_CONFIG_HOME || path.join(process.env.HOME!, '.config');
      break;
  }
  if (!dir) return '';
  return path.join(dir, 'clangd', 'config.yaml');
}

async function openConfigFile(p: string) {
  if (!fs.existsSync(p)) {
    await workspace.createFile(p);
  }

  await workspace.openResource(p);
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('clangd.projectConfig', () => {
      if (workspace.workspaceFolders.length > 0) {
        const folder = workspace.workspaceFolders[0];
        openConfigFile(path.join(Uri.parse(folder.uri).fsPath, '.clangd'));
      } else {
        window.showMessage('No project is open', 'warning');
      }
    })
  );

  context.subscriptions.push(
    commands.registerCommand('clangd.userConfig', () => {
      const file = getUserConfigFile();
      if (file) {
        openConfigFile(file);
      } else {
        window.showMessage("Couldn't get global configuration directory", 'warning');
      }
    })
  );
}
