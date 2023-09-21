import "@/runner/initializer";
import { sequence } from "@/llm/chat";
import { g35, system } from "@/llm/utils";
import getInput from "@/tools/user-input";
import asJSON from "@/llm/parser/json";
import { modifyFile } from "./utils";
import chalk from "chalk";
import path from "path";
import process from "process";
import { zshDriver } from "@/agents/zsh-driver";
import { Tx, defaultTx } from "@/project/context";
import { emit } from "@/redis";
import blankspace from "@/blankspace/blankspace";
type Command = "project" | "create file" | "modify file" | "zsh";

async function repl(tx: Tx): Promise<void> {
  console.log(chalk.green(`Working project ${tx.projectDirectory}`));

  const hardcodeAliases: Record<Command, string[]> = {
    project: ["project", "p", "switch", "change project", "use project"],
    "modify file": ["modify file", "m", "modify", "edit", "edit file"],
    "create file": ["create file", "c", "new file", "create", "create a file"],
    zsh: ["zsh", "z", "shell", "terminal", "command"],
  };

  const input = await getInput("(p)roject, (m)odify, (c)reate, (z)sh: ");
  const commandExactMatch = (Object.keys(hardcodeAliases) as Command[]).find(
    (key) => hardcodeAliases[key].includes(input)
  );
  const command =
    commandExactMatch ||
    (await blankspace
      .build(
        `parse the user input into which action they want to take. 
        Here\'s what we asked for user input: \`\`\`(p)roject, (m)odify, (c)reate, (z)sh: \`\`\` 
        Your prompt will only be given inputs that are not an exact string match.
        Maybe they misspelled a command or described it in other words.
        The output should be type Command = "project" | "create file" | "modify file" | "zsh";`
      )
      .with(tx)
      .run([input]));

  switch (command) {
    case "project":
      const homeDirectory = process.env.HOME || process.env.USERPROFILE || "/";
      const relativeDirectory = await getInput(`switch to? ${homeDirectory}/`);
      const projectDirectory = path.join(homeDirectory, relativeDirectory);
      return await repl(defaultTx(projectDirectory));
    case "create file":
      throw "unimplemented";
      break;
    case "modify file":
      await modifyFile(tx.spawn());
      break;
    case "zsh":
      const task = await getInput("task: ");
      await zshDriver(tx.spawn(), task);
      break;
  }

  return await repl(tx.spawn()); // recursive repl
}

const tx = defaultTx(process.argv[2]);
await emit(tx, "INIT", {});
console.log(tx.rx.id);

repl(tx);
