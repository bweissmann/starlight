import { write_to_subdirectory } from '../fs/subdirectory';

/**
 * Creates a new file at: {directory}/.documentation/{filename} and writes the contents to that file.
 *
 * @param filepath - The full path {directory}/{filename}.
 * @param contents - The contents to be written to the file.
 */
export default async function document(filepath: string, contents: string): Promise<void> {
    await write_to_subdirectory(filepath, ".documentation", contents)
}