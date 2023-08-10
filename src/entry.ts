import 'dotenv/config';
import implement from './implement/main.js';
import { appendLineNumbers, stripLineNumbers } from './understand/utils.js';
import typescript_to_json_spec, { execute_to_json_spec } from './implement/bits/typescript_to_json_spec.js';
import { chat, execute, sequence } from './llm/chat.js';
import { g4, unstructured } from './llm/utils.js';
import { assistant, logger, system, user, vomit } from './utils.js';
import { changeFile, file, readAndWrite, writeJSONSpec } from './programs.js';
import parse_top_level_functions from './understand/parse/top_level_functions.js';
import ls from './fs/ls.js';
import { consoleLogDiff, diff } from './tools/diff.js';
import chalk from 'chalk';
import propose, { askToAcceptProposal, proposalDiff } from './tools/propose.js';
import read from './fs/read.js';
import pretty_print_directory from './fs/pretty_print_directory.js';
import { extractCodeSnippet } from './tools/code-tools.js';
import parseXML from './llm/parser/xml.js';

// make overloading for g4, g35 to support splatting array
// Move user, system, assistant from utils to llm/utils
// Change file detection to the forward partials style
// in utils/pricing make input and output optional, default to []

/* 
documentation
document every file in the codebase
*/

changeFile(
    file('llm/utils'),
    `I have a function 
export function g4(messages: MessageOrStr | MessageOrStr[]): ChatSpec

I want to add a function overload in typescript so the user can splat the array into the function args.
`
)