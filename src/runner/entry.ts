import { codeEditor } from '@/agents/code-editor.js';
import { commandDrivenRepl } from '@/agents/file-explorer.js';
import 'dotenv/config';

/*
Top Level Tasks:

- experiment with a better way to write text.
  > copy/paste seems useful
  > insert text at location
  > replace text block?

- Move user, system, assistant from utils to llm/utils

- make "create file" in /programs

- in utils/pricing make input and output optional, default to []
 
- sometimes it writes multiple chunks, like it will write an import and a function but skip stuff in the middle.
  > so for this we need better replace logic than 'pick one contiguous chunk of lines'

- documentation
  > document every file in the codebase

- testing?
  > maybe we can hotswap .proposal and .current and compile?
*/

// await commandDrivenRepl("Lets keep track of the running cost of each gpt call in the program and log the cumulative cost at each step. I run the program via entry.ts")
await codeEditor("./src/llm/chat.ts", "Lets keep track of the running cost of each gpt call in the program and log the cumulative cost at each step", ``)

// sequence([
//   g4([
//     system(`
//     You are an automonous software engineering agent.
    
//     Make a plan to accomplish the user's task.

//     # Tools
//     You have access to the following tools:

//     ## tree <dir>
//     > print directory tree

//     ## cat <file>
//     > print a file

//     ## find <query> <file>
//     > find query in file

//     `),
//     `move the function
//     export async function file(_name: MaybePromise<string>) {

//      to fs/find.ts`
//   ])
// ])

/*
WORKING STACK:
1. Move user, system, assistant from utils to llm/utils
2. implement search
4. Change file should have a reject proposal option.
*/