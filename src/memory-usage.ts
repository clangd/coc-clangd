// Implements the "memory usage" feature.

import { commands, ExtensionContext, LanguageClient, RequestType0, StaticFeature, window } from 'coc.nvim';
import { ServerCapabilities } from 'vscode-languageserver-protocol';

// LSP wire format for this clangd feature.
interface WireTree {
  _self: number;
  _total: number;
  [child: string]: WireTree | number;
}

const MemoryUsageRequest = new RequestType0<WireTree, void>('$/memoryUsage');

// Internal representation that's a bit easier to work with.
interface InternalTree {
  title: string;
  total: number;
  self: number;
  isFile: boolean; // different icon, default collapsed
  children: InternalTree[];
}

function convert(m: WireTree, title: string): InternalTree {
  const slash = Math.max(title.lastIndexOf('/'), title.lastIndexOf('\\'));
  return {
    title, // display basename only
    isFile: slash >= 0,
    total: m._total,
    self: m._self,
    children: Object.keys(m)
      .sort()
      .filter((x) => !x.startsWith('_'))
      .map((e) => convert(m[e] as WireTree, e))
      .sort((x, y) => y.total - x.total),
  };
}

const results: string[] = [];
function format(c: InternalTree) {
  const msg = `${c.title} ${(c.total / 1024 / 1024).toFixed(2)} MB`;
  if (c.title === 'clangd_server') {
    results.push(msg);
  }
  if (['background_index', 'tuscheduler', 'dynamic_index'].includes(c.title)) {
    results.push(' └ ' + msg);
  }
  for (const child of c.children) {
    format(child);
  }
}

export class MemoryUsageFeature implements StaticFeature {
  private memoryUsageProvider = false;
  constructor(client: LanguageClient, context: ExtensionContext) {
    context.subscriptions.push(
      commands.registerCommand('clangd.memoryUsage', async () => {
        if (this.memoryUsageProvider) {
          const usage = (await client.sendRequest(MemoryUsageRequest.method, {})) as WireTree;
          results.length = 0;
          format(convert(usage, '<root>'));
          window.echoLines(results);
        } else {
          window.showMessage(`Your clangd doesn't support memory usage report, clangd 12+ is needed`, 'warning');
        }
      })
    );
  }

  fillClientCapabilities() {}
  fillInitializeParams() {}

  initialize(capabilities: ServerCapabilities) {
    this.memoryUsageProvider = 'memoryUsageProvider' in capabilities;
  }
  dispose() {}
}
