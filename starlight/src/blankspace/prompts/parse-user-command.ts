import { Tx } from "@/project/context";
import { Forward, ImplOf } from "../utility-types";
import { chat } from "@/llm/chat";
import { g4, system } from "@/llm/utils";
import {
  extractFencedSnippets,
  maybeExtractSingleFencedSnippet,
} from "@/llm/parser/code-fence";
import asJSON from "@/llm/parser/json";
import asXML from "@/llm/parser/xml";
import { asTripleHashtagList } from "@/llm/parser/triple-hashtag";
import { maybeStripQuotes } from "@/llm/parser/quotes";

const spec = `parse the user input into which action they want to take. 
        Here\'s what we asked for user input: \`\`\`(p)roject, (m)odify, (c)reate, (z)sh: \`\`\` 
        Your prompt will only be given inputs that are not an exact string match.
        Maybe they misspelled a command or described it in other words.
        The output should be type Command = "project" | "create file" | "modify file" | "zsh";` as const;

const prompt = `
Hello,

Your task is to interpret the user input and determine the action they wish to take. The user will provide their input in subsequent messages. The commands they may want to execute are: "project", "create file", "modify file", or "zsh". However, their input may not be an exact match to these commands. They might have misspelled a command or described it in different words. Your job is to understand their intention and output the correct command.

\`\`\`instructions
Write your response in the following format:
\`\`\`json
{
    "command": "project" | "create file" | "modify file" | "zsh"
}
\`\`\`
Please ensure that the "command" field contains one of the following strings: "project", "create file", "modify file", or "zsh".
\`\`\`
`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw:string): Promise<Prompt["inferred"]["returns"]> {
    const parsed = asJSON<{command: Prompt["inferred"]["returns"]}>(maybeExtractSingleFencedSnippet(raw));
    return parsed.command;
}

const hypotheticalResponses = `


$START_HYPOTHETICAL_OUTPUT$
\`\`\`json
{
    "command": "project"
}
\`\`\`
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
\`\`\`json
{
    "command": "create file"
}
\`\`\`
$END_HYPOTHETICAL_OUTPUT$


`;
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
