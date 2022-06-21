import { workspace, WorkspaceConfiguration } from 'coc.nvim';
export class Config {
  private cfg: WorkspaceConfiguration;

  constructor() {
    this.cfg = workspace.getConfiguration('clangd');
  }

  get enabled() {
    return this.cfg.get('enabled') as boolean;
  }

  get disableDiagnostics() {
    return this.cfg.get('disableDiagnostics') as boolean;
  }

  get disableSnippetCompletion() {
    return this.cfg.get('disableSnippetCompletion') as boolean;
  }

  get disableCompletion() {
    return this.cfg.get('disableCompletion') as boolean;
  }

  get disableProgressNotifications() {
    return this.cfg.get('disableProgressNotifications') as boolean;
  }

  get arguments() {
    return this.cfg.get<string[]>('arguments', []).map((arg) => workspace.expand(arg));
  }

  get trace() {
    return this.cfg.get('trace', { file: '', server: 'off' });
  }

  get fallbackFlags() {
    return this.cfg.get<string[]>('fallbackFlags', []);
  }

  get showDBChangedNotification() {
    return this.cfg.get('showDBChangedNotification') as boolean;
  }

  get compilationDatabasePath() {
    return this.cfg.get<string>('compilationDatabasePath');
  }

  get compilationDatabaseCandidates() {
    return this.cfg.get<string[]>('compilationDatabaseCandidates');
  }

  get serverCompletionRanking() {
    return this.cfg.get('serverCompletionRanking') as boolean;
  }

  get inlayHints() {
    const virtualText = workspace.isNvim && workspace.nvim.hasFunction('nvim_buf_set_virtual_text');
    return {
      enable: virtualText && (this.cfg.get('inlayHints.enable') as boolean),
      sep: this.cfg.get('inlayHints.sep', '‣'),
    };
  }
}
