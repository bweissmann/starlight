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
    file: string, // the file to open
    instructions: string // the instructions to the code editing agent
  }` as const;

const prompt = `

# Task Statement
You are tasked with generating a set of actions to resolve a given error message. The error message will be provided to you, and you are to formulate a response detailing the file to be opened and the instructions to be followed in order to rectify the error. It is important to note that the recipient of your action will not have access to the original error message unless you provide it to them.

# Output Format
Your output should be a JSON object with the following structure:

\`\`\`json
{
  "file": "<string>", // the file to open
  "instructions": "<string>" // the instructions to the code editing agent
}
\`\`\`

# Examples
**Input**
\`\`\`
Uncaught TypeError: Cannot read property 'map' of undefined at App.js:25
\`\`\`

**Output**
\`\`\`json
{
  "file": "App.js",
  "instructions": "Check line 25. There seems to be a TypeError due to trying to read a property 'map' of an undefined object. Ensure the object is defined before trying to access its properties."
}
\`\`\`

**Input**
\`\`\`
ReferenceError: event is not defined at script.js:15
\`\`\`

**Output**
\`\`\`json
{
  "file": "script.js",
  "instructions": "Check line 15. There is a ReferenceError because 'event' is not defined. Make sure 'event' is defined in the scope of its usage."
}
\`\`\`

`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw: string): Promise<Prompt["inferred"]["returns"]> {
  return asJSON<{ file: string; instructions: string }>(raw);
}

// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "fix-error-message_v3.ts";
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
