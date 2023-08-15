import ls from '@/fs/ls.js';
import pretty_print_directory from '@/fs/pretty_print_directory.js';
import read from '@/fs/read.js';
import parse_draft_into_snippets from '@/implement/bits/parse_draft_into_snippets.js';
import { execute, sequence } from '@/llm/chat.js';
import { g4 } from '@/llm/utils.js';
import { change, file } from '@/programs.js';
import { subsequenceMatch } from '@/tools/search.js';
import { logger, system } from '@/utils.js';
import 'dotenv/config';

/*
Top Level Tasks:
- Move user, system, assistant from utils to llm/utils

- make "create file" in /programs

- in utils/pricing make input and output optional, default to []
 
- documentation
  > document every file in the codebase

- testing?
  > maybe we can hotswap .proposal and .current and compile?
*/

sequence([
  g4([
    `
    # Introduction
    I have a source code tree that I'm working with.
    You are an autonomous software engineering agent who accomplishes well-scoped tasks via tools.
    As a large language model, you can only read and write in text, so everything you do needs to be text-based.

    # Task
    I want to refactor my function promptCreateEmptyFile in src/tools/new-file to use write in src/fs/write.

    # Tools
    You have access to the following tools:
    
    ## tree <directory>
    > print directory tree
    > e.g. "tree ./src" prints all the files in the repo 

    ## read <file>
    > print the contents of a file so you can read it

    ## find <query> <directory>
    > find a query string across all files in a directory
    > similar to global search in a code editor like VSCode works

    # Request
    Come up with a step-by-step plan to accomplish this task.
    Each step should be either a tool-use or an step that can be done with just your own read/write processing.
    If the step is a read/write step, then explain what information you will read and where you will write down your output
    `
  ])
])

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