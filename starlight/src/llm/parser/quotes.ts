// If the string starts and ends with " or ', remove them and return the inner result. otherwise return the original string.
export function maybeStripQuotes(raw:string) {
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }
  return raw;
}