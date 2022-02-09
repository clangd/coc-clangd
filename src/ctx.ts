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

    const disabledFeatures: string[] = [];
    if (this.config.disableDiagnostics) {
      disabledFeatures.push('diagnostics');
    }
    if (this.config.disableCompletion) {
      disabledFeatures.push('completion');
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
      disabledFeatures,
      disableSnippetCompletion: this.config.disableSnippetCompletion,
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

          const { triggerKind, triggerCharacter, option } = context;
          const mayPointMem = triggerKind === 2 && triggerCharacter === '.' && option && option.input === '';
          const tail = (await workspace.nvim.eval(`strpart(getline('.'), col('.') - 1)`)) as string;
          const semicolon = /^\s*$/.test(tail);

          const items = Array.isArray(list) ? list : list.items;
          for (const item of items) {
            // @ts-expect-error
            if (item.score) item.score = Math.max(1, item.score) + item.score / 1000;

            if (mayPointMem && item.insertText === `->${item.filterText}` && item.insertTextFormat === InsertTextFormat.Snippet) {
              item.filterText = `.${item.filterText}`;
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
    for (const feature of features) client.registerFeature(feature);
    this.context.subscriptions.push(services.registLanguageClient(client));
    await client.onReady();

    this.client = client;
  }

  get subscriptions(): Disposable[] {
    return this.context.subscriptions;
  }
}
