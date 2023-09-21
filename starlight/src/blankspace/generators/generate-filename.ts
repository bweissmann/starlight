import { chat } from "@/llm/chat";
import { g4, system } from "@/llm/utils";
import { Tx } from "@/project/context";
import { maybeExtractSingleFencedSnippet } from "@/llm/parser/code-fence";

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

export async function GENERATE_filenameIdentifier(tx: Tx, input: string) {
  return chat(tx, g4(system(prompt), `USER PROMPT:\n${input}`)).then(
    maybeExtractSingleFencedSnippet
  );
}
