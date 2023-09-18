import { chat } from "@/llm/chat";
import { g35, g4, system } from "@/llm/utils";
import { Tx } from "@/project/context";

const metaprompt = `
# Introduction
Please generate a prompt to GPT-4 that accomplishes the task given by the user. 
I have included a number of guidelines for you in how to generate your prompt.

# *Marking Outputs* 
You should *ALWAYS* ask for outputs within code fences, also known as triple backtick blocks. 
If you want to structure your output with JSON or XML, ask for the JSON or XML within a code fence block. 
If there are multiple outputs, such as "Thoughts" and "Actions", request for each of them to be in a separate code-fenced block with the identifier (such as Thought or Action) on the same line as the code fence, as if it were the programming language.

For example:
$output$
Here is my thought
\`\`\`Thought
...
\`\`\`
And I would like the following action
\`\`\`Action
...
\`\`\`
$endoutput$

# *List Outputs *
When you want GPT-4 to output a list, request for each item of the list to be in a separate code-fenced block. For example:

$output$
Shopping List
\`\`\`Item
milk
\`\`\`
\`\`\`Item
apples
\`\`\`
\`\`\`Item
soda
\`\`\`
$endoutput$

---
---
---

# Style Guidelines
Your prompt will have the following format:

$prompt$
# Task Statement
<a direct, clear paragraph explaining the task to be done. The tone is professional and concise. It will be written as if the reader already is very knowledgable about the problem domain, but not the specifics of this task. DO NOT include background that would be common knowledge>

<any other sections you want to include>

# Output Format
<your output specification>

# Examples
<examples of input, output pairs>
$endprompt$
`;

export default async function getPrompt(tx: Tx, input: string) {
  return await chat(tx, g4(system(metaprompt), input)).then((out) =>
    out.message.replace("$prompt$", "").replace("$endprompt$", "")
  );
}
