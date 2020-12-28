import { Executable, ExtensionContext, LanguageClient, LanguageClientOptions, ServerOptions, services, StaticFeature, workspace } from 'coc.nvim';
import { CompletionList, Disposable, Range, TextDocumentClientCapabilities } from 'vscode-languageserver-protocol';
import { Config } from './config';
import { SemanticHighlightingFeature } from './semantic-highlighting';

class ClangdExtensionFeature implements StaticFeature {
  constructor() {}
  initialize() {}
  fillClientCapabilities(capabilities: any) {
    const textDocument = capabilities.textDocument as TextDocumentClientCapabilities;
    // @ts-ignore: clangd extension
    textDocument.completion?.editsNearCursor = true;
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
    if (!!this.config.trace) {
      exec.options = { env: { CLANGD_TRACE: this.config.trace } };
    }

    const serverOptions: ServerOptions = exec;
    const outputChannel = workspace.createOutputChannel('clangd');

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
        { scheme: 'file', language: 'cuda' },
        { scheme: 'file', language: 'arduino' },
      ],
      initializationOptions,
      disableDiagnostics: this.config.disableDiagnostics,
      // @ts-ignore
      disableSnippetCompletion: this.config.disableSnippetCompletion,
      outputChannel,
      middleware: {
        provideOnTypeFormattingEdits: (document, position, ch, options, token, next) => {
          // coc sends "\n" when exiting insert mode, when there is no newline added to the doc.
          if (ch === '\n') ch = '';
          return next(document, position, ch, options, token);
        },
        provideCompletionItem: async (document, position, context, token, next) => {
          const list = await next(document, position, context, token);
          if (!list) return [];
          if (!this.config.serverCompletionRanking) return list;

          const items = (Array.isArray(list) ? list : list.items).map((item) => {
            const start = item.textEdit?.range.start;
            if (start) {
              const prefix = document.getText(Range.create(start, position));
              if (prefix) item.filterText = prefix + '_' + item.filterText;
            }
            return item;
          });
          return CompletionList.create(items, true);
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
    client.registerFeature(new ClangdExtensionFeature());
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
