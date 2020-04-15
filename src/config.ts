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

  get path() {
    return this.cfg.get('path', 'clangd');
  }

  get arguments() {
    return this.cfg.get<string[]>('arguments', []);
  }

  get semanticHighlighting() {
    return this.cfg.get('semanticHighlighting') as boolean;
  }
}
