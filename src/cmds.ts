import { window, workspace } from 'coc.nvim';
import { RequestType, TextDocumentIdentifier, TextDocumentPositionParams } from 'vscode-languageserver-protocol';
import { Ctx } from './ctx';

namespace SwitchSourceHeaderRequest {
  export const type = new RequestType<TextDocumentIdentifier, string, void, void>('textDocument/switchSourceHeader');
}

namespace SymbolInfoRequest {
  export const type = new RequestType<TextDocumentPositionParams, string, void, void>('textDocument/symbolInfo');
}

interface SymbolDetails {
  name: string;
  containerName: string;
  usr: string;
  id?: string;
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
      uri: doc.uri,
    };
    const dest = await ctx.client.sendRequest<string>(SwitchSourceHeaderRequest.type.method, params);
    if (!dest) {
      window.showMessage(`Didn't find a corresponding file.`);
      return;
    }

    await workspace.jumpTo(dest);
  };
}

export function symbolInfo(ctx: Ctx) {
  return async () => {
    if (!ctx.client) {
      return;
    }

    const doc = await workspace.document;
    if (!doc) {
      return;
    }

    const position = await window.getCursorPosition();
    const params: TextDocumentPositionParams = {
      textDocument: { uri: doc.uri },
      position,
    };
    const details = await ctx.client.sendRequest<SymbolDetails[]>(SymbolInfoRequest.type.method, params);
    if (!details.length) {
      return;
    }

    // TODO
    const detail = details[0];
    window.showMessage(`name: ${detail.name}, containerName: ${detail.containerName}, usr: ${detail.usr}`);
  };
}
