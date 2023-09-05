import 'dotenv/config';
import dedent from 'dedent';
import { executeCommand } from '@/agents/zsh-driver';
import { chat } from '@/llm/chat';
import { g4_t04, system, user } from '@/llm/utils';
import { loadProjectContext } from '@/project/loaders';
import { extractPossibleCodeSnippet } from '@/tools/source-code-utils';
import asJSON from '@/llm/parser/json';
import { codePlanner } from '@/agents/code-planner';
import { Rx, defaultRx } from '@/project/context';
import { getFilepath } from '@/fs/get-filepath';

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

type CodeEditAction = { file: string, instructions: string }

// const error = await run('scripts/s')
// const action = await chat(
//   g4_t04(
//     system(
//       dedent`
//     # Task
//     Fix the following error message in the codebase.

//     Write your response in the format:
//     ## Explanation
//     {10-20 words on how to fix the error}

//     ## Action
//     {an action, in its desired format}


//     # Context
//     ${await loadProjectContext('.')}

//     # Possible Actions
//     - * launch editor *
//     Launch a code editing agent to modify a source file.

//     Action format:
//     \`\`\`json
//     {
//       file: string, // the file to open
//       instructions: string // the instructions to the code editing agent
//     }

//     `),
//     user`
//     # Error
//     ${error}
//     `
//   )
// )
//   .then(extractPossibleCodeSnippet)
//   .then(asJSON<CodeEditAction>)

// await take(action)

// async function run(command: string) {
//   try {
//     return await executeCommand(command);
//   } catch (e: any) {
//     return e.toString()
//   }
// }

async function take(action: CodeEditAction) {
  await codePlanner(defaultRx(), action.file, action.instructions)
}

take({ file: await getFilepath('search'), instructions: 'move all the imports to the top of the file' })