import { workspace } from 'coc.nvim';
import { RequestType, TextDocumentIdentifier } from 'vscode-languageserver-protocol';
import { Ctx } from './ctx';

namespace SwitchSourceHeaderRequest {
  export const type = new RequestType<TextDocumentIdentifier, string | undefined, void, void>('textDocument/switchSourceHeader');
}

export function switchSourceHeader(ctx: Ctx) {
  return async () => {
    if (!ctx.client) {
      return;
    }

    const doc = await workspace.document;
    if (!doc) {
      return;
    }
    const params: TextDocumentIdentifier = {
      uri: doc.uri
    };
    const dest = await ctx.client.sendRequest<string>(SwitchSourceHeaderRequest.type.method, params);
    if (!dest) {
      return;
    }

    await workspace.jumpTo(dest);
  };
}
