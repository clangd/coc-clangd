import { Executable, ExtensionContext, LanguageClient, LanguageClientOptions, ServerOptions, services, StaticFeature, workspace } from 'coc.nvim';
import { existsSync } from 'fs';
import { TextDocumentClientCapabilities } from 'vscode-languageserver-protocol';
import which from 'which';
import { Config } from './config';

class ClangdExtensionFeature implements StaticFeature {
  initialize() {}
  fillClientCapabilities(capabilities: any) {
    const textDocument = capabilities.textDocument as TextDocumentClientCapabilities;
    // @ts-ignore: clangd extension
    textDocument.publishDiagnostics?.codeActionsInline = true;
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
    const outputChannel = workspace.createOutputChannel('clangd log');

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
      outputChannel
    };

    const client = new LanguageClient('clangd', serverOptions, clientOptions);
    client.registerFeature(new ClangdExtensionFeature());
    this.context.subscriptions.push(client.start());
    this.context.subscriptions.push(services.registLanguageClient(client));
    await client.onReady();

    this.client = client;
  }
}
