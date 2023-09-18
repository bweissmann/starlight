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
  `you will recieve an error message and write the action you will take to fix it
  json
  {
    file: string, // the file to open
    instructions: string // the instructions to the code editing agent
  }` as const;

const prompt = `

# Introduction
In the domain of software development, encountering error messages is a common occurrence. These error messages often provide clues to the underlying issues in the code. The task here is to interpret these error messages and provide a set of instructions to fix the issues causing these errors.

# Input
The input will be a JSON object containing the following properties:
- \`error\`: A string that represents the error message encountered.
- \`codeSnippet\`: A string that represents the piece of code where the error occurred.

# Output Format
The output should be a JSON object with the following properties:
- \`file\`: A string that represents the file where the error occurred. This can be inferred from the error message or the code snippet.
- \`instructions\`: A string that represents the instructions to fix the error. This should be a clear, step-by-step guide that a code editing agent can follow to resolve the issue.

# Examples
## Example 1
### Input
\`\`\`json
{
  "error": "Uncaught ReferenceError: foo is not defined at script.js:2",
  "codeSnippet": "var bar = foo;"
}
\`\`\`
### Output
\`\`\`json
{
  "file": "script.js",
  "instructions": "Define the variable 'foo' before it is used in the code."
}
\`\`\`
## Example 2
### Input
\`\`\`json
{
  "error": "TypeError: Cannot read property 'length' of undefined at main.py:10",
  "codeSnippet": "print(len(my_list))"
}
\`\`\`
### Output
\`\`\`json
{
  "file": "main.py",
  "instructions": "Ensure that 'my_list' is defined and is not 'None' before trying to get its length."
}
\`\`\`

`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw: string): Promise<Prompt["inferred"]["returns"]> {
  return asJSON<Prompt["inferred"]["returns"]>(
    extractPossibleFencedSnippet(raw),
  );
}

// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "fix-error-message.ts";
  inferred: {
    inputs: string[];
    returns: { file: string; instructions: string };
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
