import path from 'path';

interface Directory {
    name?: string;
    children: Directory[];
}

function createDirectoryStructure(paths: string[]): Directory {
    const directoryStructure: Directory = { children: [] };

    for (const _path of paths) {
        const directories = _path.split(path.sep);
        let currentDirectory = directoryStructure;

        for (const directory of directories) {
            let childDirectory = currentDirectory.children.find((child) => child.name === directory);
            if (!childDirectory) {
                childDirectory = { name: directory, children: [] };
                currentDirectory.children.push(childDirectory);
            }

            currentDirectory = childDirectory;
        }
    }

    return directoryStructure;
}

function printDirectoryStructure(directoryStructure: Directory, indent: string = '', namePrefix: string = ''): string {
    if (directoryStructure.children.length === 1) {
        const child = directoryStructure.children[0];
        const prefix = namePrefix + (directoryStructure.name ? directoryStructure.name + '/' : '');
        return printDirectoryStructure(child, indent, prefix);
    }

    const nameOutput = `${indent}- ${namePrefix}${directoryStructure.name}`;
    const childrenOutput = directoryStructure.children.map(child => {
        return printDirectoryStructure(child, indent + '   |');
    })

    return [nameOutput, ...childrenOutput].join('\n');
}

export default function pretty_print_directory(paths: string[]): string {
    const directoryStructure = createDirectoryStructure(paths);
    return printDirectoryStructure(directoryStructure);
}