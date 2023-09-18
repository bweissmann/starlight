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
  `parse the user input into which action they want to take. Here's what we asked the user. \`\`\`(p)roject, (m)odify, (c)reate, (z)sh: \`\`\` Your prompt will only be given inputs that are not an exact string match. Maybe they misspelled a command or described it in other words. Output should be type Command = \"project\" | \"create file\" | \"modify file\" | \"zsh\";` as const;

const prompt = `

# Task Statement
Your task is to develop a model that can interpret user input and map it to one of the following commands: "project", "create file", "modify file", or "zsh". The user input may not be an exact match to these commands; it could be a misspelling or a description of the command in other words. 

# Output Format
The output should be a string that matches one of the following commands: "project", "create file", "modify file", or "zsh". The output should be enclosed within a code fence block with the identifier "Command".

For example:
\`\`\`Command
project
\`\`\`

# Examples
## Example 1
### Input
\`\`\`Input
I want to start a new projct
\`\`\`
### Output
\`\`\`Command
project
\`\`\`

## Example 2
### Input
\`\`\`Input
I need to change a file
\`\`\`
### Output
\`\`\`Command
modify file
\`\`\`

## Example 3
### Input
\`\`\`Input
I want to use z shell
\`\`\`
### Output
\`\`\`Command
zsh
\`\`\`

## Example 4
### Input
\`\`\`Input
I need to make a new file
\`\`\`
### Output
\`\`\`Command
create file
\`\`\`

`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw: string): Promise<Prompt["inferred"]["returns"]> {
  return extractPossibleFencedSnippet(raw) as Prompt["inferred"]["returns"];
}

// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "parse-user-command.ts";
  inferred: {
    inputs: string[];
    returns: "project" | "create file" | "modify file" | "zsh";
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
