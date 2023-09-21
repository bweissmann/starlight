import { chat, sequence } from "@/llm/chat";
import { maybeExtractSingleFencedSnippet } from "@/llm/parser/code-fence";
import asJSON from "@/llm/parser/json";
import { assistant, g4, system, user } from "@/llm/utils";
import { defaultTx } from "@/project/context";

const tx = defaultTx();

const file = "..."
const codeSnippet = "..."


const { startingLine, endingLine } = await chat(tx,
    g4(
        system(`
        Decide what portion of the original file shuold be replaced with this patch.
        Respond with the line number of the first line to be replaced and the line number of the last line to be replaced.
        
        Respond in JSON format and say nothing else. Do not write anything outside of the code fence.

        Reponse Format:
        \`\`\`json
        {
            startingLine: <number>,
            endingLine: <number>
        }
        \`\`\`
        `),
        user("Here' is the file"),
        assistant(file),
        user("Here is the snippet"),
        assistant(codeSnippet),
    )
)
    .then(maybeExtractSingleFencedSnippet)
    .then(asJSON<{ startingLine: number; endingLine: number }>);