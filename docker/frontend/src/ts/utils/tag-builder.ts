export type Attributes = Record<string, string | true | undefined>;
type TagOptions = {
  tagname: string;
  classes?: string[];
  attributes?: Attributes;
  innerHTML?: string;
};

export function buildTag({
  tagname,
  classes,
  attributes,
  innerHTML,
}: TagOptions): string {
  let html = `<${tagname}`;
  if (classes !== undefined) html += ` class="${classes.join(" ")}"`;

  if (attributes !== undefined) {
    html +=
      " " +
      Object.entries(attributes)
        .filter((it) => it[1] !== undefined)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map((it) => (it[1] === true ? `${it[0]}` : `${it[0]}="${it[1]}"`))
        .join(" ");
  }

  if (innerHTML !== undefined) html += `>${innerHTML}</${tagname}>`;
  else html += " />";
  return html;
}
