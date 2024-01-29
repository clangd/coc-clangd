import { homedir } from 'os';
import * as common from '@clangd/install';
import * as coc from 'coc.nvim';
import { find } from 'fs-jetpack';

class UI {
  constructor(
    private context: coc.ExtensionContext,
    private config: coc.WorkspaceConfiguration
  ) {}

  get storagePath(): string {
    return this.context.storagePath;
  }
  slow<T>(title: string, result: Promise<T>) {
    coc.window.showInformationMessage(`${title}...`);
    return result;
  }
  error(s: string) {
    coc.window.showErrorMessage(s);
  }
  info(s: string) {
    coc.window.showInformationMessage(s);
  }
  // biome-ignore lint/suspicious/noExplicitAny:
  progress<T>(title: string, _cancel: any, body: (progress: (fraction: number) => void) => Promise<T>) {
    return this.slow(
      title,
      body(() => {})
    );
  }

  async shouldReuse(release: string) {
    coc.window.showInformationMessage(`Reusing existing ${release} installation in ${this.storagePath}`);
    return true;
  }
  async promptReload() {
    await coc.commands.executeCommand('editor.action.restart');
  }
  showHelp(message: string, url: string) {
    coc.window.showInformationMessage(`${message}. See ${url}.`);
  }
  async promptUpdate(oldVersion: string, newVersion: string) {
    const message = `clangd ${newVersion} is available (you have ${oldVersion}). :CocCommand clangd.install, or :CocSettings to disable clangd.checkUpdates.`;
    coc.window.showInformationMessage(message);
  }
  async promptInstall(version: string) {
    const message = `clangd was not found on your PATH. :CocCommand clangd.install will install ${version}.`;
    coc.window.showInformationMessage(message);
  }

  get clangdPath(): string {
    let p = this.config.get<string>('path', '');
    const clangdExe = process.platform === 'win32' ? 'clangd.exe' : 'clangd';
    if (p === '') {
      try {
        const exes = find(this.storagePath, {
          matching: `**/${clangdExe}`,
          files: true,
          directories: false,
        });
        if (exes.length > 0) {
          p = exes[0];
        }
      } catch (e) {}
    }
    if (p === '') {
      p = clangdExe;
    }
    return coc.workspace.expand(p);
  }
  set clangdPath(p: string) {
    this.config.update('path', p.replace(homedir(), '~'), /*isUser=*/ true);
  }

  localize(message: string, ...args: Array<string | number | boolean>) {
    let ret = message;
    for (const i in args) {
      ret = ret.replace(`{${i}}`, args[i].toString());
    }
    return ret;
  }
}

// Returns the clangd path to use, or null if clangd is not installed.
export async function activate(context: coc.ExtensionContext): Promise<string | null> {
  const cfg = coc.workspace.getConfiguration('clangd');
  const ui = new UI(context, cfg);
  context.subscriptions.push(coc.commands.registerCommand('clangd.install', async () => common.installLatest(ui)));
  context.subscriptions.push(coc.commands.registerCommand('clangd.update', async () => common.checkUpdates(true, ui)));
  const status = await common.prepare(ui, cfg.get<boolean>('checkUpdates', false));
  return status.clangdPath;
}
