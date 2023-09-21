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
    repond with:
    "file" - the filename to open
    and
    "instructions" - telling the programmer what the issue is.` as const;

const prompt = `
Hello,
You will receive an error message in the user messages. Your task is to analyze this error and provide guidance to a programmer on how to rectify it. Your response should include the following:

1. "file" - Identify the filename that needs to be opened to address the error.
2. "instructions" - Provide clear and concise instructions explaining the nature of the issue and how it can be resolved.

Please ensure your response is clear and detailed enough for a programmer to understand and act upon.

\`\`\`instructions
Write your response in the following format:

\`\`\`json
{
    "file": "filename",
    "instructions": "instructions on how to fix the issue"
}
\`\`\`
Please ensure that the filename and instructions are enclosed in quotes.
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
**Hypothetical Response 1:**



$START_HYPOTHETICAL_OUTPUT$
{
    "file": "main.py",
    "instructions": "The error message indicates that there is an undefined variable 'x' on line 10 of the 'main.py' file. To fix this issue, you need to declare and define the variable 'x' before line 10."
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "file": "utils.py",
    "instructions": "The error message suggests that there is an import error on line 5 of the 'utils.py' file. To resolve this issue, you should check if the required module or package is installed and properly imported. If not, install the missing module or correct the import statement."
}
$END_HYPOTHETICAL_OUTPUT$




**Hypothetical Response 2:**

$START_OF_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "file": "database.py",
    "instructions": "The error message indicates a connection error on line 20 of the 'database.py' file. To fix this issue, you should verify that the database server is running and accessible. Check the database connection settings and ensure they are correct. If the issue persists, contact the database administrator for further assistance."
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "file": "config.ini",
    "instructions": "The error message suggests that there is a configuration error in the 'config.ini' file. To resolve this issue, open the 'config.ini' file and verify that all required settings are correctly specified. Make sure there are no typos, missing values, or incorrect formatting. If necessary, consult the documentation or seek help from a senior developer to ensure the configuration is set up correctly."
}
$END_HYPOTHETICAL_OUTPUT$

$END_OF_OUTPUT$
`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "fix-error-instructions_v6.ts";
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
