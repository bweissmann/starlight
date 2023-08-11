import ls from '@/fs/ls.js';
import pretty_print_directory from '@/fs/pretty_print_directory.js';
import read from '@/fs/read.js';
import parse_draft_into_snippets from '@/implement/bits/parse_draft_into_snippets.js';
import { execute, sequence } from '@/llm/chat.js';
import { g4 } from '@/llm/utils.js';
import { change, file } from '@/programs.js';
import { subsequenceMatch } from '@/tools/search.js';
import { logger } from '@/utils.js';
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

// sequence([
//   g4(`Come up with a few unit tests for this function. Use assert and console.log, no testing framework: 
  
//   ${await read(await file('search'))}`)
// ]).then(res => execute(parse_draft_into_snippets(res.message)))
// .then(res => res.snippets.map(snippet => snippet.code).join('\n'))
// .then(logger())

/*
WORKING STACK:
1. Move user, system, assistant from utils to llm/utils
2. implement search
3. make pretty print accept promise
4. Change file should have a reject proposal option.
5. Show file 
*/