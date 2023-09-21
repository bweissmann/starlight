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
The user will provide you with an error message. Your task is to interpret this error message and generate instructions for a programmer on how to resolve the issue. You should specify the file that needs to be opened and provide a set of instructions to guide the programmer through the process of fixing the error. The information you need to complete this task can be found in the user messages.

Please remember to avoid specifying a particular output format for your response. The receiver should be free to respond in any format they prefer.

\`\`\`instructions
Write your response in the following format:

\`\`\`json
{
    "file": "the name of the file to open",
    "instructions": "the instructions to the programmer"
}
\`\`\`
Please replace "the name of the file to open" with the actual file name and "the instructions to the programmer" with the actual instructions.
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
    "instructions": "To resolve the error, open the 'main.py' file and locate the line number mentioned in the error message. Check the code at that line and ensure that the syntax is correct. If there are any missing or mismatched parentheses, brackets, or quotation marks, correct them accordingly. Save the file and run the program again to see if the error is resolved."
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "file": "index.html",
    "instructions": "To fix the error, open the 'index.html' file and go to the line number specified in the error message. Check the code at that line and make sure that all HTML tags are properly closed. If there are any missing closing tags or if any tags are nested incorrectly, correct them accordingly. Save the file and reload the webpage to see if the error is resolved."
}
$END_HYPOTHETICAL_OUTPUT$


`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "fix-error-instructions_v3.ts";
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
