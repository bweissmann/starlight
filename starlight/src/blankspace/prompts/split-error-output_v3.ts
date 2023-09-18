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

const spec = `Split raw comamnd output into a list of errors. 
  Keep the filename/linenumber info.
  return a string[]
  Show example input/outputs in different programming languages.` as const;

const prompt = `

# Introduction
In the domain of software development and debugging, we often encounter raw command outputs that contain error messages. These error messages are crucial for identifying and fixing issues in the code. The task here is to parse these raw command outputs and split them into a list of errors, preserving the filename and line number information. The output should be an array of strings, where each string represents an individual error message.

# Output Format
The output should be a list of strings, where each string represents an individual error message. Each error message should include the filename and line number information. The output should be enclosed within code fences, with each error message in a separate code-fenced block.

# Examples

## Example 1
### Input
\`\`\`Input
Error: Uncaught TypeError: Cannot read property 'foo' of undefined at script.js:15
Error: Uncaught ReferenceError: bar is not defined at script.js:22
\`\`\`
### Output
\`\`\`Error
Uncaught TypeError: Cannot read property 'foo' of undefined at script.js:15
\`\`\`
\`\`\`Error
Uncaught ReferenceError: bar is not defined at script.js:22
\`\`\`

## Example 2
### Input
\`\`\`Input
Error: Unhandled exception type FileNotFoundException at Main.java:30
Error: Unhandled exception type IOException at Main.java:45
\`\`\`
### Output
\`\`\`Error
Unhandled exception type FileNotFoundException at Main.java:30
\`\`\`
\`\`\`Error
Unhandled exception type IOException at Main.java:45
\`\`\`

## Example 3
### Input
\`\`\`Input
Error: NameError: name 'baz' is not defined at script.py:10
Error: TypeError: 'NoneType' object is not subscriptable at script.py:20
\`\`\`
### Output
\`\`\`Error
NameError: name 'baz' is not defined at script.py:10
\`\`\`
\`\`\`Error
TypeError: 'NoneType' object is not subscriptable at script.py:20
\`\`\`

`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw: string): Promise<Prompt["inferred"]["returns"]> {
  return extractFencedSnippets(raw);
}

// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "split-error-output_v3.ts";
  inferred: {
    inputs: string[];
    returns: string[];
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
