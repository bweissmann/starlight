import { Tx } from "@/project/context";
import { Forward, ImplOf } from "../utility-types";
import { chat } from "@/llm/chat";
import { g4, system } from "@/llm/utils";
import {
  extractFencedSnippets,
  extractPossibleFencedSnippet,
} from "@/tools/source-code-utils";
import asJSON from "@/llm/parser/json";
import asXML from "@/llm/parser/xml";
import { asTripleHashtagList } from "@/llm/parser/triple-hashtag";

const spec = `Split raw comamnd output into a list of errors. 
  Keep the filename/linenumber info.
  You can't predict the structure of the error message since you don't know the programming language.
  Show example input/outputs in different programming languages.` as const;

const prompt = `

# Introduction
We are dealing with the task of parsing raw command output from various programming languages and extracting a list of error messages. The challenge lies in the unpredictable structure of the error messages due to the variety of programming languages. However, it is crucial to retain the filename and line number information associated with each error.

# Output Format
The output should be a list of error messages. Each error message should be in a separate code-fenced block. The error message should include the filename, line number, and the error description.

# Examples

## Example 1
**Input:**
\`\`\`python
Traceback (most recent call last):
  File "test.py", line 7, in <module>
    print(x)
NameError: name 'x' is not defined
\`\`\`
**Output:**
\`\`\`Error
File "test.py", line 7, in <module>
NameError: name 'x' is not defined
\`\`\`

## Example 2
**Input:**
\`\`\`java
Exception in thread "main" java.lang.Error: Unresolved compilation problem: 
	The method print(int) is undefined for the type System

	at com.example.test.main(test.java:5)
\`\`\`
**Output:**
\`\`\`Error
at com.example.test.main(test.java:5)
java.lang.Error: Unresolved compilation problem: 
The method print(int) is undefined for the type System
\`\`\`

## Example 3
**Input:**
\`\`\`javascript
/home/user/test.js:5
console.log(x);
            ^

ReferenceError: x is not defined
    at Object.<anonymous> (/home/user/test.js:5:13)
\`\`\`
**Output:**
\`\`\`Error
at Object.<anonymous> (/home/user/test.js:5:13)
ReferenceError: x is not defined
\`\`\`

`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw: string): Promise<Prompt["inferred"]["returns"]> {
  return extractFencedSnippets(raw).map((entry) =>
    asJSON<{ filename: string; line: number; error: string }>(entry),
  );
}

// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "split-error-output_v2.ts";
  inferred: {
    inputs: string[];
    returns: { filename: string; line: number; error: string }[];
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
