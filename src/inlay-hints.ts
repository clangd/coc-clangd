import { CancellationTokenSource, commands, Disposable, Document, events, Position, Range, RequestType, StaticFeature, TextDocumentIdentifier, workspace } from 'coc.nvim';
import { ServerCapabilities } from 'vscode-languageserver-protocol';
import { Ctx } from './ctx';

/// Protocol ///

enum InlayHintKind {
  Parameter = 'parameter',
  Type = 'type',
}

interface InlayHint {
  range: Range;
  position: Position; // omitted by old servers, see hintSide.
  kind: InlayHintKind | string;
  label: string;
}

interface InlaysDecorations {
  type: InlayHint[];
  parameter: InlayHint[];
}

interface InlayHintsParams {
  textDocument: TextDocumentIdentifier;
}

namespace InlayHintsRequest {
  export const type = new RequestType<InlayHintsParams, InlayHint[], void>('clangd/inlayHints');
}

/// Feature state and triggering. ///

interface ClangSourceFile {
  uri: string;
  inlaysRequest: CancellationTokenSource | null;
}

export class InlayHintsFeature implements StaticFeature {
  private enabled = false;
  private namespace = 0;
  private sourceFiles = new Map<string, ClangSourceFile>(); // keys are URIs
  private readonly disposables: Disposable[] = [];

  constructor(private readonly ctx: Ctx) {
    this.enabled = !!ctx.config.inlayHints.enable;
  }

  fillClientCapabilities() {}
  fillInitializeParams() {}

  async initialize(capabilities: ServerCapabilities) {
    this.namespace = await workspace.nvim.createNamespace('clangdInlayHints');

    const serverCapabilities: ServerCapabilities & { clangdInlayHintsProvider?: boolean } = capabilities;
    if (serverCapabilities.clangdInlayHintsProvider && this.ctx.config.inlayHints.enable) {
      commands.registerCommand('clangd.inlayHints.toggle', async () => {
        const doc = await workspace.document;
        if (!doc) return;

        if (this.enabled) {
          this.enabled = false;
          doc.buffer.clearNamespace(this.namespace);
        } else {
          this.enabled = true;
          await this.syncAndRenderHints(doc);
        }
      });

      events.on('InsertLeave', async (bufnr) => await this.syncAndRenderHints(workspace.getDocument(bufnr)));

      workspace.onDidChangeTextDocument(
        async (e) => {
          if (events.insertMode) return;
          await this.syncAndRenderHints(workspace.getDocument(e.bufnr));
        },
        this,
        this.disposables
      );

      workspace.onDidOpenTextDocument(
        async (e) => {
          await this.syncAndRenderHints(workspace.getDocument(e.bufnr));
        },
        this,
        this.disposables
      );

      const current = await workspace.document;
      await this.syncAndRenderHints(current);
    }
  }

  dispose() {
    this.sourceFiles.forEach((file) => file.inlaysRequest?.cancel());
    this.disposables.forEach((d) => d.dispose());
  }

  private renderHints(doc: Document, hints: InlayHint[]) {
    const decorations: InlaysDecorations = {
      parameter: [],
      type: [],
    };

    for (const hint of hints) {
      switch (hint.kind) {
        case InlayHintKind.Parameter || 'parameter':
          decorations.parameter.push(hint);
          break;
        case InlayHintKind.Type || 'type':
          decorations.type.push(hint);
          break;
        default:
          continue;
      }
    }

    doc.buffer.clearNamespace(this.namespace);

    const inlayHints = {};
    const sep = this.ctx.config.inlayHints.sep;
    for (const hint of decorations.parameter) {
      if (!hint.label.length) continue;
      const start = hint.range.start.character;
      const end = hint.range.end.character;
      const line = doc.getline(hint.range.start.line);
      const symbol = `${line.substring(start, end)}`;
      const chunks: [[string, string]] = [[`${sep}${hint.label}${symbol}`, 'CocHintVirtualText']];
      if (inlayHints[hint.position.line] === undefined) {
        inlayHints[hint.position.line] = chunks;
      } else {
        inlayHints[hint.position.line].push([' ', 'Normal']);
        inlayHints[hint.position.line].push(chunks[0]);
      }
    }

    for (const hint of decorations.type) {
      if (!hint.label.length) continue;
      const chunks: [[string, string]] = [[`${sep}${hint.label}`, 'CocHintVirtualText']];
      if (inlayHints[hint.position.line] === undefined) {
        inlayHints[hint.position.line] = chunks;
      } else {
        inlayHints[hint.position.line].push([' ', 'Normal']);
        inlayHints[hint.position.line].push(chunks[0]);
      }
    }

    Object.keys(inlayHints).forEach((line) => {
      if (workspace.has('nvim-0.6.0')) {
        doc.buffer.setExtMark(this.namespace, Number(line), 0, { virt_text_pos: 'eol', hl_mode: 'combine', virt_text: inlayHints[line] });
      } else {
        doc.buffer.setVirtualText(this.namespace, Number(line), inlayHints[line], {});
      }
    });
  }

  private async syncAndRenderHints(doc: Document) {
    if (!doc) return;
    if (!this.enabled) return;
    if (!this.ctx.isClangDocument(doc.textDocument)) return;

    const uri = doc.uri.toString();
    const file = this.sourceFiles.get(uri) || { uri, inlaysRequest: null };

    this.fetchHints(uri, file).then(async (hints) => {
      if (!hints) return;

      this.renderHints(doc, hints);
    });
  }

  private async fetchHints(uri: string, file: ClangSourceFile): Promise<InlayHint[] | null> {
    file.inlaysRequest?.cancel();

    const tokenSource = new CancellationTokenSource();
    file.inlaysRequest = tokenSource;

    const param = { textDocument: { uri } };

    return this.ctx.client!.sendRequest(InlayHintsRequest.type, param, tokenSource.token).then(res => res, err => {
      return this.ctx.client!.handleFailedRequest(InlayHintsRequest.type, tokenSource.token, err, null);
    });
  }
}
