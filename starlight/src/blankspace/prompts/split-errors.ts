import { Tx } from "@/project/context";
import { Forward, ImplOf } from "../utility-types";
import { chat } from "@/llm/chat";
import { g4, system } from "@/llm/utils";
import {
  extractFencedSnippets,
  extractPossibleFencedSnippet,
} from "@/tools/source-code-utils";
import asJSON from "@/llm/parser/json";
import asXML from "@/llm/parser/xml";
import { asTripleHashtagList } from "@/llm/parser/triple-hashtag";

const spec =
  `Split raw comamnd output into a list of errors. Keep the filename/linenumber info` as const;

const prompt = `

# Introduction
In the domain of software development and debugging, we often encounter raw command output that includes error messages. These error messages are typically associated with a specific file and line number. The task is to parse this raw command output and split it into a list of errors, while preserving the filename and line number information associated with each error.

# Output Format
The output should be a list of errors. Each error should be in a separate code-fenced block. The error message should include the filename and line number associated with the error.

# Examples
## Input
\`\`\`
Error: Uncaught TypeError: Cannot read property 'foo' of undefined at script.js:23
Error: Uncaught ReferenceError: bar is not defined at script.js:45
Error: Uncaught SyntaxError: Unexpected token '<' at index.html:12
\`\`\`
## Output
\`\`\`Error
Uncaught TypeError: Cannot read property 'foo' of undefined at script.js:23
\`\`\`
\`\`\`Error
Uncaught ReferenceError: bar is not defined at script.js:45
\`\`\`
\`\`\`Error
Uncaught SyntaxError: Unexpected token '<' at index.html:12
\`\`\`
`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw: string): Promise<Prompt["inferred"]["returns"]> {
  return extractFencedSnippets(raw) as unknown as number;
}

// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "split-errors.ts";
  inferred: {
    inputs: string[];
    returns: number;
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
