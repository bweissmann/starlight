import { chatYNQuestion } from "@/llm/classifier";
import {
  ChatContinuationResult,
  sequence,
  stringifyChatResult,
} from "@/llm/chat";
import asJSON from "@/llm/parser/json";
import { g35, g4, system, user, assistant } from "@/llm/utils";
import prettier from "prettier";
import { Tx } from "@/project/context";
export function extractCodeSnippets(
  input: string | ChatContinuationResult
): string[] {
  return _extractCodeSnippets(stringifyChatResult(input));
}

function _extractCodeSnippets(input: string): string[] {
  const lines = input.split("\n");
  const snippets: string[] = [];
  let withinSnippet = false;
  let snippet = "";

  lines.forEach((line) => {
    if (line.startsWith("```")) {
      if (withinSnippet) {
        snippets.push(snippet.trim());
        snippet = "";
      }
      withinSnippet = !withinSnippet;
    } else if (withinSnippet) {
      snippet += line + "\n";
    }
  });

  return snippets;
}

export function extractPossibleCodeSnippet(
  input: string | ChatContinuationResult
): string {
  const snippets = extractCodeSnippets(input);
  if (snippets.length === 0) {
    return stringifyChatResult(input);
  }
  return snippets[0];
}

export async function insertSnippetIntoFile(
  tx: Tx,
  fileContents: string,
  code: string
) {
  const contentLined = appendLineNumbers(fileContents);
  const preamble = [
    system(`
        You will be given the original source code of a file and a snippet of code which is an update to that file. 
        You will identify where in the original file the patch should be applied.
        `),
    user("Here is the file"),
    assistant(fileContents.trim().length === 0 ? "<empty file>" : contentLined),
    user("Here is the snippet"),
    assistant(code),
  ];

  const isEntireFile = await chatYNQuestion(
    g35(
      ...preamble,
      user(`
        Does the snippet represent a portion of the file? Or does it represent a replacement for the entire file? 
        Keep in mind that it is extremely unexpected for large portions of a file to be completely deleted, and files ususlly start with imports.
        Respond true if it is the whole file, false if its a portion.

        This snippet is a replacement for the whole file (true/false): 
        `)
    )
  );

  if (isEntireFile) {
    return code;
  }

  const { startingLine, endingLine } = await sequence(tx, [
    g4(
      ...preamble,
      user(`
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
        `)
    ),
  ])
    .then(extractPossibleCodeSnippet)
    .then(asJSON<{ startingLine: number; endingLine: number }>);

  return [
    fileContents
      .split("\n")
      .slice(0, startingLine - 1)
      .join("\n"),
    code,
    fileContents.split("\n").slice(endingLine).join("\n"),
  ].join("\n");
}

export function appendLineNumbers(input: string): string {
  const lines = input.split("\n");
  const numberedLines = lines.map((line, index) => `${index + 1}. ${line}`);
  return numberedLines.join("\n");
}

export function stripLineNumbers(input: string): string {
  return input
    .split("\n")
    .map((line) => line.replace(/^\d+.\s?/, ""))
    .join("\n");
}

export function takeUntil(
  fileContents: string,
  untilLineNo: number,
  n: number
): string {
  const lines = fileContents.split("\n");
  const startLineNo = Math.max(0, untilLineNo - n); // clamp startLineNo to be at least 0
  return lines.slice(startLineNo, untilLineNo).join("\n");
}

export function takeAfter(
  fileContents: string,
  afterLineNo: number,
  n: number
): string {
  const lines = fileContents.split("\n");
  const startLineNo = Math.min(lines.length, afterLineNo); // clamp startLineNo to be at most lines.length
  const endLineNo = Math.min(lines.length, startLineNo + n); // clamp endLineNo to be at most lines.length
  return lines.slice(startLineNo, endLineNo).join("\n");
}

export function reformat(sourceCode: string): Promise<string> {
  return prettier.format(sourceCode, { parser: "typescript" });
}
