import { promises as fs } from 'fs';
import ignore from 'ignore';
import pretty_print_directory from './pretty_print_directory.js';
import path from 'path';
import { fileExists, readOrEmptyString } from './read.js';

export default async function tree(rootDirectory: string, filterByGitignore: boolean = true): Promise<string[]> {
    rootDirectory = path.resolve(rootDirectory)

    const gitignores = filterByGitignore ? await collectGitignores(rootDirectory) : [];
    const ignoreObjects = await Promise.all(gitignores.map(async ignoreFilename => {
        const ig = ignore();
        ig.add(await readOrEmptyString(ignoreFilename));
        return { dir: path.dirname(ignoreFilename), ig };
    }));

    const files: string[] = [];

    async function readDirectory(dir: string): Promise<void> {
        const entries = await fs.readdir(dir);

        for (const entry of entries) {
            const fullPath = path.resolve(dir, entry);
            const stats = await fs.stat(fullPath);

            if (filterByGitignore && ignoreObjects.some(({ dir, ig }) => ig.ignores(path.relative(dir, fullPath)))) {
                continue;
            }
            if (stats.isDirectory()) {
                await readDirectory(fullPath);
            } else {
                files.push(path.relative(rootDirectory, fullPath));
            }
        }
    }

    await readDirectory(rootDirectory);
    return files;
}

export async function treePrettyPrint(directory: string) {
    try {
        const files = await tree(directory);
        return pretty_print_directory(files, directory);
    } catch (e) {
        return `Could not read directory ${directory}`
    }
}

async function collectGitignores(filepath: string): Promise<string[]> {
    const gitignores: string[] = [];
    let currentPath = path.resolve(filepath);

    while (currentPath !== path.resolve('/')) {
        const gitignorePath = path.join(currentPath, '.gitignore');
        if (await fileExists(gitignorePath)) {
            gitignores.push(gitignorePath);
        }
        currentPath = path.dirname(currentPath);
    }

    return gitignores;
}

