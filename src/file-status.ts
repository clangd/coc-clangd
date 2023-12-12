import { Disposable, StatusBarItem, window, workspace } from 'coc.nvim';
import { Config } from './config';

export interface Status {
  uri: string;
  state: string;
}

export class FileStatus implements Disposable {
  private readonly statusBarItem: StatusBarItem;

  constructor(private readonly config: Config) {
    this.statusBarItem = window.createStatusBarItem(0);
  }

  private statuses = new Map<string, Status>();

  onFileUpdated(status: Status) {
    this.statuses.set(status.uri, status);
    this.updateStatus();
  }

  async updateStatus() {
    if (this.config.disableFileStatus) {
      return;
    }
    const doc = await workspace.document;
    if (!doc) {
      return;
    }

    const status = this.statuses.get(doc.uri);
    if (!status || status.state === 'idle') {
      this.statusBarItem.hide();
      return;
    }

    this.statusBarItem.text = `clangd: ${status.state}`;
    this.statusBarItem.show();
  }

  clear() {
    this.statuses.clear();
    this.statusBarItem.hide();
  }

  dispose() {
    this.statusBarItem.dispose();
  }
}
