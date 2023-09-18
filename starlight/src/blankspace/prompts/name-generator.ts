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
  `Given this prompt, come up with a one to four word name for the prompt, all lowercase, dash-separated. I prefer a verb to be the first word if it makes sense.` as const;

const prompt = `

# Task Statement
Your task is to generate a concise, one to four word name for the given prompt. The name should be in all lowercase and words should be separated by dashes. If possible, the first word should be a verb. The name should be relevant and descriptive of the prompt content.

# Output Format
The output should be a single string, enclosed within a code fence block. The string should contain one to four words, all in lowercase, separated by dashes. 

\`\`\`name
<your-name-here>
\`\`\`

# Examples
## Example 1
**Input**
\`\`\`
Create a program that sorts a list of numbers in ascending order.
\`\`\`
**Output**
\`\`\`name
sort-number-list
\`\`\`

## Example 2
**Input**
\`\`\`
Design a user interface for a mobile banking application.
\`\`\`
**Output**
\`\`\`name
design-banking-ui
\`\`\`

`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw: string): Promise<Prompt["inferred"]["returns"]> {
  return extractPossibleFencedSnippet(raw);
}

// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "Sure, I can help with that. However, I need the actual prompt to generate a name. Could you please provide it?.ts";
  inferred: {
    inputs: string[];
    returns: string;
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
