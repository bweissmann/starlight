
export function appendLineNumbers(input: string): string {
    const lines = input.split('\n');
    const numberedLines = lines.map((line, index) => `${index + 1}. ${line}`);
    return numberedLines.join('\n');
}

export function stripLineNumbers(input: string): string {
    return input
        .split('\n')
        .map(line => line.replace(/^\d+.\s?/, ''))
        .join('\n');
}
