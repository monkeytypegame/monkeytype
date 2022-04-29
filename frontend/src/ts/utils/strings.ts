/**
 *
 * @param text String to split
 * @param delimiters Single character delimiters.
 */
export function splitByAndKeep(text: string, delimiters: string[]): string[] {
  const splitString: string[] = [];
  let currentToken: string[] = [];
  const delimiterSet = new Set<string>(delimiters);

  for (const char of text) {
    if (delimiterSet.has(char)) {
      if (currentToken.length > 0) {
        splitString.push(currentToken.join(""));
      }
      splitString.push(char);
      currentToken = [];
    } else {
      currentToken.push(char);
    }
  }

  if (currentToken.length > 0) {
    splitString.push(currentToken.join(""));
  }

  return splitString;
}
