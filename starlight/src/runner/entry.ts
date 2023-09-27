import "@/runner/initializer";
import { executeCommand } from "@/agents/zsh-driver";
import { loadBuildSystemContext } from "@/project/loaders";
import { codePlanner } from "@/agents/code-planner";
import { getFilepath } from "@/fs/get-filepath";
import { defaultCx, defaultTx } from "@/project/context";
import { emit } from "@/redis";
import { safely } from "@/utils";
import blankspace from "@/blankspace/blankspace";
import TASk_fixErrors from "@/tasks/fix-errors";
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

const cx = defaultCx(process.argv[2] || "/Users/bweissmann/starlight/midnight");
try {
  await TASk_fixErrors(cx);
} catch (e: unknown) {
  console.error("Error:", e);
  if (e instanceof Error) {
    console.error(e.stack);
  }
}
