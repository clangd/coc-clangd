import { commands, CompleteResult, ExtensionContext, sources, workspace } from 'coc.nvim';

export async function activate(context: ExtensionContext): Promise<void> {
  workspace.showMessage(`coc-clangd works!`);

  context.subscriptions.push(
    commands.registerCommand('coc-clangd.Command', async () => {
      workspace.showMessage(`coc-clangd Commands works!`);
    }),

    sources.createSource({
      name: 'coc-clangd completion source', // unique id
      shortcut: '[CS]', // [CS] is custom source
      priority: 1,
      triggerPatterns: [], // RegExp pattern
      doComplete: async () => {
        const items = await getItems();
        return items;
      }
    }),

    workspace.registerKeymap(
      ['n'],
      'coc-clangd-keymap',
      async () => {
        workspace.showMessage(`registerKeymap`);
      },
      { sync: false }
    ),

    workspace.registerAutocmd({
      event: 'InsertLeave',
      request: true,
      callback: () => {
        workspace.showMessage(`registerAutocmd on InsertLeave`);
      }
    })
  );
}

async function getItems(): Promise<CompleteResult> {
  return {
    items: [
      {
        word: 'TestCompletionItem 1'
      },
      {
        word: 'TestCompletionItem 2'
      }
    ]
  };
}
