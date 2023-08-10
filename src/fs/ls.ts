import { promises as fs } from 'fs';

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