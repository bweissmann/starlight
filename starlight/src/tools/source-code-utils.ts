import { Tx } from "@/project/context";
import blankspace from "@/blankspace/blankspace";

export async function insertSnippetIntoFile(
  tx: Tx,
  fileContents: string,
  code: string
) {
  const contentLined = appendLineNumbers(fileContents);

  const inputs = {
    "FILE": fileContents.trim().length === 0 ? "<empty file>" : contentLined,
    "SNIPPET": code
  }

  const isEntireFile = await blankspace.build(`
         Does the code snippet represent a portion of the file? Or does it represent a replacement for the entire file?  
         Keep in mind that it is extremely unexpected for large portions of a file to be completely deleted, and files ususlly start with imports.
         Respond true if it is the whole file, false if its a portion.  

         This snippet is a replacement for the whole file (true/false):
  `).run(inputs)

  if (isEntireFile) {
    return code;
  }
  const { startingLine, endingLine } = await blankspace.build(
    `You'll be given the original source code file and a snippet of code to update the file (below).
    Decide what portion of the original file shuold be replaced with this patch. 
    Respond with the line number of the first line to be replaced and the line number of the last line to be replaced:
    { startingLine, endingLine }
    `).run(inputs)

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
