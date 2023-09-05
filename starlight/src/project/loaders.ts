import { readOrEmptyString } from "@/fs/read";
export async function loadProjectContext(projectDirectory?: string) {
    return loadProjectFile('context.md', projectDirectory);
}

export async function loadProjectStyleGuide(projectDirectory: string) {
    return loadProjectFile('style.md', projectDirectory);
}

async function loadProjectFile(filename: string, projectDirectory?: string) {
    if (projectDirectory === undefined) {
        return ''
    }
    return readOrEmptyString(`${projectDirectory}/.starlight/${filename}`)
}