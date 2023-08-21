import path from 'path';

export function filenameOf(filepath: string) {
    return path.basename(filepath);
}

export function directoryOf(filepath: string) {
    return path.dirname(filepath);
}
