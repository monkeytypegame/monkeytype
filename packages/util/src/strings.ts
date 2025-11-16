export function sanitizeString(str: string): string {
  if (str === "") {
    return "";
  }

  return str
    .replace(/`/g, "&#96;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/\\/g, "&bsol;")
    .replace(/\n/, "")
    .replace(/script/g, "");
}
