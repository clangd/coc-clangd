import { Range, Position, TextDocumentIdentifier, RequestType, StaticFeature, DocumentSelector, languages, FeatureState, InlayHintsProvider, InlayHintKind, InlayHint, LinesTextDocument, CancellationToken } from 'coc.nvim';
import { ServerCapabilities } from 'vscode-languageserver-protocol';

import { Ctx, documentSelector } from './ctx';

namespace protocol {

  export interface InlayHint {
    range: Range;
    position?: Position; // omitted by old servers, see hintSide.
    kind: string;
    label: string;
  }

  export interface InlayHintsParams {
    textDocument: TextDocumentIdentifier;
    range?: Range;
  }

  export namespace InlayHintsRequest {
    export const type =
      new RequestType<InlayHintsParams, InlayHint[], void>(
        'clangd/inlayHints');
  }

} // namespace protocol

export class InlayHintsFeature implements StaticFeature {

  constructor(private readonly context: Ctx) {}

  fillClientCapabilities() {}
  fillInitializeParams() {}

  initialize(capabilities: ServerCapabilities,
    _documentSelector: DocumentSelector | undefined) {
    const serverCapabilities: ServerCapabilities &
    { clangdInlayHintsProvider?: boolean, inlayHintProvider?: any; } =
      capabilities;
    // If the clangd server supports LSP 3.17 inlay hints, these are handled by
    // the vscode-languageclient library - don't send custom requests too!
    if (!serverCapabilities.clangdInlayHintsProvider ||
      serverCapabilities.inlayHintProvider)
      return;
    this.context.subscriptions.push(languages.registerInlayHintsProvider(
      documentSelector, new Provider(this.context)));
  }
  getState(): FeatureState { return { kind: 'static' }; }
  dispose() {}
}

class Provider implements InlayHintsProvider {
  constructor(private context: Ctx) {}

  decodeKind(kind: string): InlayHintKind | undefined {
    if (kind == 'type')
      return InlayHintKind.Type;
    if (kind == 'parameter')
      return InlayHintKind.Parameter;
    return undefined;
  }

  decode(hint: protocol.InlayHint): InlayHint {
    return {
      position: hint.position ?? hint.range.start,
      kind: this.decodeKind(hint.kind),
      label: hint.label.trim(),
      paddingLeft: hint.label.startsWith(' '),
      paddingRight: hint.label.endsWith(' '),
    };
  }

  async provideInlayHints(document: LinesTextDocument, range: Range, token: CancellationToken): Promise<InlayHint[]> {
    const request: protocol.InlayHintsParams = {
      textDocument: { uri: document.uri },
      range
    };

    const result = await this.context.client!.sendRequest(
      protocol.InlayHintsRequest.type, request, token);
    return result.map(this.decode, this);
  }
}
