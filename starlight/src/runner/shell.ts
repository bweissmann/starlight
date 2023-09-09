import "dotenv/config";
import "source-map-support/register.js";
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
    (await sequence(tx, [
      g35(
        system(`
        # Your job is to parse a command from the user's message.
        
        You know the following commands:

        ## project
        > aliases: p, project, switch, change project, use project 
        - switch the active project to <directory> 

        ## create file
        > aliases: c, new file, create, create a file
        - Creates a file

        ## modify file
        > aliases: m, modify, edit, edit file
        - Modifies a file

        ## zsh
        > aliases: z, shell, terminal, command
        - Start a new agent which can navigate and use the terminal

        Respond in JSON Format:
        \`\`\`json
        {
            "command": 'project' | 'create file' | 'modify file' | 'zsh',
        }
        \`\`\`
        `),
        input
      ),
    ])
      .then(asJSON<{ command: Command }>)
      .then((parsed) => parsed.command));

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
