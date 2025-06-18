// Implements the "ast dump" feature: textDocument/ast.

import {
  commands,
  Emitter,
  Range,
  RequestType,
  type StaticFeature,
  type TextDocumentIdentifier,
  type TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  window,
  workspace,
} from 'coc.nvim';
import type { Ctx } from './ctx';

// The wire format: we send a position, and get back a tree of ASTNode.
interface ASTParams {
  textDocument: TextDocumentIdentifier;
  range: Range;
}
interface ASTNode {
  role: string; // e.g. expression
  kind: string; // e.g. BinaryOperator
  detail?: string; // e.g. ||
  arcana?: string; // e.g. BinaryOperator <0x12345> <col:12, col:1> 'bool' '||'
  children?: Array<ASTNode>;
  range?: Range;
}
const ASTRequestType = new RequestType<ASTParams, ASTNode | null, void>('textDocument/ast');

export class ASTFeature implements StaticFeature {
  constructor(private ctx: Ctx) {}

  fillClientCapabilities() {}

  // The "Show AST" command is enabled if the server advertises the capability.
  // biome-ignore lint/suspicious/noExplicitAny: x
  initialize(capabilities: any) {
    // biome-ignore lint/complexity/useLiteralKeys: x
    if ('astProvider' in capabilities && typeof window['createTreeView'] === 'function') {
      this.ctx.subscriptions.push(
        commands.registerCommand('clangd.ast', async () => {
          if (!this.ctx.client) return;

          let range: Range | null = null;
          const { document, position } = await workspace.getCurrentState();
          const mode = (await workspace.nvim.call('visualmode')) as string;
          if (mode) range = await window.getSelectedRange(mode);
          if (!range) range = Range.create(position, position);

          const params: ASTParams = {
            textDocument: { uri: document.uri },
            range,
          };
          const item = await this.ctx.client.sendRequest(ASTRequestType, params);
          if (!item) {
            window.showInformationMessage('No AST node at selection');
            return;
          }
          const winid = (await workspace.nvim.eval('win_getid()')) as number;
          const adapter = new TreeAdapter();
          adapter.setRoot(item, Uri.parse(document.uri), winid);
          const tree = window.createTreeView('clangd.AST', {
            treeDataProvider: adapter,
          });
          tree.show();
        })
      );
    }
  }
  dispose() {}
}

// Primary text shown for this node.
function describe(role: string, kind: string): string {
  // For common roles where the kind is fairly self-explanatory, we don't
  // include it. e.g. "Call" rather than "Call expression".
  if (role === 'expression' || role === 'statement' || role === 'declaration' || role === 'template name') {
    return kind;
  }
  return `${kind} ${role}`;
}

// Map a root ASTNode onto a VSCode tree.
class TreeAdapter implements TreeDataProvider<ASTNode> {
  private root?: ASTNode;
  private doc?: Uri;
  private winid?: number;

  hasRoot(): boolean {
    return this.root !== undefined;
  }

  setRoot(newRoot: ASTNode | undefined, newDoc: Uri | undefined, winid: number | undefined) {
    this.root = newRoot;
    this.doc = newDoc;
    this.winid = winid;
    this._onDidChangeTreeData.fire(/*root changed*/ null);
  }

  private _onDidChangeTreeData = new Emitter<ASTNode | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  public getTreeItem(node: ASTNode): TreeItem {
    const item = new TreeItem(describe(node.role, node.kind));
    if (node.children && node.children.length > 0) {
      item.collapsibleState = TreeItemCollapsibleState.Expanded;
    }
    item.description = node.detail;
    item.tooltip = node.arcana;

    // Clicking on the node should highlight it in the source.
    if (node.range && this.winid) {
      item.command = {
        title: 'Jump to',
        command: 'workspace.openLocation',
        arguments: [this.winid, { uri: this.doc, range: node.range }],
      };
    }
    return item;
  }

  public getChildren(element?: ASTNode): ASTNode[] {
    return element ? element.children || [] : this.root ? [this.root] : [];
  }

  public getParent(node: ASTNode): ASTNode | undefined {
    if (node === this.root) return undefined;

    function findUnder(parent: ASTNode | undefined): ASTNode | undefined {
      for (const child of parent?.children ?? []) {
        const result = node === child ? parent : findUnder(child);
        if (result) return result;
      }
      return undefined;
    }
    return findUnder(this.root);
  }
}
