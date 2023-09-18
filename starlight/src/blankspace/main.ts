import { Tx, defaultTx } from "@/project/context";
import "dotenv/config";
import "source-map-support/register.js";
import getOutputFormat from "./generators/get-output-format";
import getPrompt from "./generators/get-prompt";
import read from "@/fs/read";
import { getFilepath } from "@/fs/get-filepath";
import { reformat } from "@/tools/source-code-utils";
import write from "@/fs/write";
import { filenameOf } from "@/fs/utils";
import { makeSafeFromBackticks } from "@/utils";
import tree from "@/fs/tree";
import path from "path";
import getInput from "@/tools/user-input";
/* 
Non-watch mode

1. Use ts-morph to find all references
2. Check that the corresponding declarations exist
    - Each file will have an export const spec as const (to narrow it) with the exact text of the identifier, we can filter on these
*/

async function getNonDuplicatedFilename(tx: Tx, filenameIdentifier: string) {
  const duplicateFilenames = await tree(
    path.join(tx.projectDirectory, "src", "blankspace", "prompts")
  )
    .then((files) => files.map((file) => path.basename(file)))
    .then((files) =>
      files.filter((file) => file.startsWith(filenameIdentifier))
    );

  if (duplicateFilenames.length === 0) {
    return `${filenameIdentifier}.ts`;
  } else {
    return `${filenameIdentifier}_v${duplicateFilenames.length + 1}.ts`;
  }
}

/* filenameIdentifier does NOT have .ts extension */
export async function generatePrompt(
  tx: Tx,
  input: string,
  filenameIdentifier: string
) {
  const taretFilename = await getNonDuplicatedFilename(tx, filenameIdentifier);

  const prompt = await getPrompt(tx, input);
  const formatter = await getOutputFormat(tx, prompt);

  const template = read(await getFilepath(tx, "blankspace/template"));
  const output_filecontents = await template
    .then((s) =>
      s.replace(
        `"" as const; // TODO: fill in spec`,
        `\`${makeSafeFromBackticks(input)}\` as const;`
      )
    )
    .then((s) =>
      s.replace("// TODO: fill in prompt", makeSafeFromBackticks(prompt))
    )
    .then((s) =>
      s.replace(
        "function parse(raw: string) {} // TODO: implement parse",
        formatter.parser.replace(/ReturnType/g, `Prompt["inferred"]["returns"]`)
      )
    )
    .then((s) =>
      s.replace("never; // TODO: fill in filename", `"${taretFilename}";`)
    )
    .then((s) =>
      s.replace(
        "unknown; // TODO: fill in return",
        formatter.type.split("=")[1].split(";")[0]
      )
    )
    .then(reformat);

  await write(
    { filename: taretFilename, directory: "src/blankspace/prompts" },
    output_filecontents
  );

  const generatedpromptsfilepath = await getFilepath(
    tx,
    "generated-prompts.ts"
  );

  const filepathLastSegment = taretFilename.replace(".ts", "");
  const updatedgenprompts = await read(generatedpromptsfilepath)
    .then((s) =>
      s.includes(`await import("./prompts/${filepathLastSegment}.js"),`)
        ? s
        : s.replace(
            "// append namespace",
            `await import("./prompts/${filepathLastSegment}.js"),\n// append namespace`
          )
    )
    .then(reformat);

  await write({ filepath: generatedpromptsfilepath }, updatedgenprompts);
}