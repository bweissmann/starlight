import { sequence } from '@/llm/chat.js';
import { g35, g4 } from '@/llm/utils.js';
import read from '@/fs/read.js';
import { lsPrettyPrint } from '@/fs/ls.js';
import { extractCodeSnippets } from '@/tools/source-code-utils.js';
import getInput from '@/tools/user_input.js';
import asJSON from '@/llm/parser/json.js';
import { saveCodeSnippetAsProposal } from '@/programs.js';
import chalk from 'chalk';
import { PROMPT_extractTakeaways, PROMPT_intro, PROMPT_reminder } from './prompt.js';

type CommandInput = { command: 'tree' | 'cat' | 'modify' | 'quit' | 'propose', args: string[] }

export async function zshDriver(task: string, projectDirectory?: string) {

    const intro = await PROMPT_intro(task, projectDirectory)
    const reminder = PROMPT_reminder(task)
    const extractTakeaways = PROMPT_extractTakeaways(task)

    const initialresponse = await sequence([
        g35([
            intro,
            reminder
        ])
    ])

    await pause()

    try {

        let previousresponse = initialresponse;
        for (let i = 0; i < 16; i++) {
            const previousHistoryWithoutReminder = [...previousresponse.fullHistory.slice(0, -2), ...previousresponse.fullHistory.slice(-1)]
            const cmd = await asJSON<CommandInput>(extractCodeSnippets(previousresponse.message)[0])
            const result = await interpretAndExecute(cmd)
            console.log(chalk.cyan(result))
            const takeaways = await sequence([
                g4(...previousHistoryWithoutReminder, result, extractTakeaways)
            ])
            await pause()

            const nextllmresponse = await sequence([
                g4(...previousHistoryWithoutReminder, takeaways.message, reminder)
            ])
            previousresponse = nextllmresponse;
            await pause()
        }
    } catch (e) {
        console.log(e)
    }
}


async function pause() {
    await getInput('continue? (enter)')
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
            throw 'asked to propose: unimplemented'
        case 'modify':
            throw 'asked to modify file: unimplemented'

            await saveCodeSnippetAsProposal(input.args[0], input.args[1])
            return `Made a proposal change at ${input.args[0]}`
    }
}