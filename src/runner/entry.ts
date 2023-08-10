import ls from '@/fs/ls.js';
import pretty_print_directory from '@/fs/pretty_print_directory.js';
import { sequence } from '@/llm/chat.js';
import { g4 } from '@/llm/utils.js';
import { change, file } from '@/programs.js';
import 'dotenv/config';

/*
Top Level Tasks:
- Move user, system, assistant from utils to llm/utils
  > implement search?

  - make "create file" in /programs

- Change file detection to the forward partials style

- in utils/pricing make input and output optional, default to []
 
- documentation
  > document every file in the codebase
*/

change(
  'search',
  `
  Implement a function subsequenceMatch(query: string, candidate: string):boolean

  Which uses subsequence search:

  Given two sequences:
Main sequence: A = "ABCD"
Sub-sequence: B = "AC"
B is a subsequence of A because you can delete "B" and "D" from A and get B without changing the order of the remaining elements.

  `
)

/*
WORKING STACK:
1. Move user, system, assistant from utils to llm/utils
2. implement search
3. make pretty print accept promise
4. Change file should have a reject proposal option.
5. Show file 
*/