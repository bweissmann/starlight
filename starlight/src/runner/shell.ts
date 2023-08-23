import 'dotenv/config';
import { sequence } from "@/llm/chat.js";
import { g35, system } from "@/llm/utils.js";
import getInput from "@/tools/user_input.js";
import asJSON from '@/llm/parser/json.js';
import { modifyFile } from './utils.js';
import promptCreateEmptyFile from '@/tools/new-file.js';
import chalk from 'chalk';
import path from 'path';
import process from 'process';

async function repl(projectDirectory: string): Promise<void> {
    console.log(chalk.green(`Working project ${projectDirectory}`))

    const hardcodeAliases: Record<string, string[]> = {
        'project': ['project', 'p', 'switch', 'change project', 'use project'],
        'create file': ['create file', 'c', 'new file', 'create', 'create a file'],
        'modify file': ['modify file', 'm', 'modify', 'edit', 'edit file']
    };

    const input = await getInput("(p)roject, (m)odify, (c)reate: ");
    const commandExactMatch = Object.keys(hardcodeAliases).find(key => hardcodeAliases[key].includes(input));
    const command = commandExactMatch || await sequence([
        g35(
            system(`
        # Your job is to parse a command from the user's message.
        
        You know the following commands:

        ## project
        > aliases: p, project, switch, change project, use project 
        - switch the active project to <directory> 

        ## create file
        > aliases: c, new file, create, create a file
        - Creates a file

        ## modify file
        > aliases: m, modify, edit, edit file
        - Modifies a file

        Respond in JSON Format:
        \`\`\`json
        {
            "command": 'project' | 'proposals' | 'create file' | 'modify file',
        }
        \`\`\`
        `),
            input
        )
    ])
        .then(asJSON<{ command: 'project' | 'create file' | 'modify file' }>)
        .then(parsed => parsed.command);

    switch (command) {
        case 'project':
            const homeDirectory = process.env.HOME || process.env.USERPROFILE || '/';
            const relativeDirectory = await getInput(`switch to? ${homeDirectory}/`)
            projectDirectory = path.join(homeDirectory, relativeDirectory)
            break;
        case 'create file':
            await promptCreateEmptyFile()
            break;
        case 'modify file':
            await modifyFile()
            break;
    }

    return await repl(projectDirectory); // recursive repl
}


repl(process.argv[2] || process.cwd());