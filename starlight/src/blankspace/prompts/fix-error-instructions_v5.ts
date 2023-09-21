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
    repond with "file" - the filename to open and "instructions" - telling the programmer what the issue is.` as const;

const prompt = `
Hello,
You will receive an error message from the user in an upcoming message. Your task is to analyze this error message and provide guidance to a programmer on how to rectify it. 

Please provide your response in two parts: 
1. "File" - Indicate the filename that needs to be opened for troubleshooting.
2. "Instructions" - Provide a detailed explanation of the identified issue and the steps required to fix it.

\`\`\`instructions
Write your response in the following format:

\`\`\`json
{
    "file": "filename",
    "instructions": "instructions on how to fix the issue"
}
\`\`\`
Please ensure that the filename and instructions are enclosed in quotes to form valid strings in the JSON object.
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
{
    "file": "main.py",
    "instructions": "The error message indicates that there is an undefined variable 'x' on line 10 of the 'main.py' file. To fix this issue, the programmer should declare and initialize the variable 'x' before using it on line 10."
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "file": "utils.py",
    "instructions": "The error message suggests that there is a syntax error on line 5 of the 'utils.py' file. To resolve this issue, the programmer should carefully review the code on line 5 and ensure that all syntax rules are followed correctly."
}
$END_HYPOTHETICAL_OUTPUT$


`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "fix-error-instructions_v5.ts";
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
