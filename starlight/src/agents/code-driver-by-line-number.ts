import read from "@/fs/read.js";
import { sequence } from "@/llm/chat.js";
import asJSON from "@/llm/parser/json.js";
import { asTripleHashtagList } from "@/llm/parser/triple-hashtag.js";
import { g4, assistant, system, user } from "@/llm/utils.js";
import { rewriteChange } from "@/programs.js";
import { appendLineNumbers, extractCodeSnippets, extractPossibleCodeSnippet } from "@/tools/source-code-utils.js";
import { consoleLogDiff } from "@/tools/diff.js";
import propose, { askToAcceptProposal, proposalDiff, proposalFilepath } from "@/tools/propose.js";
import getInput from "@/tools/user_input.js";
import chalk from "chalk";
import { codeDriver as prompts } from './prompt.js'
import dedent from "dedent";

type CopyPasteCommand = {
    "command": "copy/paste"
    "args": {
        "copy start-line-number": number,
        "copy end-line-number": number,
        "paste after-line-number": number
    }
}

type InsertAfterCommand = {
    "command": "insert after"
    "args": {
        "after-line-number": number,
    }
}

type ReplaceCommand = {
    "command": "replace",
    "args": {
        "start-line-number": number,
        "end-line-number": number,
    }
}

type DeleteCommand = {
    "command": "delete"
    "args": {
        "start-line-number": number,
        "end-line-number": number,
    }
}

type Command = CopyPasteCommand | InsertAfterCommand | ReplaceCommand | DeleteCommand;
type Step = InsertStep | ReplaceStep


type InsertStep = InsertAfterCommand & {
    afterOriginalSnippet: string,
    code: string
}

type ReplaceStep = ReplaceCommand & {
    originalSnippet: string,
    code: string
}

export async function codeDriver(filename: string, task: string, projectDirectory?: string) {
    const initialresponse = await sequence([
        g4(
            prompts.intro(task),
            user`read ${filename}`,
            assistant(await read(filename).then(appendLineNumbers)),
            user`
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
    const steps: Step[] = await Promise.all(
        (await asTripleHashtagList(initialresponse.message))
            .map(r => r.content)
            .map(extractCodeSnippets)
            .map(async raw => {
                const command = await asJSON<Command>(raw[0])
                const originalFileContents = await read(filename)
                switch (command.command) {
                    case 'copy/paste':
                    case 'delete':
                        throw 'unimplemented'
                    case 'insert after':
                        return {
                            ...command,
                            afterOriginalSnippet: originalFileContents
                                .split('\n')
                                .slice(Math.max(0, command.args["after-line-number"] - 4), command.args["after-line-number"])
                                .join('\n'),
                            code: raw[1]
                        }
                    case 'replace':
                        return {
                            ...command,
                            originalSnippet: originalFileContents
                                .split('\n')
                                .slice(command.args["start-line-number"] - 1, command.args["end-line-number"])
                                .join('\n'),
                            code: raw[1]
                        }
                }
            })
    )


    for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        const currentFileContents = i === 0 ? await read(filename) : await read(proposalFilepath(filename))
        switch (step.command) {
            case "insert after":
                const fileContentsWithInsert = [
                    ...currentFileContents.split('\n').slice(0, step.args["after-line-number"]),
                    step.code,
                    ...currentFileContents.split('\n').slice(step.args["after-line-number"])
                ].join('\n')
                await propose(filename, fileContentsWithInsert)
                consoleLogDiff(await proposalDiff(filename));

                break;
            case "replace":
                let range: { start: number, end: number };
                if (i === 0) {
                    range = {
                        start: step.args["start-line-number"],
                        end: step.args["end-line-number"]
                    }
                } else {
                    range = await fixLineNumbersForReplace({
                        currentFileContents: await read(proposalFilepath(filename)),
                        step,
                    })
                }

                const fileContentsWithReplace = [
                    ...currentFileContents.split('\n').slice(0, range.start - 1),
                    step.code,
                    ...currentFileContents.split('\n').slice(range.end)
                ].join('\n')
                await propose(filename, fileContentsWithReplace)
                consoleLogDiff(await proposalDiff(filename));

                await sequence([
                    g4(
`Here is a unified diff of a change:

\`\`\`diff
${await proposalDiff(filename)}
\`\`\`

Does it have any mistakes?
Common mistakes are:
- The indentation is misaligned
- It is either missing a curly brace or has an extra curly brace
    
`
                    )
                ])

                break;
        }

        if (i < steps.length - 1) {
            await getInput(`continue? (${i + 1}/${steps.length}) `)
        } else {
            console.log(chalk.bgBlack.bold.yellow(`    Done adding ${steps.length}/${steps.length} steps to proposal    `))
        }
    }

    await askToAcceptProposal(filename, {
        onContinue: async () => await rewriteChange(filename, 'unknown', await getInput("Feedback on this change? "))
    })
}

async function fixLineNumbersForReplace({ step, currentFileContents }: { step: ReplaceStep, currentFileContents: string }
) {
    const currentFileContentsAroundChange = appendLineNumbers(currentFileContents)
        .split("\n")
        .slice(step.args["start-line-number"] - 10, step.args["end-line-number"] + 10)
        .join("\n")

    return await sequence([
        g4(
            system(dedent`
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
            `
# Original Snippet to Replace

${step.originalSnippet}

---

# Replacement Chunk

${step.code}

---
# Current Version of File

${currentFileContentsAroundChange}

---

# Replacement Range
{
    "start-line-number": ${step.args["start-line-number"]},
    "end-line-number": ${step.args["end-line-number"]},
}
`
        )
    ])
        .then(extractPossibleCodeSnippet)
        .then(asJSON<{ "start-line-number": number, "end-line-number": number }>)
        .then(result => ({ start: result['start-line-number'], end: result["end-line-number"] }))
}