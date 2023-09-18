import "dotenv/config";
import "source-map-support/register.js";
import { executeCommand } from "@/agents/zsh-driver";
import { chat } from "@/llm/chat";
import { g4_t04, system_dedent, user } from "@/llm/utils";
import { loadBuildSystemContext } from "@/project/loaders";
import { extractPossibleFencedSnippet } from "@/tools/source-code-utils";
import asJSON from "@/llm/parser/json";
import { codePlanner } from "@/agents/code-planner";
import { getFilepath } from "@/fs/get-filepath";
import { defaultTx } from "@/project/context";
import { emit } from "@/redis";
import { safely } from "@/utils";
import blankspace from "@/blankspace/blankspace";
import { generatePrompt } from "@/blankspace/main";
import getInput from "@/tools/user-input";
import chalk from "chalk";
import { logger } from "@/utils"
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

const tx = defaultTx(process.argv[2]);
await emit(tx, "INIT", {});
console.log(tx.rx.id);

const errorBlob = await safely(executeCommand, "pnpm run tsc");

const errors = await blankspace
  .build(
    `Split raw comamnd output into a list of errors. 
  Keep the filename/linenumber info.
  return a string[]
  Show example input/outputs in different programming languages.`
  )
  .with(tx)
  .run([errorBlob]);

const action = await blankspace
  .build(
    `The user will give you an error message and you'll write the action you will take to fix it. 
  The receiver of your action won't have access to the original error unless you give it to them.

  Your action will have this JSON format:
  {
    file: string, // the file to open
    instructions: string // the instructions to the code editing agent
  }`
  )
  .with(tx)
  .run([
    `# Context
  ${await loadBuildSystemContext(tx.cx)}
  `,
    errors[0]
  ]);

throw "done!";

await take(action);

type CodeEditAction = { file: string; instructions: string };
async function take(action: CodeEditAction) {
  await codePlanner(
    tx.spawn(),
    await getFilepath(tx.spawn(), action.file),
    action.instructions
  );
}
