import { access, readFile } from "fs/promises";

export default async function read(filename: string): Promise<string> {
  try {
    return await readFile(filename, 'utf-8');
  } catch (error) {
    console.error(`Error reading file: ${error}`);
    throw error;
  }
}

export async function fileExists(file: string) {
  try {
    await access(file);
    return true;
  } catch (error) {
    return false;
  }
};

export async function readOrEmptyString(filename: string): Promise<string> {
  try {
    return await readFile(filename, 'utf-8');
  } catch (error) {
    return ''; // File doesn't exist, return empty string
  }
}