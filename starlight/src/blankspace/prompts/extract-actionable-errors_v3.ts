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
  `Take this stdout/stderr output and extract each of the actionable errors so we have them in a list. some of the ouput is errors and some is normal stdout` as const;

const prompt = `
Hello,

Your task is to analyze a given stdout/stderr output and identify all the actionable errors present in it. The output will be provided in the user messages and it will consist of a mix of standard output and error messages. Your goal is to sift through this output and create a list of all the actionable errors. Please note that not every line in the output will be an error, so you need to carefully distinguish between normal stdout and error messages.

\`\`\`instructions
Write your response in the following format:

For each actionable error, provide it in a separate code block. Each code block should be marked with "error" as the language. Here's an example:

\`\`\`error
First actionable error message
\`\`\`

\`\`\`error
Second actionable error message
\`\`\`

Continue this pattern for each actionable error you extract.
\`\`\`

`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw:string): Promise<Prompt["inferred"]["returns"]> {
  return extractFencedSnippets(raw);
}

const hypotheticalResponses = `


$START_HYPOTHETICAL_OUTPUT$
Hello,

After analyzing the given stdout/stderr output, I found the following actionable errors:

\`\`\`error
Error: Unhandled exception in thread started by <_bootstrap._Bootstap object at 0x7f1e0d3f1a90>
\`\`\`

\`\`\`error
SyntaxError: Unexpected identifier in JSON at position 1024
\`\`\`

These are the actionable errors that need to be addressed. The first one indicates an unhandled exception in a thread, which might be due to a failure in error handling in your code. The second one is a syntax error in your JSON file, possibly due to an unexpected identifier at the specified position.
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
Hello,

Based on the stdout/stderr output, I have identified the following actionable errors:

\`\`\`error
FileNotFoundError: [Errno 2] No such file or directory: 'data.txt'
\`\`\`

\`\`\`error
PermissionError: [Errno 13] Permission denied: '/var/log/syslog'
\`\`\`

These errors are actionable and need immediate attention. The first one is a FileNotFoundError which suggests that the 'data.txt' file does not exist in the specified directory. The second error is a PermissionError, which means the program does not have the necessary permissions to access '/var/log/syslog'.
$END_HYPOTHETICAL_OUTPUT$


`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "extract-actionable-errors_v3.ts";
  inferred: {
    inputs: string[];
    returns: string[];
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
