import { sequence } from '@/llm/chat.js';
import { g35, g4 } from '@/llm/utils.js';
import { system } from '@/utils.js';
import read, { readOrEmptyString } from '@/fs/read.js';
import { lsPrettyPrint } from '@/fs/ls.js';
import { extractCodeSnippets } from '@/tools/code-snippets.js';
import getInput from '@/tools/user_input.js';
import parseJSON from '@/llm/parser/json.js';
import { saveCodeSnippetAsProposal } from '@/programs.js';
import chalk from 'chalk';

type CommandInput = { command: 'tree' | 'cat' | 'modify' | 'quit' | 'propose', args: string[] }

export async function shellDriver(task: string, projectDirectory?: string) {

    const reminder = system(`
A reminder: 
# Task
${task}

# Request
What is the next step you want to take?
`)

    const intro = system(`
# Introduction
You are an autonomous software engineering agent who accomplishes well-scoped tasks via tools.

---

# Task
${task}

---

# Tools
You have access to the following tools:

## tree <directory>
> print directory tree

## cat <file>
> print the contents of a file so you can read it

## modify <file>
> decide to modify a file.
> *Important* do not write your changes here. Another agent will implement the change. You just pick the file to modify

## touch <file>
> create a new file

## propose <shell commands>
> propose a series of arbitrary zsh commands to be executed. This will be reviewed by the user before being executed.

## quit
> end the loop if you are stuck or the task is solved

---

# Project Specific Notes
${projectDirectory === undefined ? '' : await readOrEmptyString(`${projectDirectory}/.starlight/context.md`)}

---

# Project Structure

${await lsPrettyPrint(`${projectDirectory}/src`)}

---

# Request
Quietly think of a step-by-step plan to accomplish this task.
Each step should be a usage from one of the tools listed above.

Write the one step you need to do next.
Your output format should be:

[start of response]
<if you are doing something *extemely* unconventional, write less than 15 words about why. Preferably say nothing>

\`\`\`json
{
    command: 'tree' | 'cat' | 'modify' | 'propose' | 'quit',
    args: string[]
}
\`\`\`
[end of response]
`
    )

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
            const cmd = await parseJSON<CommandInput>(extractCodeSnippets(previousresponse.message)[0])
            const result = await interpretAndExecute(cmd)
            console.log(chalk.cyan(result))
            const takeaways = await sequence([
                g4(...previousHistoryWithoutReminder, result, system(`
                The user's task is:
                ${task}

                Given this resource, what information can you provide to help them solve their task? What can you say that will help decide which next step to take?
                Conciseness is valued over completeness. Be succinct.
                After this, you will only have access to your conlusions, not the resource itself.
                
                Respond in bullet point format, with no more than two bullet points 
                `))
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