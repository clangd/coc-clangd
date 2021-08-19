import { RequestType, TextDocumentIdentifier, TextDocumentPositionParams, Uri, window, workspace } from 'coc.nvim';
import * as fs from 'fs';
import * as path from 'path';
import { Ctx } from './ctx';

namespace SwitchSourceHeaderRequest {
  export const type = new RequestType<TextDocumentIdentifier, string, void>('textDocument/switchSourceHeader');
}

namespace SymbolInfoRequest {
  export const type = new RequestType<TextDocumentPositionParams, string, void>('textDocument/symbolInfo');
}

interface SymbolDetails {
  name: string;
  containerName: string;
  usr: string;
  id?: string;
}

export function switchSourceHeader(ctx: Ctx) {
  return async (openCommand: string) => {
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

    await workspace.jumpTo(dest, null, openCommand);
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

function getUserConfigFile(): string {
  let dir: string;
  switch (process.platform) {
    case 'win32':
      dir = process.env.LOCALAPPDATA!;
      break;
    case 'darwin':
      dir = path.join(process.env.HOME!, 'Library', 'Preferences');
      break;
    default:
      dir = process.env.XDG_CONFIG_HOME || path.join(process.env.HOME!, '.config');
      break;
  }
  if (!dir) return '';
  return path.join(dir, 'clangd', 'config.yaml');
}

async function openConfigFile(p: string) {
  if (!fs.existsSync(p)) {
    await workspace.createFile(p);
  }

  await workspace.openResource(p);
}

export function userConfig() {
  const file = getUserConfigFile();
  if (file) {
    openConfigFile(file);
  } else {
    window.showMessage("Couldn't get global configuration directory", 'warning');
  }
}

export function projectConfig() {
  if (workspace.workspaceFolders.length > 0) {
    const folder = workspace.workspaceFolders[0];
    openConfigFile(path.join(Uri.parse(folder.uri).fsPath, '.clangd'));
  } else {
    window.showMessage('No project is open', 'warning');
  }
}
