import { BaseLanguageClient, ExtensionContext, State, StaticFeature, workspace } from 'coc.nvim';
import { ClientCapabilities, NotificationType, Range, ServerCapabilities, TextDocumentClientCapabilities, VersionedTextDocumentIdentifier } from 'vscode-languageserver-protocol';

// Contains the highlighting information for a specified line. Mirrors the
// structure in the semantic highlighting proposal for LSP.
interface SemanticHighlightingInformation {
  // The zero-based line position in the text document.
  line: number;
  // A base64 encoded string representing every single highlighted characters
  // with its start position, length and the "lookup table" index of of the
  // semantic highlighting Text Mate scopes.
  tokens: string;
}

// Parameters for the semantic highlighting (server-side) push notification.
// Mirrors the structure in the semantic highlighting proposal for LSP.
interface SemanticHighlightingParams {
  // The text document that has to be decorated with the semantic highlighting
  // information.
  textDocument: VersionedTextDocumentIdentifier;
  // An array of semantic highlighting information.
  lines: SemanticHighlightingInformation[];
}

// A SemanticHighlightingToken decoded from the base64 data sent by clangd.
interface SemanticHighlightingToken {
  // Start column for this token.
  character: number;
  // Length of the token.
  length: number;
  // The TextMate scope index to the clangd scope lookup table.
  scopeIndex: number;
  kind: string;
}

// A line of decoded highlightings from the data clangd sent.
export interface SemanticHighlightingLine {
  // The zero-based line position in the text document.
  line: number;
  // All SemanticHighlightingTokens on the line.
  tokens: SemanticHighlightingToken[];
}

export class SemanticHighlightingFeature implements StaticFeature {
  private scopeTable: string[][] = [];

  constructor(client: BaseLanguageClient, context: ExtensionContext) {
    context.subscriptions.push(
      client.onDidChangeState(({ newState }) => {
        if (newState === State.Running) {
          const notification = new NotificationType<SemanticHighlightingParams, void>('textDocument/semanticHighlighting');
          client.onNotification(notification, this.handleNotification.bind(this));
        }
      })
    );
  }

  initialize(capabilities: ServerCapabilities) {
    const serverCapabilities: ServerCapabilities & { semanticHighlighting?: { scopes: string[][] } } = capabilities;
    if (!serverCapabilities.semanticHighlighting) return;

    this.scopeTable = serverCapabilities.semanticHighlighting.scopes;
  }

  fillClientCapabilities(capabilities: ClientCapabilities) {
    const textDocumentCapabilities: TextDocumentClientCapabilities & { semanticHighlightingCapabilities?: { semanticHighlighting: boolean } } = capabilities.textDocument!;
    textDocumentCapabilities.semanticHighlightingCapabilities = {
      semanticHighlighting: true,
    };
  }

  async handleNotification(params: SemanticHighlightingParams) {
    // use https://github.com/jackguo380/vim-lsp-cxx-highlight to do highlighting
    const lines: SemanticHighlightingLine[] = params.lines.map((line) => ({ line: line.line, tokens: this.decodeTokens(line.tokens) }));
    const symbols: any[] = [];

    for (const line of lines) {
      for (const token of line.tokens) {
        symbols.push({
          id: 0,
          kind: token.kind,
          ranges: [Range.create(line.line, token.character, line.line, token.character + token.length)],
          parentKind: 'Unknown', // FIXME
          storage: 'None', // FIXME
        });
      }
    }

    const doc = workspace.getDocument(params.textDocument.uri);
    await workspace.nvim.call('lsp_cxx_hl#hl#notify_symbols', [doc.bufnr, symbols]);
  }

  // Converts a string of base64 encoded tokens into the corresponding array of SemanticHighlightingToken.
  private decodeTokens(tokens: string): SemanticHighlightingToken[] {
    const scopeMask = 0xffff;
    const lenShift = 0x10;
    const uint32Size = 4;
    const buf = Buffer.from(tokens, 'base64');
    const retTokens: SemanticHighlightingToken[] = [];
    for (let i = 0, end = buf.length / uint32Size; i < end; i += 2) {
      const start = buf.readUInt32BE(i * uint32Size);
      const lenKind = buf.readUInt32BE((i + 1) * uint32Size);
      const scopeIndex = lenKind & scopeMask;
      const len = lenKind >>> lenShift;
      const kind = this.scopeTable[scopeIndex][0];
      retTokens.push({ character: start, scopeIndex: scopeIndex, length: len, kind: this.decodeKind(kind) });
    }

    return retTokens;
  }

  private decodeKind(kind: string) {
    // https://github.com/llvm/llvm-project/blob/9adc7fc3cdf571bd70d5f8bda4e2e9c233c5fd63/clang-tools-extra/clangd/SemanticHighlighting.cpp#L477
    switch (kind) {
      case 'entity.name.function.cpp':
        return 'Function';
      case 'entity.name.function.method.cpp':
        return 'Method';
      case 'entity.name.function.method.static.cpp':
        return 'StaticMethod';
      case 'variable.other.cpp':
        return 'Variable';
      case 'variable.other.local.cpp':
        return 'LocalVariable';
      case 'variable.parameter.cpp':
        return 'Parameter';
      case 'variable.other.field.cpp':
        return 'Field';
      case 'variable.other.field.static.cpp':
        return 'StaticField';
      case 'entity.name.type.class.cpp':
        return 'Class';
      case 'entity.name.type.enum.cpp':
        return 'Enum';
      case 'variable.other.enummember.cpp':
        return 'EnumConstant';
      case 'entity.name.type.typedef.cpp':
        return 'Typedef';
      case 'entity.name.type.dependent.cpp':
        return 'DependentType';
      case 'entity.name.other.dependent.cpp':
        return 'DependentName';
      case 'entity.name.namespace.cpp':
        return 'Namespace';
      case 'entity.name.type.template.cpp':
        return 'TemplateParameter';
      case 'entity.name.type.concept.cpp':
        return 'Concept';
      case 'storage.type.primitive.cpp':
        return 'Primitive';
      case 'entity.name.function.preprocessor.cpp':
        return 'Macro';
      case 'meta.disabled':
        return 'InactiveCode';
      default:
        return 'Unknown';
    }
  }
}
