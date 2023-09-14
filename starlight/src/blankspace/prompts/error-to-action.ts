import { chat } from "@/llm/chat";
import { g4_t04, system_dedent, user } from "@/llm/utils";
import { Tx } from "@/project/context";
import { extractPossibleFencedSnippet } from "@/tools/source-code-utils";
import { loadBuildSystemContext } from "@/project/loaders";
import asJSON from "@/llm/parser/json";
import { Forward, ImplOf } from "../utility-types";

type Inferred = {
  inputs: { error: string };
  returns: CodeEditAction;
};

const spec = {
  tag: "error-to-actions",
} as const;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  return await chat(
    tx,
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
    \`\`\`
    `,
      user`
    # Error
    ${inputs.error}
    `
    )
  )
    .then(extractPossibleFencedSnippet)
    .then(asJSON<CodeEditAction>);
};

export type CodeEditAction = { file: string; instructions: string };

export type Prompt = {
  spec: typeof spec;
  inferred: Inferred;
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec,
  forward,
};
