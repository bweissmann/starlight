import { promises as fs } from 'fs';
import { directoryOf, filenameOf } from './utils.js';

export default async function write(where: { directory: string, filename: string } | { filepath: string }, contents: string): Promise<void> {
  const directory = 'directory' in where ? where.directory : directoryOf(where.filepath);
  const filename = 'filename' in where ? where.filename : filenameOf(where.filepath)

  try {
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(`${directory}/${filename}`, contents);
    console.log(`Successfully wrote contents to ${directory}/${filename}`);
  } catch (error) {
    console.error(`Error writing contents to ${directory}/${filename}: ${error}`);
  }
}
