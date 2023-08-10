export function filenameOf(filepath: string) {
    return filepath.substring(filepath.lastIndexOf('/') + 1);
}

export function directoryOf(filepath: string) {
    return filepath.substring(0, filepath.lastIndexOf('/'));
}