import getInput from '@/tools/user_input';
import write from '@/fs/write';
import fs from 'fs/promises';
import { fileExists } from '@/fs/read';
import path from 'path';

export default async function promptCreateEmptyFile() {
    const filename = await getInput('Enter the filename: ');
    if (await fileExists(path.dirname(filename))) {

    }
    await write({ filepath: filename }, '');
}