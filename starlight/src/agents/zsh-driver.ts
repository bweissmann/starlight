import { sequence } from '@/llm/chat.js';
import { g4 } from '@/llm/utils.js';
import read from '@/fs/read.js';
import { lsPrettyPrint } from '@/fs/ls.js';
import { extractCodeSnippets } from '@/tools/source-code-utils.js';
import getInput, { askMultiChoice } from '@/tools/user_input.js';
import asJSON from '@/llm/parser/json.js';
import { saveCodeSnippetAsProposal } from '@/programs.js';
import chalk from 'chalk';
import { PROMPT_extractTakeaways, PROMPT_intro, PROMPT_reminder } from './prompt.js';
import propose, { cleanUpProposalDirectory, proposalFilepath } from '@/tools/propose.js';
import { spawn } from 'child_process';
import dedent from 'dedent';
import fs from 'fs/promises';
import { filepath_within_subdirectory, write_to_subdirectory } from '@/fs/subdirectory.js';
import path from 'path';

type CommandInput = { command: 'tree' | 'cat' | 'modify' | 'quit' | 'propose', args: string[] }

export async function zshDriver(task: string, projectDirectory?: string) {
    const intro = await PROMPT_intro(task, projectDirectory)
    const reminder = PROMPT_reminder(task)
    const extractTakeaways = PROMPT_extractTakeaways(task)

    const initialresponse = await sequence([
        g4([
            intro,
            reminder
        ])
    ])

    try {

        let previousresponse = initialresponse;
        for (let i = 0; i < 16; i++) {
            const previousHistoryWithoutReminder = [...previousresponse.fullHistory.slice(0, -2), ...previousresponse.fullHistory.slice(-1)]
            const cmd = await asJSON<CommandInput>(extractCodeSnippets(previousresponse.message)[0])
            const result = await interpretAndExecute(cmd)
            console.log(chalk.cyan(result))
            await pause(`here's the result ^`)
            const takeaways = await sequence([
                g4(...previousHistoryWithoutReminder, result, extractTakeaways)
            ])
            await pause('review takeaways')

            const nextllmresponse = await sequence([
                g4(...previousHistoryWithoutReminder, takeaways.message, reminder)
            ])
            previousresponse = nextllmresponse;
            await pause('about to interpret and run command')
        }
    } catch (e) {
        console.log(e)
    }
}


async function pause(message?: string) {
    await getInput(`${message ?? 'continue?'} (enter)`)
}

async function interpretAndExecute(input: CommandInput): Promise<string> {
    switch (input.command) {
        case 'tree':
            if (!input.args[0].includes('src')) {
                return 'access denied: can only tree within `./src` '
            }
            return await lsPrettyPrint(input.args[0]);
        case 'cat':
            try {
                return await read(input.args[0]);
            } catch (e) {
                return `could not read ${input.args[0]}`
            }
        case 'quit':
            throw 'done!'
        case 'propose':
            return await proposeCommands(input.args)
        case 'modify':
            throw 'asked to modify file: unimplemented'

            await saveCodeSnippetAsProposal(input.args[0], input.args[1])
            return `Made a proposal change at ${input.args[0]}`
    }
}

async function proposeCommands(commands: string[]) {
    const warning = chalk.bgRed.white.bold("** Warning, this is running potentially malicious shell commands on your system **")
    const filepath = './.starlight/local/commands.sh'
    await propose(filepath, commands.join('\n'));

    console.log(dedent`
        ${warning}

        ${chalk.green.bold(await read(proposalFilepath(filepath)))}

        ${warning}
    `)

    return await askMultiChoice<string>(`Run commands?`, {
        'y': async () => {
            return await dangerouslyExecuteTerminalCommands(filepath)
        },
        'n': async () => 'the user decided not to run the commands. you can re-ask the user if they want to run them or if they want to modify them'
    })
}

async function dangerouslyExecuteTerminalCommands(filepath: string) {
    const fileContents = await read(proposalFilepath(filepath))
    const commands = fileContents.split('\n')

    let output = ''
    for (let i = 0; i < commands.length; i++) {
        const result = await executeCommand(commands[i]);
        output += result;
        if (i < commands.length - 1) {
            await pause(`Executed ${i + 1}/${commands.length}`);

        }
    }
    // Move the proposal file to a completed directory after executing all commands
    await fs.mkdir(path.join(path.dirname(filepath), '.completed'), { recursive: true });
    const completedFilepath = filepath_within_subdirectory(filepath, '.completed')
    const date = new Date();
    try {
        await fs.access(completedFilepath);
        await fs.appendFile(completedFilepath, `\n${date.toISOString()}\n` + fileContents);
    } catch (error) {
        await fs.writeFile(completedFilepath, `${date.toISOString()}\n` + fileContents);
    }
    await fs.rm(proposalFilepath(filepath))
    await cleanUpProposalDirectory(filepath);

    return output;
}

async function executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const [cmd, ...args] = command.split(' ');

        const child = spawn(cmd, args);

        let output = '';

        // Stream stdout to console and accumulate
        child.stdout.on('data', (data) => {
            console.log(chalk.blue(data.toString()));
            output += data.toString();
        });

        // Stream stderr to console
        child.stderr.on('data', (data) => {
            console.log(chalk.red(data.toString()));
        });

        // Resolve the promise with the accumulated output when the process finishes
        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Command exited with code ${code}`));
            } else {
                resolve(output);
            }
        });

        // Handle errors
        child.on('error', (error) => {
            reject(error);
        });
    });
}