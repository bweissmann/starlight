import { readOrEmptyString } from "@/fs/read";
import { Cx, Tx } from "./context";

export async function loadBuildSystemContext(cx: Cx) {
  return loadProjectFile(cx, "build.md");
}

export async function loadProjectStyleGuide(cx: Cx) {
  return loadProjectFile(cx, "style.md");
}

async function loadProjectFile(cx: Cx, filename: string) {
  return readOrEmptyString(`${cx.projectDirectory}/.starlight/${filename}`);
}
