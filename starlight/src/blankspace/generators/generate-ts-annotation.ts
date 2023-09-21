import { chat } from "@/llm/chat";
import { g4, system } from "@/llm/utils";
import { Tx } from "@/project/context";
import { maybeExtractSingleFencedSnippet } from "@/llm/parser/code-fence";

const prompt = `
# Introduction

The user will provide a natural language prompt meant for GPT-4 which asks for structured output. 
Your job is to determine the Typescript type of the structured output.

# Output format
Respond in the following format:
\`\`\`typescript
type ReturnType = <FILL IN>;
\`\`\`

# Examples

INPUT:
Give a list of dog names

OUTPUT:
\`\`\`typescript
type ReturnType = string[];
\`\`\`


INPUT:
Give me two code fenced blocks, one is args, which has JSON for the start and end line number of your edit, the other is a code snippet in a code fence

OUTPUT:
\`\`\`typescript
type ReturnType = {
  args: {
    start_line_number: number
    end_line_number: number
  }, 
  code: string
};
\`\`\`

INPUT:
...
An action represents a locally atomic operation on a source code file.
Each action only applies to a small, contiguous region of code. 
Any edits you make across different parts of the file must be modelled as a sequence of distinct, local actions

Each action has a "type" which can be 
- insert-only
- delete-only
- replace

Each action has a source code range that it applies to
- start-lineno
- end-lineno

Each action has a description for the implementation agent including what the agent should do and why. 

Here is the full action JSON spec:
\`\`\`json
{
    type: "insert-only" | "delete-only" | "replace",
    start-lineno: number,
    end-lineno: number,
    description: string
}
\`\`\`
...

OUTPUT:
\`\`\`typescript
type ReturnType = {
    type: "insert-only" | "delete-only" | "replace";
    start-lineno: number;
    end-lineno: number;
    description: string;
};
\`\`\`
`;

export async function GENERATE_TSAnnotation(tx: Tx, input: string): Promise<string> {
  return await chat(tx, g4(system(prompt), input))
    .then(maybeExtractSingleFencedSnippet)
    .then((s) => s.split("=")[1])
}
