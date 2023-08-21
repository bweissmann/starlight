import getInput from '@/tools/user_input.js';
import write from '@/fs/write.js';

export default async function promptCreateEmptyFile() {
    const filename = await getInput('Enter the filename: ');
    await write({filepath: filename}, '');
}