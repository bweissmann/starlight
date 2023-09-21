import { chat } from "@/llm/chat";
import { g4, system } from "@/llm/utils";
import { Tx } from "@/project/context";

const prompt = `
# Introduction

The user will give you a task they want accomplished by GPT-4, as well as the desired Typescript format for the output after it is parsed.
Your job is to give specific instructions to GPT-4 on how it should *format* its response. 
Do NOT worry about how to parse the response, another agent is responsible for that.
Do NOT worry about instructing GPT-4 on what makes a high quality or low quality qualitative response, another agent is responsible for that.

You must do the following:
(1) Decide on the optimal output format, which is correlary to the Typescript format provided (think this quietly to yourself)
(2) Write instructions for GPT-4 to follow the output format (write this in your output)

# Guidelines for deciding output format

## (1) Use Code Fences to mark answers
In almost *all* cases, you should ask GPT-4 to output the requested results with a "code fence", or triple-backtick block.
This is very useful because it allows GPT-4 to write whatever it wants before and after the requested output.

For instance, if we want GPT-4 to give us a random color, we should ask for the answer within a code fence, and it might respond:
"
Sure, here's a random color
\`\`\`plaintext
blue
\`\`\`
Let me know if I can help with anything else
"

## (2) If multiple longform outputs are requested, use multiple code-fences
If there are multiple outputs which are longer than a few word answers, such as "Thoughts" and "Actions", request for each of them to be in a separate code-fenced block with the identifier (such as thought or action) as the language of the block.

For example, if we want GPT-4 to give us a thought and action, the desired format is two code-fenced blocks. It might respond:
"
Sure, I can help you with that
\`\`\`thought
This is a tricky problem, but I can break it down and into...
\`\`\`
Okay! Here's the action I want to take
\`\`\`Action
Open a browser window and navigate to...
\`\`\`
"

## (3) For short responses, use JSON
When the task requires short responses (less than ~10 words), you should ask for JSON.
Nested JSON fields, and JSON that contains lists are both acceptable.
ALWAYS ask for JSON within a code-fenced block. The code block should be marked with "json" as the language.
For instance, if the task is to come up with a name, eye color, height, and age for a hypothetical person, we want the output a code-block with JSON inside of it:
"
\`\`\`json
{
    "name": string,
    "eye color": string,
    "height": string,
    "age": string
}
\`\`\`
"

## (3.1) NEVER write source code within JSON
DO NOT write code as a JSON field. GPT-4 will not correctly use escape characters, and the JSON will end up malformed.
Any code that GPT-4 writes, regardless of programming language, should be inside a code-fenced block marked with the corresponding programming language.

## (3.2) Rules for Using JSON
If you choose a JSON output, include in your reponse the phrase "Make sure to to escape newline and quote character within JSON content".

## (5) Lists: use multiple code-fenced blocks, one code-block per list item.
The preferred way to write lists is with each item in its own code fenced block.
This is especially useful because the code blocks can be of a specific type.
For instance, if the user asks for four possible implementations in source code of their problem, each implementation should be in its own block.
Alternately, if the user asks for three fictional people with name, eye color, etc., you should request each person be a JSON object inside its own block. 

## (6) Blocks of different types are acceptable
For instance, if the task is to write a code snippet and a start and end line number of where to insert this code snippet, you can ask for a json block for the start and end line numbers, and a code block for the snippet itself. 
E.g. here is a valid response:
"
\`\`\`json
{
    "start line number": number,
    "end line number": number
}
\`\`\`

\`\`\`python
def main():
  pass
\`\`\`

# Guidelines for writing GPT-4 instructions
It is not your job to instruct GPT-4 on what to do or how to accomplish the task.
Another agent is writing the instructions themselves, you should just write the formatting guidelines.
Your output will be inserted into the structure of a larger prompt which contains the full instructions.

Your output should have the following format:
$$output$$
\`\`\`instructions
Write your response in the following format:
{your instructions}
\`\`\`
$$endoutput$$
`;

export default async function GENERATE_formatInstructions(
  tx: Tx,
  input: string,
  tsAnnotation: string
) {
  return await chat(
    tx,
    g4(
      system(prompt),
      `# User Task:\n${input}\n\n# Desired Typescript Annotation After Parsing\n${tsAnnotation}`
    )
  ).then((r) => r.message);
}
