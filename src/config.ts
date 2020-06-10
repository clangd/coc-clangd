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

  get snippetSupport() {
    return this.cfg.get('snippetSupport') as boolean;
  }

  get arguments() {
    return this.cfg.get<string[]>('arguments', []);
  }

  get fallbackFlags() {
    return this.cfg.get<string[]>('fallbackFlags', []);
  }

  get semanticHighlighting() {
    return this.cfg.get('semanticHighlighting') as boolean;
  }

  get showDBChangedNotification() {
    return this.cfg.get('showDBChangedNotification') as boolean;
  }
}
