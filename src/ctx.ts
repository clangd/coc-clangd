import { Executable, ExtensionContext, HandleDiagnosticsSignature, LanguageClient, LanguageClientOptions, ServerOptions, services, StaticFeature, workspace } from 'coc.nvim';
import { existsSync } from 'fs';
import { Diagnostic, DidChangeTextDocumentNotification, TextDocumentClientCapabilities } from 'vscode-languageserver-protocol';
import which from 'which';
import { Config } from './config';

class DiagnosticFeature implements StaticFeature {
  initialize() {}
  fillClientCapabilities(capabilities: any) {
    // @ts-ignore
    (capabilities.textDocument as TextDocumentClientCapabilities).publishDiagnostics?.categorySupport = true;
    // @ts-ignore
    (capabilities.textDocument as TextDocumentClientCapabilities).publishDiagnostics?.codeActionsInline = true;
  }
}

export class Ctx {
  public readonly config: Config;
  client: LanguageClient | null = null;

  constructor(private readonly context: ExtensionContext) {
    this.config = new Config();
  }

  resolveBin(): string | undefined {
    const bin = which.sync(this.config.path, { nothrow: true });
    if (!bin) {
      return;
    }

    if (!existsSync(bin)) {
      return;
    }

    return bin;
  }

  async startServer(bin: string) {
    const old = this.client;
    if (old) {
      await old.stop();
    }

    const exec: Executable = {
      command: bin,
      args: this.config.arguments
      // options: { env: { CLANGD_TRACE: '/tmp/clangd.log' } }
    };

    const serverOptions: ServerOptions = exec;
    const outputChannel = workspace.createOutputChannel('clangd trace');

    const cudaFilePattern = '**/*.{cu}';
    const clientOptions: LanguageClientOptions = {
      documentSelector: [
        { scheme: 'file', language: 'c' },
        { scheme: 'file', language: 'cpp' },
        { scheme: 'file', language: 'objective-c' },
        { scheme: 'file', language: 'objective-cpp' },
        { scheme: 'file', pattern: cudaFilePattern }
      ],
      initializationOptions: { clangdFileStatus: true },
      outputChannel,
      middleware: {
        didChange: params => {
          if (this.config.wantDiagnostics) {
            // @ts-ignore
            params.wantDiagnostics = true;
          }
          client.sendNotification(DidChangeTextDocumentNotification.type.method, params); // eslint-disable-line
        },
        handleDiagnostics: (uri: string, diagnostics: Diagnostic[], next: HandleDiagnosticsSignature) => {
          for (const diagnostic of diagnostics) {
            // @ts-ignore
            diagnostic.source = `${diagnostic.source}(${diagnostic.category})`;
          }
          next(uri, diagnostics);
        }
      }
    };

    const client = new LanguageClient('clangd Language Server', serverOptions, clientOptions);
    client.registerFeature(new DiagnosticFeature());
    this.context.subscriptions.push(client.start());
    this.context.subscriptions.push(services.registLanguageClient(client));
    await client.onReady();

    this.client = client;
  }
}
