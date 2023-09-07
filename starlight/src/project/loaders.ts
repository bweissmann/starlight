import { readOrEmptyString } from "@/fs/read";
import { Tx } from "./context";
export async function loadProjectContext(projectDirectory?: string) {
  return loadProjectFile("context.md", projectDirectory);
}

export async function loadProjectStyleGuide(tx: Tx) {
  return loadProjectFile("style.md", tx.projectDirectory);
}

async function loadProjectFile(filename: string, projectDirectory?: string) {
  if (projectDirectory === undefined) {
    return "";
  }
  return readOrEmptyString(`${projectDirectory}/.starlight/${filename}`);
}
