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
  `The user will give you an error message and you'll write the action you will take to fix it. 
  The receiver of your action won't have access to the original error unless you give it to them.

  Your action will have this JSON format:
  {
    filename: string, // the file to open
    instructions: string // the instructions to the code editing agent
  }` as const;

const prompt = `

# Task Statement
You are tasked with generating a corrective action based on an error message provided by the user. The corrective action should be in the form of instructions to a code editing agent. The agent will not have access to the original error message, so your instructions must be clear and self-contained.

# Output Format
Your output should be a JSON object with the following structure:

\`\`\`json
{
  "filename": "<string>", // the file to open
  "instructions": "<string>" // the instructions to the code editing agent
}
\`\`\`

# Examples
**Input**
\`\`\`
Error: Uncaught TypeError: Cannot read property 'map' of undefined at App.js:25
\`\`\`

**Output**
\`\`\`json
{
  "filename": "App.js",
  "instructions": "Go to line 25. There is a TypeError being thrown because we're trying to use the 'map' function on an undefined value. Please check the data source or the variable before this line to ensure it is defined and is an array."
}
\`\`\`

**Input**
\`\`\`
Error: ReferenceError: 'x' is not defined at script.js:10
\`\`\`

**Output**
\`\`\`json
{
  "filename": "script.js",
  "instructions": "Go to line 10. There is a ReferenceError because 'x' is not defined. Please define 'x' before this line or check for any spelling mistakes."
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
  filename: "fix-error-message_v4.ts";
  inferred: {
    inputs: string[];
    returns: { filename: string; instructions: string };
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
