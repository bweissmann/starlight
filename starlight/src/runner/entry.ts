import 'dotenv/config';
import { zshDriver } from '@/agents/zsh-driver.js';
import { codeDriver } from '@/agents/code-driver-by-line-number.js';
import path from 'path';
import read, { fileExists } from '@/fs/read.js';
import ignore from 'ignore';
import tree from '@/fs/tree.js';
import { logger } from '@/utils.js';
import gatherContext from '@/agents/gather-context.js';
import { defaultCx } from '@/project/context.js';

/*

# Top Level Tasks:

Code generation and program planning should (likely?) be completely separable tasks
If the implementation plan is good then g35 should theoretically be able to do it
And if the code insertion is good then we should be able to test it even with bad plans

## Write in-context
  > llms work best for in-context writing (next token)
  > Print the prior 1-3 lines and ask it to write the rest as a 
  > diff with + lines. Then it can close by writing the next "real" line
  > If we already know the range, we can theoretically write the existing
  > content with - lines

## Need better programmatic thinking
  > hypothesis: the long system prompt is making it worse at thinking
  > first goal is to get very good high level thinking, instructions & pseudocode
  > we can either prompt engineer, or ask g4 to write a prompt for itself.

# Future Work:

## multi-file understanding & editing
  > documentation per file
  > tree-sitter, ctags, scip, llm summary
  
## testing / compilation errors
  > hotswap .proposal with .current and compile/run
*/

// const args = process.argv.slice(2).join(' ');
// await gatherContext(defaultCx(), args.trim().length > 0 ? args : `Write search`)

await zshDriver('how do i write a vscode extension?', '/Users/bweissmann/starlight')