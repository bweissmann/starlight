import { chat } from "@/llm/chat";
import { g4, system } from "@/llm/utils";
import { Tx } from "@/project/context";
import { maybeExtractSingleFencedSnippet } from "@/llm/parser/code-fence";

const metaprompt = `
# Introduction
Your job is to specific which output parser should be used to transform the output of a specific prompt to GPT-4 into the requested format.
The user will provide below both 
(1) Prompt - The prompt they will run with GPT-4
(2) Typescript ReturnType Annotation - The expected javascript object returned by your parser. 
I will provide you with the prompt and you will write which output parser you will use.

Here are the available parsing functions:
function extractFencedSnippets(raw: string): string[] // extracts all <content> within \`\`\`language <content> \`\`\` blocks
function maybeExtractSingleFencedSnippet(raw: string): string // if a single fenced block exists, extracts the <content>, otheriwise return the raw string.
function maybeStripQuotes(raw: string): string // If the string starts and ends with " or ', remove them and return the inner result. otherwise return the raw string.
function asJSON<T>(raw:string): T // uses JSON.parse under the hood
function asXML<T>(raw:string>: Promise<T> // uses xml2js.parseStringPromise under the hood

# Format
You will write the following function:
\`\`\`typescript
async function parse(raw:string): Promise<ReturnType> {
<fill in>
}
\`\`\`

Assume that your function will be called with the "raw" as the direct output of GPT-4 with the user's prompt. 

# Details
If the prompt instructs that responses should be within code-fenced blocks, then make sure that you properly extract them with either maybeExtractSingleFencedSnippet or extractFencedSnippets.
If you attempt to parse JSON or XML without extracting the code-fence, the parser will fail (this makes intuitive sense)

Think about what the output will look *actually* like as a raw string. 

If the ReturnType Typescript Annotation is a union of constants such as "one" | "two" | "three", make sure your result is narrowed correctly. If necessary, cast your result to "as ReturnType" so that it type checks correctly.

`;
export async function GENERATE_outputParser(
  tx: Tx,
  prompt: string,
  hypotheticalResponses: string,
  tsAnnotation: string
): Promise<string> {
  return await chat(
    tx,
    g4(
      system(metaprompt),
      `# Prompt\n${prompt}\n\n# Hypothetical Responses\n${hypotheticalResponses}\n\n# Typescript ReturnType Annotation\ntype ReturnType = ${tsAnnotation}`
    )
  ).then(maybeExtractSingleFencedSnippet);
}
