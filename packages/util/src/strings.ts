export function sanitizeString(str: string): string {
  if (str === "") {
    return "";
  }

  // TODO improve this sanitation
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"'"/g, '"&apos;"')
    .replace(/script/g, "");
}
