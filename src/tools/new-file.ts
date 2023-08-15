
import { promises as fs } from 'fs';
import path from 'path';
import getInput from '@/tools/user_input.js';

export default async function promptCreateEmptyFile() {
    const filename = await getInput('Enter the filename: ');
    const directory = path.dirname(filename);

    // Create the directory if it doesn't exist
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(filename, '');
}
