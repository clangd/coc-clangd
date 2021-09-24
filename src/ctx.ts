import {
  CompletionItemKind,
  Disposable,
  Executable,
  ExtensionContext,
  InsertTextFormat,
  LanguageClient,
  LanguageClientOptions,
  Range,
  ServerOptions,
  services,
  StaticFeature,
  workspace,
} from 'coc.nvim';
import { Config } from './config';
import { SemanticHighlightingFeature } from './semantic-highlighting';

export class ClangdExtensionFeature implements StaticFeature {
  constructor() {}
  dispose(): void {}
  initialize() {}
  fillClientCapabilities(capabilities: any) {
    const extendedCompletionCapabilities = capabilities.textDocument.completion;
    if (extendedCompletionCapabilities) {
      extendedCompletionCapabilities.editsNearCursor = true;
    }
  }
}

export class Ctx {
  public readonly config: Config;
  client: LanguageClient | null = null;

  constructor(private readonly context: ExtensionContext) {
    this.config = new Config();
  }

  async startServer(bin: string, ...features: StaticFeature[]) {
    const old = this.client;
    if (old) {
      await old.stop();
    }

    const exec: Executable = {
      command: bin,
      args: this.config.arguments,
    };
    if (this.config.trace.file) {
      exec.options = { env: { CLANGD_TRACE: this.config.trace.file } };
    }

    const serverOptions: ServerOptions = exec;

    const initializationOptions: any = { clangdFileStatus: true, fallbackFlags: this.config.fallbackFlags };
    if (this.config.compilationDatabasePath) {
      initializationOptions.compilationDatabasePath = this.config.compilationDatabasePath;
    }

    const clientOptions: LanguageClientOptions = {
      documentSelector: [
        { scheme: 'file', language: 'c' },
        { scheme: 'file', language: 'cpp' },
        { scheme: 'file', language: 'objc' },
        { scheme: 'file', language: 'objcpp' },
        { scheme: 'file', language: 'objective-c' },
        { scheme: 'file', language: 'objective-cpp' },
        { scheme: 'file', language: 'opencl' },
        { scheme: 'file', language: 'cuda' },
      ],
      initializationOptions,
      disableDiagnostics: this.config.disableDiagnostics,
      disableSnippetCompletion: this.config.disableSnippetCompletion,
      disableCompletion: this.config.disableCompletion,
      middleware: {
        provideOnTypeFormattingEdits: (document, position, ch, options, token, next) => {
          // coc sends "\n" when exiting insert mode, when there is no newline added to the doc.
          const line = document.getText(Range.create(position.line, 0, position.line, position.character));
          if (!line.trim().length) return;
          if (ch === '\n') ch = '';
          return next(document, position, ch, options, token);
        },
        provideCompletionItem: async (document, position, context, token, next) => {
          const list = await next(document, position, context, token);
          if (!list) return [];
          if (!this.config.serverCompletionRanking) return list;

          const tail = (await workspace.nvim.eval(`strpart(getline('.'), col('.') - 1)`)) as string;
          const semicolon = /^\s*$/.test(tail);

          const items = Array.isArray(list) ? list : list.items;
          for (const item of items) {
            if (this.config.serverCompletionRanking) {
              const start = item.textEdit?.range.start;
              if (start) {
                const prefix = document.getText(Range.create(start, position));
                if (prefix) item.filterText = prefix + '_' + item.filterText;
              }
            }

            if (semicolon && item.insertTextFormat === InsertTextFormat.Snippet && item.textEdit) {
              const { textEdit } = item;
              const { newText } = textEdit;
              if (item.kind === CompletionItemKind.Function || (item.kind === CompletionItemKind.Text && newText.slice(-1) === ')')) {
                item.textEdit = { range: textEdit.range, newText: newText + ';' };
              }
            }
          }

          return Array.isArray(list) ? items : { items, isIncomplete: list.isIncomplete };
        },
        provideWorkspaceSymbols: async (query, token, next) => {
          const symbols = await next(query, token);
          if (!symbols) return;

          return symbols.map((symbol) => {
            if (query.includes('::')) {
              if (symbol.containerName) {
                symbol.name = `${symbol.containerName}::${symbol.name}`;
              }
              symbol.containerName = '';
            }
            return symbol;
          });
        },
      },
    };

    const client = new LanguageClient('clangd', serverOptions, clientOptions);
    if (this.config.semanticHighlighting) {
      const lspCxx = await workspace.nvim.call('exists', 'g:lsp_cxx_hl_loaded');
      if (lspCxx === 1) {
        client.registerFeature(new SemanticHighlightingFeature(client, this.context));
      }
    }
    for (const feature of features) client.registerFeature(feature);
    this.context.subscriptions.push(services.registLanguageClient(client));
    await client.onReady();

    this.client = client;
  }

  get subscriptions(): Disposable[] {
    return this.context.subscriptions;
  }
}
