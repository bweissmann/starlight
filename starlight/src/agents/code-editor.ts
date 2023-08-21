import read from "@/fs/read.js";
import { sequence } from "@/llm/chat.js";
import { g4 } from "@/llm/utils.js";
import { appendLineNumbers } from "@/understand/utils.js";
import { assistant, system } from "@/utils.js";

export async function codeEditor(filename: string, task: string, context: string) {
    const initialresponse = await sequence([
        g4(
            system(`
            # Introduction
            You are an autonomous software engineering agent who accomplishes well-scoped tasks via tools.

            ---

            # Task
            ${task}

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

            \`\`\`langauge
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
                    "end-line-number": number,
                }
            }
            \`\`\`

            \`\`\`langauge
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

            ## quit
            > when you are finished editing

            ### Format
            \`\`\`json
            {
                "command": "quit"
            }
            \`\`\`

            ---

            # Context

            ${context}

            --- 

            # Format

            Each tool specifies its own output format. Respond in that format.
           
            `),
            `read ${filename}`,
            assistant(await read(filename).then(appendLineNumbers)),
            `First, in a step-by-step list, briefly explain each operation you plan to do.
            Then, invoke each operation in order.`
        )
    ])
}