import { Tx } from "@/project/context";
import read from "@/fs/read";
import { getFilepath } from "@/fs/get-filepath";
import { reformat } from "@/tools/prettier";
import write from "@/fs/write";
import { logger, makeSafeFromBackticks } from "@/utils";
import tree from "@/fs/tree";
import path from "path";
import { GENERATE_filenameIdentifier } from "./generators/generate-filename";
import { GENERATE_TSAnnotation } from "./generators/generate-ts-annotation";
import GENERATE_promptFirstDraft from "./generators/styles/email/generate-first-draft-prompt";
import GENERATE_formatInstructions from "./generators/generate-format-instructions";
import { GENERATE_outputParser } from "./generators/generate-output-parser";
import { GENERATE_testcases } from "./generators/generate-test-cases";
import chalk from "chalk";
import { emit } from "@/redis";
/* 
Non-watch mode

1. Use ts-morph to find all references
2. Check that the corresponding declarations exist
    - Each file will have an export const spec as const (to narrow it) with the exact text of the identifier, we can filter on these
*/

const PROMPTS_FILEPATH = ["src", "blankspace", "built", "prompts"];

async function getNonDuplicatedFilename(tx: Tx, filenameIdentifier: string) {
  const duplicateFilenames = await tree(
    path.join(tx.projectDirectory, ...PROMPTS_FILEPATH)
  )
    .then((files) => files.map((file) => path.basename(file)))
    .then((files) =>
      files.filter((file) => file.startsWith(filenameIdentifier))
    );

  if (duplicateFilenames.length === 0) {
    return `${filenameIdentifier}.ts`;
  } else {
    const versionNumbers = duplicateFilenames
      .map((filename) =>
        path
          .basename(filename)
          .replace(`${filenameIdentifier}_v`, "")
          .replace(".ts", "")
      )
      .filter((version) => !isNaN(parseInt(version)))
      .map((version) => parseInt(version));
    const highestVersion =
      versionNumbers.length > 0 ? Math.max(...versionNumbers) : 1;
    return `${filenameIdentifier}_v${highestVersion + 1}.ts`;
  }
}

async function GENERATE_uniqueFilename(tx: Tx, input: string) {
  const filenameIdentifier = await GENERATE_filenameIdentifier(tx, input);
  return await getNonDuplicatedFilename(tx, filenameIdentifier);
}

async function writeSkeleton(
  tx: Tx,
  spec: string,
  toFilename: string,
  tsAnnotation: string
) {
  const template = read(await getFilepath(tx, "blankspace/template.ts"));
  const skeleton = await template
    .then((s) =>
      s.replace(
        `"" as const; // TODO: fill in spec`,
        `\`${makeSafeFromBackticks(spec)}\` as const;`
      )
    )
    .then((s) =>
      s.replace("never; // TODO: fill in filename", `"${toFilename}";`)
    )
    .then((s) => s.replace("unknown; // TODO: fill in return", tsAnnotation))
    .then(logger())
    .then(reformat);

  await write(
    { filename: toFilename, directory: path.join(tx.projectDirectory, ...PROMPTS_FILEPATH) },
    skeleton
  );
}

async function addToSkeleton(
  tx: Tx,
  filename: string,
  replaceTarget: string | RegExp,
  replacement: string
) {
  const filepath = path.join(
    tx.projectDirectory,
    ...PROMPTS_FILEPATH,
    filename
  );
  const existingContent = await read(filepath);
  const newContent = existingContent.replace(replaceTarget, replacement);
  await write({ filepath }, newContent);
}

async function addPromptToSkeleton(
  tx: Tx,
  filename: string,
  promptFirstDraft: string
) {
  await addToSkeleton(
    tx,
    filename,
    "// TODO: fill in prompt",
    makeSafeFromBackticks(promptFirstDraft)
  );
}

async function addParserToSkeleton(tx: Tx, filename: string, parser: string) {
  await addToSkeleton(
    tx,
    filename,
    /async function parse\(raw: string\)[\s\S]*?\/\/ TODO: implement parse/m,
    parser.replace(/ReturnType/g, `Prompt["inferred"]["returns"]`)
  );
}

async function addImportToGeneratedPrompts(tx: Tx, toFilename: string) {
  const generatedPromptsFilepath = await getFilepath(
    tx,
    "blankspace/built-prompts.ts"
  );

  const toFilenameIdentifier = toFilename.replace(".ts", "");
  const content = await read(generatedPromptsFilepath)
    .then((s) =>
      noWhitespace(s).includes(
        noWhitespace(`await import("./prompts/${toFilenameIdentifier}.js"),`)
      )
        ? s
        : s.replace(
          "// append namespace",
          `await import("./prompts/${toFilenameIdentifier}.js"),\n// append namespace`
        )
    )
    .then(reformat);

  await write({ filepath: generatedPromptsFilepath }, content);
}

export async function generatePrompt(tx: Tx, spec: string) {
  const timerStart = performance.now();
  const promiseOfFilename = GENERATE_uniqueFilename(tx, spec);
  const promiseOfTSAnnotation = GENERATE_TSAnnotation(tx, spec);
  const promiseOfPromptFirstDraft = GENERATE_promptFirstDraft(tx, spec);

  const [filename, tsAnnotation] = await Promise.all([
    promiseOfFilename,
    promiseOfTSAnnotation,
  ]);

  const promiseOfFormatInstructions = GENERATE_formatInstructions(
    tx,
    spec,
    tsAnnotation
  );

  await writeSkeleton(tx, spec, filename, tsAnnotation);
  emit(tx, "TIMING", {
    name: "skeleton ready",
    duration: `${(performance.now() - timerStart) / 1000}s`,
  });
  await addImportToGeneratedPrompts(tx, filename);

  const [promptFirstDraft, formatInstructions] = await Promise.all([
    promiseOfPromptFirstDraft,
    promiseOfFormatInstructions,
  ]);

  const promptWithFormatInstructions = promptFirstDraft.replace(
    "<possible further instructions>",
    formatInstructions
  );

  await addPromptToSkeleton(tx, filename, promptWithFormatInstructions);

  const hypotheticalResponses = await GENERATE_testcases(
    tx,
    promptWithFormatInstructions
  );

  await addToSkeleton(
    tx,
    filename,
    `// TODO: optionally add hypothetical responses.`,
    makeSafeFromBackticks(hypotheticalResponses)
  );

  const parser = await GENERATE_outputParser(
    tx,
    promptWithFormatInstructions,
    hypotheticalResponses,
    tsAnnotation
  );

  await addParserToSkeleton(tx, filename, parser);
  emit(tx, "TIMING", {
    name: "full prompt ready",
    duration: `${(performance.now() - timerStart) / 1000}s`,
  });
}

function noWhitespace(text: string) {
  return text.replace(/\s/g, "");
}
