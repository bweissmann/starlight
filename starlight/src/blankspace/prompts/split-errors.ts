import { chat } from "@/llm/chat";
import { g35, system } from "@/llm/utils";
import { Tx } from "@/project/context";
import { extractFencedSnippets } from "@/tools/source-code-utils";
import { Forward, ImplOf, SpecOf } from "../utility-types";

export type Prompt = {
  spec: typeof spec;
  inferred: {
    inputs: { errorBlob: string };
    returns: string[];
  };
};

const spec = {
  tag: "split-errors",
} as const;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  return await chat(
    tx,
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
      ELIFECYCLE Command failed with exit code 2.
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
      `${inputs.errorBlob}`
    )
  ).then(extractFencedSnippets);
};

export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
