import { workspace as coc_workspace } from 'coc.nvim';
import * as fs from 'fs';
import * as path from 'path';

export function closestCompilationDatabase(workspace: string, candidates: string[]): string {
  // If the workspace does not exists we just return '' which is invalid.
  // In this case `clangd` will ignore the option and try other means to find the db.
  if (!fs.existsSync(workspace)) return '';

  // Expand paths to be fully qualified. Also expands environment variables
  // and ${CWD} to the *C*urrent *W*orkspace *D*irectory (see workspace.expand).
  // NOTE: This is even better than the current working directory, because you
  // can start vim in a subdirectory of your project and still get working completion.
  const expand = (item: string): string => {
    return coc_workspace.expand(item.replace('${CWD}', workspace));
  };
  const expandend_candiates = candidates.map(expand);

  // Return the first (sorting matters!) candidate directory that contains a
  // compilation database. Otherwise return the empty string.
  let rv = '';
  for(const candidate of expandend_candiates) {
    if(fs.existsSync(candidate + path.sep + 'compile_commands.json')) {
      rv = candidate;
      break;
    }
  }

  return rv;
}
