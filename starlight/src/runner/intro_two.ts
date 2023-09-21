import blankspace from "@/blankspace/blankspace";
import { chat, sequence } from "@/llm/chat";
import { maybeExtractSingleFencedSnippet } from "@/llm/parser/code-fence";
import asJSON from "@/llm/parser/json";
import { assistant, g4, system, user } from "@/llm/utils";
import { defaultTx } from "@/project/context";

const tx = defaultTx();

const file = "..."
const codeSnippet = "..."


const { startingLine, endingLine } = await blankspace
    .build(`
        Decide what portion of the original file shuold be replaced with this patch.
        Respond with the line number of the first line to be replaced and the line number of the last line to be replaced.

        Reponse Format:
        {
            startingLine: <number>,
            endingLine: <number>
        }
    `)
    .run({
        "here's the file": file,
        "here's the snippet": codeSnippet
    });