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
    file: string, // the file to open
    instructions: string // the instructions to the code editing agent
  }` as const;

const prompt = `

# Task Statement
You are tasked with generating an action plan to fix a given error message. The action plan should be written in a way that it can be understood and executed by a code editing agent who does not have access to the original error message.

# Output Format
The output should be in XML format with the following structure:

\`\`\`xml
<Action>
  <File>...</File>
  <Instructions>...</Instructions>
</Action>
\`\`\`

Where:
- \`File\` is the file to be opened.
- \`Instructions\` are the steps that the code editing agent should follow to fix the error.

# Examples

## Example 1
**Input**
\`\`\`
Error: Uncaught TypeError: Cannot read property 'map' of undefined at App.js:25
\`\`\`

**Output**
\`\`\`xml
<Action>
  <File>App.js</File>
  <Instructions>Check line 25. There seems to be an attempt to use the 'map' function on an undefined object. Ensure the object is defined and has data before using the 'map' function.</Instructions>
</Action>
\`\`\`

## Example 2
**Input**
\`\`\`
Error: Module not found: Can't resolve './components/Profile' in '/src/App.js'
\`\`\`

**Output**
\`\`\`xml
<Action>
  <File>App.js</File>
  <Instructions>There seems to be an issue with importing the 'Profile' component. Check the path './components/Profile' and ensure the component exists at that location.</Instructions>
</Action>
\`\`\`

`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw: string): Promise<Prompt["inferred"]["returns"]> {
  return asXML<Prompt["inferred"]["returns"]>(raw);
}

// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "fix-error-message_v6.ts";
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
