import { sequence } from "@/llm/chat";
import { g4 } from "@/llm/utils";
import read, { fileExists } from "@/fs/read";
import { treePrettyPrint } from "@/fs/tree";
import { extractCodeSnippets } from "@/tools/source-code-utils";
import getInput, { askMultiChoice } from "@/tools/user_input";
import asJSON from "@/llm/parser/json";
import chalk from "chalk";
import { zshDriver as prompts } from "./prompt";
import propose, {
  cleanUpProposalDirectory,
  proposalFilepath,
} from "@/tools/propose";
import { spawn } from "child_process";
import dedent from "dedent";
import fs from "fs/promises";
import { filepath_within_subdirectory } from "@/fs/subdirectory";
import path from "path";
import { Tx } from "@/project/context";
import { indent } from "@/utils";

type CommandInput = {
  command: "tree" | "cat" | "modify" | "quit" | "propose";
  args: string[];
};

export async function zshDriver(tx: Tx, task: string) {
  const intro = await prompts.intro(task, tx.projectDirectory);
  const reminder = prompts.reminder(task);
  const extractTakeaways = prompts.extractTakeaways(task);

  const initialresponse = await sequence([g4([intro, reminder])]);

  try {
    let previousresponse = initialresponse;
    for (let i = 0; i < 16; i++) {
      const previousHistoryWithoutReminder = [
        ...previousresponse.fullHistory.slice(0, -2),
        ...previousresponse.fullHistory.slice(-1),
      ];
      const cmd = await asJSON<CommandInput>(
        extractCodeSnippets(previousresponse.message)[0]
      );
      const result = await interpretAndExecute(cmd);
      console.log(chalk.cyan(result));
      await pause(`here's the result ^`);
      const takeaways = await sequence([
        g4(...previousHistoryWithoutReminder, result, extractTakeaways),
      ]);
      await pause("review takeaways");

      const nextllmresponse = await sequence([
        g4(...previousHistoryWithoutReminder, takeaways.message, reminder),
      ]);
      previousresponse = nextllmresponse;
    }
  } catch (e) {
    console.log(e);
  }
}

async function pause(message?: string) {
  await getInput(`${message ?? "continue?"} (enter)`);
}

async function interpretAndExecute(input: CommandInput): Promise<string> {
  switch (input.command) {
    case "tree":
      return await treePrettyPrint(input.args[0]);
    case "cat":
      try {
        return await read(input.args[0]);
      } catch (e) {
        return `could not read ${input.args[0]}`;
      }
    case "quit":
      throw "done!";
    case "propose":
      return await proposeCommands(input.args);
    case "modify":
      throw "asked to modify file: unimplemented";
  }
}

async function proposeCommands(commands: string[]) {
  const warning = chalk.bgRed.white.bold(
    "** Warning, this is running potentially malicious shell commands on your system **"
  );
  const filepath = "./.starlight/local/commands.sh";
  await propose(filepath, commands.join("\n"));

  console.log(dedent`
        ${warning}

        ${chalk.green.bold(await read(proposalFilepath(filepath)))}

        ${warning}
    `);

  return await askMultiChoice<string>(`Run commands?`, {
    y: async () => {
      const output = await dangerouslyExecuteTerminalCommands(filepath);
      return output.trim().length > 0
        ? output
        : "command finished with no stdout";
    },
    n: async () => {
      const feedback = await getInput("Why not? (or enter) ");
      if (feedback.trim().length === 0) {
        return "the user decided not to run the commands. you can re-ask the user if they want to run them or if they want to modify them";
      } else {
        return `the user decided not to run the commands. They said: ${feedback}`;
      }
    },
  });
}

async function dangerouslyExecuteTerminalCommands(filepath: string) {
  const fileContents = await read(proposalFilepath(filepath));
  const commands = fileContents.split("\n");

  let output = "";
  for (let i = 0; i < commands.length; i++) {
    const result = await executeCommand(commands[i]);
    output += result;
    if (i < commands.length - 1) {
      await pause(`Executed ${i + 1}/${commands.length}`);
    }
  }
  // Move the proposal file to a completed directory after executing all commands
  await fs.mkdir(path.join(path.dirname(filepath), ".completed"), {
    recursive: true,
  });
  const completedFilepath = filepath_within_subdirectory(
    filepath,
    ".completed"
  );
  const date = new Date();
  if (await fileExists(completedFilepath)) {
    await fs.appendFile(
      completedFilepath,
      `\n${date.toISOString()}\n` + fileContents
    );
  } else {
    await fs.writeFile(
      completedFilepath,
      `${date.toISOString()}\n` + fileContents
    );
  }
  await fs.rm(proposalFilepath(filepath));
  await cleanUpProposalDirectory(filepath);

  return output;
}
export async function executeCommand(
  command: string,
  opts?: { verbose: boolean }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(" ");

    const child = spawn(cmd, args);

    let stdout = "";
    let stderr = "";

    // Stream stdout to console and accumulate
    child.stdout.on("data", (data) => {
      console.log(chalk.blue(data.toString()));
      stdout += data.toString();
    });

    // Stream stderr to console and accumulate
    child.stderr.on("data", (data) => {
      console.log(chalk.red(data.toString()));
      stderr += data.toString();
    });

    // Resolve the promise with the accumulated output when the process finishes
    child.on("close", (code) => {
      if (code !== 0) {
        reject(`
Command exited with code ${code}.
Output: 
${indent(stdout)}
Error: 
${indent(stderr)}
        `);
      } else {
        resolve(stdout);
      }
    });

    // Handle errors
    child.on("error", (error) => {
      reject(error);
    });
  });
}
