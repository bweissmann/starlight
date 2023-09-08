import "dotenv/config";
import "source-map-support/register.js";
import { executeCommand } from "@/agents/zsh-driver";
import { chat } from "@/llm/chat";
import { g35, g4_t04, system, system_dedent, user } from "@/llm/utils";
import { loadBuildSystemContext } from "@/project/loaders";
import {
  extractCodeSnippets,
  extractPossibleCodeSnippet,
} from "@/tools/source-code-utils";
import asJSON from "@/llm/parser/json";
import { codePlanner } from "@/agents/code-planner";
import { getFilepath } from "@/fs/get-filepath";
import { defaultTx } from "@/project/context";

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

const tx = defaultTx();
const errorBlob = await run("pnpm run tsc");
const errors = await chat(
  tx.spawn(),
  g35(
    system`
    # Introduction
    Here is the output from running a nodejs project.
    Your task is to separate out each error in the stdout.
    Respond by repeating each error inside its own three backticks.

    # Examples

    ## Scenario 1: One Error only

    [input]
    Command exited with code 1.
    Output: 
    Error: 
      src/tools/source-code-utils.ts(127,5): error TS2322: Type 'Promise<string>' is not assignable to type 'string'.

    [output]
    \`\`\`error
          src/tools/source-code-utils.ts(127,5): error TS2322: Type 'Promise<string>' is not assignable to type 'string'.
    \`\`\`

    ## Scenario 2: Multiple Errors
    [input]
    Command exited with code 1.
    Output: 
      > starlight@0.0.1 tsc /Users/bweissmann/starlight/starlight
      > tsc --noEmit -p tsconfig.nopropose.json
      src/agents/code-planner.ts(123,9): error TS2304: Cannot find name 'spawnChild'.
      src/runner/shell.ts(76,29): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Tx'.
      src/tools/source-code-utils.ts(127,5): error TS2322: Type 'Promise<string>' is not assignable to type 'string'.
       ELIFECYCLE  Command failed with exit code 2.
    Error:

    [output]
    \`\`\`error
          src/agents/code-planner.ts(123,9): error TS2304: Cannot find name 'spawnChild'.
    \`\`\`
    \`\`\`error
          src/runner/shell.ts(76,29): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Tx'.
    \`\`\`
    \`\`\`error
          src/tools/source-code-utils.ts(127,5): error TS2322: Type 'Promise<string>' is not assignable to type 'string'.
    \`\`\`
    `,
    `${errorBlob}`
  )
);
const error = extractCodeSnippets(errors)[0];
const action = await chat(
  tx.spawn(),
  g4_t04(
    system_dedent`
    # Task
    Fix the following error message in the codebase.

    Write your response in the format:
    ## Explanation
    {10-20 words on how to fix the error}

    ## Action
    {an action, in its desired format}

    # Context
    ${await loadBuildSystemContext(tx.cx)}

    # Possible Actions
    - * launch editor *
    Launch a code editing agent to modify a source file.

    Action format:
    \`\`\`json
    {
      file: string, // the file to open
      instructions: string // the instructions to the code editing agent
    }

    `,
    user`
    # Error
    ${error}
    `
  )
)
  .then(extractPossibleCodeSnippet)
  .then(asJSON<CodeEditAction>);

await take(action);

async function run(command: string) {
  try {
    return await executeCommand(command, { verbose: true });
  } catch (e: any) {
    return e.toString();
  }
}

type CodeEditAction = { file: string; instructions: string };

async function take(action: CodeEditAction) {
  await codePlanner(
    tx.spawn(),
    await getFilepath(tx.spawn(), action.file),
    action.instructions
  );
}

// take({
//   file: "source-code-utils",
//   instructions: "add a function reformat(sourceCode: string):string, which uses prettier to format the code",
// });
