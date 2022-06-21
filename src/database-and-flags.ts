import { workspace } from 'coc.nvim';
import * as fs from 'fs';
import * as path from 'path';

export function closestCompilationDatabase(cwd: string, candidates: string[]): string {
  // If the workspace does not exists we just return '' which is invalid.
  // In this case `clangd` will ignore the option and try other means to find the db.
  if (!fs.existsSync(cwd)) return '';

  // Expand paths to be fully qualified. Also expands environment variables
  // and ${CWD} to the *C*urrent *W*orkspace *D*irectory (see workspace.expand).
  // NOTE: This is even better than the current working directory, because you
  // can start vim in a subdirectory of your project and still get working completion.
  const expand = (item: string): string => {
    return workspace.expand(item.replace('${CWD}', cwd));
  };
  const expandend_candidates = candidates.map(expand);

  // Return the first (sorting matters!) candidate directory that contains a
  // compilation database. Otherwise return the empty string.
  let rv = '';
  for (const candidate of expandend_candidates) {
    if (fs.existsSync(candidate + path.sep + 'compile_commands.json')) {
      rv = candidate;
      break;
    }
  }

  return rv;
}
