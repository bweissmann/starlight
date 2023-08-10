import 'dotenv/config';
import implement from "./implement/main.js";
import getInput from "./tools/user_input.js";
import ls from './fs/ls.js';
import { chat } from './llm/chat.js';
import { assistant, user, vomit } from './utils.js';

const args = process.argv.slice(2);

let input: string;
if (args.length > 0) {
    input = args[0]
} else {
    input = await getInput("")
}

const snippets = await implement(input)

chat([
    user(input),
    assistant(vomit(snippets)),
    user(`Where would you put this code? Here is my project structure:
    ${await ls('./src')}}`)
])
