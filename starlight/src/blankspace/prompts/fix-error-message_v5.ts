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

  Your action will have this XML format:
  {
    filename: string, // the file to open
    instructions: string // the instructions to the code editing agent
  }` as const;

const prompt = `

# Task Statement
You are tasked with generating an action plan to resolve a given error message. The action plan will be used by a code editing agent to fix the error. The agent does not have access to the original error message, so your action plan must be self-contained and provide all necessary information for the agent to understand and fix the error.

# Output Format
The output should be in XML format with the following structure:

\`\`\`XML
<Action>
  <filename>...</filename>
  <instructions>...</instructions>
</Action>
\`\`\`

Where:
- \`filename\` is the name of the file to be opened and edited.
- \`instructions\` are the steps that the code editing agent needs to follow to fix the error.

# Examples
**Input**
\`\`\`
Error: Uncaught TypeError: Cannot read property 'map' of undefined at App.js:25
\`\`\`
**Output**
\`\`\`XML
<Action>
  <filename>App.js</filename>
  <instructions>Check line 25. There seems to be a TypeError due to trying to use the 'map' function on an undefined object. Ensure the object is defined and has data before using the 'map' function.</instructions>
</Action>
\`\`\`

**Input**
\`\`\`
Error: Failed to compile. ./src/index.js Module not found: Can't resolve './App' in '/Users/user/Desktop/project/src'
\`\`\`
**Output**
\`\`\`XML
<Action>
  <filename>./src/index.js</filename>
  <instructions>The module './App' cannot be found. Check the import statement in './src/index.js' and ensure the path to './App' is correct.</instructions>
</Action>
\`\`\`

`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw: string): Promise<Prompt["inferred"]["returns"]> {
  return asXML<{ filename: string; instructions: string }>(raw);
}

// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "fix-error-message_v5.ts";
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
