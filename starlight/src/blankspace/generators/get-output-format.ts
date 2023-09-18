import { sequence } from "@/llm/chat";
import { g35, g4, g4_t04, system } from "@/llm/utils";
import { Tx } from "@/project/context";
import { extractFencedSnippets } from "@/tools/source-code-utils";

const stepone = `
# Introduction
Your job is to specific which output parser should be used on the output of a specific prompt to GPT-4. I will provide you with the prompt and you will write which output parser you will use.

Here are the available parsers:
function asJSON<T>(raw:string): T
function asXML<T>(raw:string>: T
function extractFencedSnippets(raw: string): string[] // extracts all content within \`\`\`language <content> \`\`\` blocks
function extractPossibleFencedSnippet(raw: string): string

Imagine you are writing the following function:

\`\`\`
type ReturnType = <fill in>
function chatAndParseOutput(...args: any[]): ReturnType {
  const raw: string = await chatGPT(...args);

   return <fill in>
}
\`\`\`

Respond with what the return type ReturnType is for the following prompt. And tell me which output parser you want to use in sequence. For instance if the output will look like:
$output$
Person options:
\`\`\`json
{ name: "lenny" }
\`\`\`
\`\`\`json
{ name: "lydia" }
\`\`\`
$endoutput$

then you should use
extractCodeFences(raw).map(entry => entry.asJSON<{name:string}>);

*Important* If the return type is a small set of possible valid strings, write the type as the union of those options, not the generic "string" type.
If you do this narrowing, then make sure your types match in your parse() function. Use "as ReturnType" if necessary 

It is generally safe (and recommended) to use extractPossibleFencedSnippet when you have a single value output. If there is no code fence, extractPossibleFencedSnippet just returns the original string. 
`;

const steptwo = `
Now respond with the same answer in a structured format:

$output$
Type Definition
\`\`\`type
type ReturnType = <your output type>
\`\`\`

Parsing Code
\`\`\`typescript
async function parse(raw:string): Promise<ReturnType> {
<fill in>
}
\`\`\`
$endoutput$
`;

export default async function getOutputFormat(tx: Tx, prompt: string) {
  return await sequence(tx, [g4(system(stepone), prompt), g4(steptwo)])
    .then(extractFencedSnippets)
    .then((snippets) => {
      return { type: snippets[0], parser: snippets[1] };
    });
}
