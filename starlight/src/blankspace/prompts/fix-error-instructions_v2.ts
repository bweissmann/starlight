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

const spec =
  `The user will give you an error message. you'll give instructions to a programmer on how to fix it.
   heres your output format:
  {
    file: string, // the file to open
    instructions: string // the instructions to the programmer
  }` as const;

const prompt = `
Hello,

The user will provide an error message in a subsequent message. Your task is to analyze this error message and generate instructions for a programmer on how to fix it. You should identify the file that needs to be opened and provide clear, step-by-step instructions for the programmer to follow.

Please note that while the user has provided a specific output format, you are not limited to this structure. You can respond in any format that you find most appropriate and effective.

# Optimal Output Format
The optimal output format for this task would be a JSON object with two fields: "file" and "instructions". 

# Instructions to GPT-4
\`\`\`instructions
Write your response in the following format:

\`\`\`json
{
    "file": "<the file to open>",
    "instructions": "<the instructions to the programmer>"
}
\`\`\`
Replace <the file to open> with the name of the file that needs to be opened and <the instructions to the programmer> with the instructions on how to fix the error.
\`\`\`
`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw:string): Promise<Prompt["inferred"]["returns"]> {
  return asJSON<Prompt["inferred"]["returns"]>(maybeExtractSingleFencedSnippet(raw));
}

const hypotheticalResponses = `


$START_HYPOTHETICAL_OUTPUT$
\`\`\`json
{
    "file": "main.py",
    "instructions": "It seems there's a syntax error on line 42. The error message suggests that there's a missing parenthesis. Please check the line and add the missing parenthesis. Also, ensure that all other lines of code are correctly formatted and all opened parentheses, brackets, and braces are properly closed."
}
\`\`\`
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
\`\`\`json
{
    "file": "database_config.json",
    "instructions": "The error message indicates that the database connection has failed. This could be due to incorrect database credentials in your 'database_config.json' file. Please verify the database username, password, and host details in this file. If the credentials are correct, ensure that the database server is up and running."
}
\`\`\`
$END_HYPOTHETICAL_OUTPUT$


`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "fix-error-instructions_v2.ts";
  inferred: {
    inputs: string[];
    returns: {
      file: string;
      instructions: string;
    };
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
