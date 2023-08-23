import getInput from '@/tools/user_input.js';
import write from '@/fs/write.js';
import fs from 'fs/promises';
import { fileExists } from '@/fs/read.js';
import path from 'path';

export default async function promptCreateEmptyFile() {
    const filename = await getInput('Enter the filename: ');
    if (await fileExists(path.dirname(filename))) {

    }
    await write({ filepath: filename }, '');
}