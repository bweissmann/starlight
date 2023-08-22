import read, { readOrEmptyString } from "@/fs/read.js";
import { sequence } from "@/llm/chat.js";
import parseJSON from "@/llm/parser/json.js";
import { parseTripleHashtags } from "@/llm/parser/triple-hashtag.js";
import { g4 } from "@/llm/utils.js";
import { rewriteChange } from "@/programs.js";
import { extractCodeSnippets, extractSingleCodeSnippet } from "@/tools/code-snippets.js";
import { consoleLogDiff } from "@/tools/diff.js";
import propose, { askToAcceptProposal, proposalDiff, proposalFilepath } from "@/tools/propose.js";
import getInput from "@/tools/user_input.js";
import { appendLineNumbers } from "@/understand/utils.js";
import { assistant, system } from "@/utils.js";
import chalk from "chalk";

type Command = {
    "command": "copy/paste"
    "args": {
        "copy start-line-number": number,
        "copy end-line-number": number,
        "paste after-line-number": number
    }
} | {
    "command": "insert after"
    "args": {
        "after-line-number": number,
    }
} | {
    "command": "replace",
    "args": {
        "start-line-number": number,
        "end-line-number": number,
    }
} | {
    "command": "delete"
    "args": {
        "start-line-number": number,
        "end-line-number": number,
    }
}
export async function codeDriver(filename: string, task: string, projectDirectory?: string) {
    const initialresponse = await sequence([
        g4(
            system(`
            # Introduction
            You are an autonomous software engineering agent who is able to think creatively, problem solve, and come up with novel ideas to implement complex features.
            When presented with a problem, you think broadly about its implications and cascading effects on the codebase.
            You feel free to suggest changes beyond the most narrow interpretation of the problem.

            ---

            # Tools
            You have access to the following tools:

            ## Copy / Paste <copy start-line-number> <copy end-line-number> <paste after-line-number>
            > copy and paste a code snippet within the same file.

            ### Format
            \`\`\`json
            {
                "command": "copy/paste"
                "args": {
                    "copy start-line-number": number,
                    "copy end-line-number": number,
                    "paste after-line-number": number
                }
            }
            \`\`\`
            
            ## Insert after <after-line-number> <CODE-CONTENT>
            > Inserts content as a new line after the specified line number

            ### Format
            \`\`\`json
            {
                "command": "insert after"
                "args": {
                    "after-line-number": number,
                }
            }
            \`\`\`

            \`\`\`LANG
            <CODE-CONTENT>
            \`\`\`

            ## Replace <start-line-number> <end-line-number> <CODE-CONTENT>
            > Replaces a chunk of lines with new content.

            ### Format
            \`\`\`json
            {
                "command": "replace",
                "args": {
                    "start-line-number": number,
                    "end-line-number": number, // This range is inclusive. The line number you write here will be replaced
                }
            }
            \`\`\`

            \`\`\`LANG
            <CODE-CONTENT>
            \`\`\`


            ## Delete <start-line-number> <end-line-number>
            > Deletes a chunk from the file

            ### Format
            \`\`\`json
            {
                "command": "delete"
                "args": {
                    "start-line-number": number,
                    "end-line-number": number,
                }
            }
            \`\`\`

            ---

            # Format

            Each tool specifies its own output format. Respond in that format.
         
            LANG is the programming language you are writing in
            CODE-CONTENT is the code you write

            ---

            # Project Specific Notes

            ${projectDirectory === undefined ? '' : await readOrEmptyString(`${projectDirectory}/.starlight/context.md`)}
            
            ---

            # Task
            ${task}
            `),
            `read ${filename}`,
            assistant(await read(filename).then(appendLineNumbers)),
            `
            Respond in the following format

            # Think
            Write one sentence explaining at a high level your thought on how to accomplish the task. Write this for your peer who has extremely high context on the problem, and whom you have a casual raport with. 
            This should be less than 15 words.

            # Plan
            Write a step-by-step ordered list of each tool you plan to use and why.

            # Execute
            for each tool use in the list, write the command to invoke that tool using its correct format as outlined above.
            Before each tool invokation, write the delimiter "### Step [i]"`
        )
    ])
    const steps = (await parseTripleHashtags(initialresponse.message))
        .map(r => r.content)
        .map(extractCodeSnippets)

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        const currentFileContents = i === 0 ? await read(filename) : await read(proposalFilepath(filename))
        const command = await parseJSON<Command>(step[0])
        switch (command.command) {
            case "copy/paste":
                break;
            case "insert after":
                const fileContentsWithInsert = [
                    ...currentFileContents.split('\n').slice(0, command.args["after-line-number"]),
                    step[1],
                    ...currentFileContents.split('\n').slice(command.args["after-line-number"])
                ].join('\n')
                await propose(filename, fileContentsWithInsert)
                consoleLogDiff(await proposalDiff(filename));

                break;
            case "replace":
                let range: { start: number, end: number };
                if (i === 0) {
                    range = {
                        start: command.args["start-line-number"],
                        end: command.args["end-line-number"]
                    }
                } else {
                    range = await fixLineNumbers(await read(proposalFilepath(filename)), step[1], command.args["start-line-number"], command.args["end-line-number"])
                }

                const fileContentsWithReplace = [
                    ...currentFileContents.split('\n').slice(0, range.start - 1),
                    step[1],
                    ...currentFileContents.split('\n').slice(range.end)
                ].join('\n')
                await propose(filename, fileContentsWithReplace)
                consoleLogDiff(await proposalDiff(filename));

                await sequence([
                    g4(
                        `Here is a unified diff of a change:
                        
                        ${await proposalDiff(filename)}

                        Does it have any mistakes?
                        Common mistakes are:
                        - The indentation is misaligned
                        - It is either missing a curly brace or has an extra curly brace
                         
                        `
                    )
                ])

                break
            case "delete":
                break;
        }

        if (i < steps.length - 1) {
            await getInput(`continue? (${i + 1}/${steps.length}) `)
        } else {
            console.log(chalk.bgBlack.bold.yellow("    Done    "))
        }
    }

    await askToAcceptProposal(filename, {
        onContinue: async () => await rewriteChange(filename, 'unknown', await getInput("Feedback on this change? "))
    })
}

async function fixLineNumbers(fileContents: string, newContent: string, start: number, end: number) {
    const fileContentsAroundChange = appendLineNumbers(fileContents)
        .split("\n")
        .slice(start - 10, end + 10)
        .join("\n")

    return await sequence([
        g4(
            system(`
            The user is trying to replace a chunk of lines with new content in a source code file.
            However, the file has been edited since the user proposed their change, and the line numbers may have changed.

            Please double check if the line number range provided makes sense.
            If the line numbers are off, please provide the correct line numbers.
            If the line numbers make sense, just repeat the provided line numbers.
            
            Response Format:
            \`\`\`json
            {
                "start-line-number": number,
                "end-line-number": number,
            }
            \`\`\`
            `),
            `# Original File

${fileContentsAroundChange}
            
            ---

            # Replacement Chunk

${appendLineNumbers(newContent)}

            ---

            # Replacement Range
            {
                "start-line-number": ${start},
                "end-line-number": ${end},
            }
            `
        )
    ])
        .then(extractSingleCodeSnippet)
        .then(parseJSON<{ "start-line-number": number, "end-line-number": number }>)
        .then(result => ({ start: result['start-line-number'], end: result["end-line-number"] }))
}