import { workspace, WorkspaceConfiguration } from 'coc.nvim';
export class Config {
  private cfg: WorkspaceConfiguration;

  constructor() {
    this.cfg = workspace.getConfiguration('clangd');
  }

  get enabled() {
    return this.cfg.get('enabled', true);
  }

  get path() {
    return this.cfg.get('path', 'clangd');
  }

  get arguments() {
    return this.cfg.get<string[]>('arguments', []);
  }
}
