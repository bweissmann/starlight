export function subsequenceMatch(query: string, candidate: string): boolean {
    let j = 0; // Index for candidate
    for (let i = 0; i < query.length && j < candidate.length; i++) {
        if (query.charAt(i) == candidate.charAt(j)) {
            j++;
        }
    }
    // If all characters of candidate were found in the query in order
    return (j == candidate.length);
}