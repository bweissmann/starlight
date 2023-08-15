import 'dotenv/config';
import { sequence } from "@/llm/chat.js";
import { g35, g4 } from "@/llm/utils.js";
import getInput from "@/tools/user_input.js";
import { system } from "@/utils.js";
import parseJSON from '@/llm/parser/json.js';
import { findAndModifyFile } from './utils.js';
import { extractCodeSnippet } from '@/tools/code-transformer.js';

async function repl(): Promise<void> {
    const input = await getInput("(p)roposals, (m)odify, (c)reate: ")
    const { command } = await sequence([
        g35(
            system(`
        # Your job is to parse a command from the user's message.
        
        You know the following commands:

        ## proposals
        > aliases: p, show proposals, proposal
        - Shows all pending proposals in the system

        ## create file
        > aliases: c, new file, create, create a file
        - Creates a file

        ## modify file
        > aliases: m, modify, edit, edit file
        - Modifies a file

        Respond in JSON Format:
        \`\`\`json
        {
            "command": 'proposals' | 'create file' | 'modify file',
        }
        \`\`\`
        `),
            input
        )
    ]).then(extractCodeSnippet).then(parseJSON<{ command: 'proposals' | 'create file' | 'modify file' }>)

    switch (command) {
        case 'proposals':
            await 'unimplemented'
            break;
        case 'create file':
            await 'unimplemented'
            break;
        case 'modify file':
            await findAndModifyFile()
            break;
    }

    return await repl(); // recursive repl
}

repl();