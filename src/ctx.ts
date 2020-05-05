import { Executable, ExtensionContext, LanguageClient, LanguageClientOptions, ServerOptions, services, StaticFeature, workspace } from 'coc.nvim';
import { TextDocumentClientCapabilities } from 'vscode-languageserver-protocol';
import { Config } from './config';
import { SemanticHighlightingFeature } from './semantic-highlighting';

class ClangdExtensionFeature implements StaticFeature {
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

  async startServer(bin: string) {
    const old = this.client;
    if (old) {
      await old.stop();
    }

    const exec: Executable = {
      command: bin,
      args: this.config.arguments,
      // options: { env: { CLANGD_TRACE: '/tmp/clangd.log' } }
    };

    const serverOptions: ServerOptions = exec;
    const outputChannel = workspace.createOutputChannel('clangd log');

    const cudaFilePattern = '**/*.{cu,ino}';
    const clientOptions: LanguageClientOptions = {
      documentSelector: [
        { scheme: 'file', language: 'c' },
        { scheme: 'file', language: 'cpp' },
        { scheme: 'file', language: 'objective-c' },
        { scheme: 'file', language: 'objective-cpp' },
        { scheme: 'file', pattern: cudaFilePattern },
      ],
      initializationOptions: { clangdFileStatus: true },
      disableDiagnostics: this.config.disableDiagnostics,
      outputChannel,
      middleware: {
        provideOnTypeFormattingEdits: (document, position, _ch, options, token, next) => {
          return next(document, position, '', options, token);
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
    this.context.subscriptions.push(services.registLanguageClient(client));
    await client.onReady();

    this.client = client;
  }
}
