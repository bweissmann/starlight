import { sequence } from '@/llm/chat.js';
import { g4 } from '@/llm/utils.js';
import { system } from '@/utils.js';
import read from '@/fs/read.js';
import { lsPrettyPrint } from '@/fs/ls.js';
import { extractCodeSnippet } from '@/tools/code-transformer.js';
import getInput from '@/tools/user_input.js';
import parseJSON from '@/llm/parser/json.js';
import { saveCodeSnippetAsProposal } from '@/programs.js';
import chalk from 'chalk';

type CommandInput = { command: 'tree' | 'read' | 'modify' | 'quit', args: string[] }

export async function commandDrivenRepl(task: string) {

    const reminder = system(`
A reminder: 
# Task
${task}

# Request
What is the next step you want to take?
`)

    const intro = `
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
> you only have access to the './src' and directory

## read <file>
> print the contents of a file so you can read it

## modify <file>
> decide to modify a file.
> * Important * do not write your changes here. Another agent will implement the change. You just pick the file to modify

## quit
> end the loop if you are stuck or the task is solved

---

# Project Specific Notes
- Even though files are imported as .js, this is just a quirk of typescript. The files are actually typescript files and can be found at corresponding .ts filepaths.

---

# Project Structure

${await lsPrettyPrint('./src')}

---

# Request
Quietly think of a step-by-step plan to accomplish this task.
Each step should be a usage from one of the tools listed above.

Write the first step you need to do. Then stop talking. After you have have confirmation that the step was taken, Write the next step
Your output format should be:

[start of response]
<if you are doing something *extemely* unconventional, write less than 15 words about why. Preferably say nothing>

\`\`\`json
{
    command: 'tree' | 'read' | 'modify' | 'quit',
    args: string[]
}
\`\`\`
[end of response]
`

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
            const cmd = await parseJSON<CommandInput>(extractCodeSnippet(previousresponse.message))
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
            await getInput("how does the takeaway look? (enter)")

            const nextllmresponse = await sequence([
                g4(...previousHistoryWithoutReminder, takeaways.message, reminder)
            ])
            previousresponse = nextllmresponse;
            await getInput('continue? (enter)')
        }
    } catch (e) {
        console.log(e)
    }
}



async function interpretAndExecute(input: CommandInput) {
    switch (input.command) {
        case 'tree':
            if (!input.args[0].includes('src')) {
                return 'access denied: can only tree within `./src` '
            }
            return await lsPrettyPrint(input.args[0]);
        case 'read':
            try {
                return await read(input.args[0]);
            } catch (e) {
                return `could not read ${input.args[0]}`
            }
        case 'quit':
            throw 'done!'
        case 'modify':
            throw 'asked to modify file: unimplemented'

            await saveCodeSnippetAsProposal(input.args[0], input.args[1])
            return `Made a proposal change at ${input.args[0]}`
    }
}