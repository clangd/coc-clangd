// Implements the "memory usage" feature.

import { RequestType0, StaticFeature, commands, window } from 'coc.nvim';
import { Ctx } from './ctx';

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
    results.push(` └ ${msg}`);
  }
  for (const child of c.children) {
    format(child);
  }
}

export class MemoryUsageFeature implements StaticFeature {
  constructor(private ctx: Ctx) {}

  fillClientCapabilities() {}
  fillInitializeParams() {}

  // biome-ignore lint/suspicious/noExplicitAny:
  initialize(capabilities: any) {
    if ('memoryUsageProvider' in capabilities) {
      this.ctx.subscriptions.push(
        commands.registerCommand('clangd.memoryUsage', async () => {
          const usage = (await this.ctx.client?.sendRequest(MemoryUsageRequest.method, {})) as WireTree;
          results.length = 0;
          format(convert(usage, '<root>'));
          window.echoLines(results);
        })
      );
    }
  }
  dispose() {}
}
