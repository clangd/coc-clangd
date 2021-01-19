import * as common from '@clangd/install';
import * as coc from 'coc.nvim';

class UI {
  constructor(private context: coc.ExtensionContext, private config: coc.WorkspaceConfiguration) {}

  get storagePath(): string {
    return this.context.storagePath;
  }
  slow<T>(title: string, result: Promise<T>) {
    coc.window.showMessage(title + '...');
    return result;
  }
  error(s: string) {
    coc.window.showMessage(s, 'error');
  }
  info(s: string) {
    coc.window.showMessage(s);
  }
  progress<T>(title: string, _cancel: any, body: (progress: (fraction: number) => void) => Promise<T>) {
    return this.slow(
      title,
      body(() => {})
    );
  }

  async shouldReuse(release: string) {
    coc.window.showMessage(`Reusing existing ${release} installation in ${this.storagePath}`);
    return true;
  }
  async promptReload() {
    await coc.commands.executeCommand('editor.action.restart');
  }
  showHelp(message: string, url: string) {
    message += ` See ${url}.`;
    coc.window.showMessage(message);
  }
  async promptUpdate(oldVersion: string, newVersion: string) {
    const message = `clangd ${newVersion} is available (you have ${oldVersion}). :CocCommand clangd.install, or :CocSettings to disable clangd.checkUpdates.`;
    coc.window.showMessage(message);
  }
  async promptInstall(version: string) {
    const message = `clangd was not found on your PATH. :CocCommand clangd.install will install ${version}.`;
    coc.window.showMessage(message);
  }

  get clangdPath(): string {
    return this.config.get<string>('path')!;
  }
  set clangdPath(p: string) {
    this.config.update('path', p, /*isUser=*/ true);
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
