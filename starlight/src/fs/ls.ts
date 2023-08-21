import { promises as fs } from 'fs';
import pretty_print_directory from './pretty_print_directory.js';

export default async function ls(directory: string, recursive: boolean = true): Promise<string[]> {
  const files: string[] = [];

  async function readDirectory(dir: string): Promise<void> {
    const entries = await fs.readdir(dir);

    for (const entry of entries) {
      const fullPath = `${dir}/${entry}`;
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory() && recursive) {
        await readDirectory(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  await readDirectory(directory);
  return files;
}

export async function lsPrettyPrint(directory: string) {
  const files = await ls(directory);
  return pretty_print_directory(files);
}