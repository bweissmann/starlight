import fs from 'fs/promises';
import write from './write';
import { directoryOf, filenameOf } from './utils';
import path from 'path';

/**
 * Writes contents to a file in a subdirectory of the given filepath.
 * @param filepath - The filepath of the file.
 * @param subdirectoryComponent - The name of the subdirectory.
 * @param contents - The contents to write to the file.
 * @returns A Promise that resolves when the file is written successfully.
 */
export async function write_to_subdirectory(filepath: string, subdirectoryComponent: string, contents: string): Promise<void> {
  return await write({ filepath: filepath_within_subdirectory(filepath, subdirectoryComponent) }, contents)

}

/**
 * Adds a subdirectory to the given filepath.
 * @param filepath - The filepath to add the subdirectory to.
 * @param subdirectory - The name of the subdirectory to add.
 * @returns An object containing the updated filepath and the directory path.
 */
export function filepath_within_subdirectory(filepath: string, subdirectoryComponent: string) {
  return path.join(
    directoryOf(filepath),
    subdirectoryComponent,
    filenameOf(filepath)
  );
}