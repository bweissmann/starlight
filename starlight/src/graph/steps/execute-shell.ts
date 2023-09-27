import { executeCommand } from "@/agents/zsh-driver";
import { safely } from "@/utils";
import { node } from "../nodes";

export const node__executeShell = node(async (command: string, { tx }) => {
  return await safely(executeCommand, tx.projectDirectory, command);
})
