import { Disposable, StatusBarItem, workspace } from 'coc.nvim';

export class FileStatus implements Disposable {
  private readonly statusBarItem: StatusBarItem;

  constructor() {
    this.statusBarItem = workspace.createStatusBarItem(0);
  }

  private statuses = new Map<string, any>();

  onFileUpdated(fileStatus: any) {
    this.statuses.set(fileStatus.uri, fileStatus);
    this.updateStatus();
  }

  async updateStatus() {
    const doc = await workspace.document;
    if (!doc) {
      return;
    }

    const status = this.statuses.get(doc.uri);
    if (!status) {
      this.statusBarItem.hide();
      return;
    }

    this.statusBarItem.text = `clangd: ` + status.state;
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
