let officeparser: typeof import("officeparser") | null = null;

async function loadOfficeparser(): Promise<typeof import("officeparser")> {
  officeparser ??= await import("officeparser");
  return officeparser;
}

type SupportedFileType =
  | "docx"
  | "odt"
  | "odp"
  | "ods"
  | "pdf"
  | "rtf"
  | "md"
  | "epub";

const EXTENSION_MAP: Record<string, SupportedFileType> = {
  docx: "docx",
  doc: "docx",
  odt: "odt",
  odp: "odp",
  ods: "ods",
  pdf: "pdf",
  rtf: "rtf",
  md: "md",
  epub: "epub",
};

const MIME_TYPE_MAP: Record<string, SupportedFileType> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.oasis.opendocument.text": "odt",
  "application/vnd.oasis.opendocument.presentation": "odp",
  "application/vnd.oasis.opendocument.spreadsheet": "ods",
  "application/pdf": "pdf",
  "application/rtf": "rtf",
  "text/markdown": "md",
  "text/x-markdown": "md",
  "application/epub+zip": "epub",
};

function detectFiletype(
  filename: string,
  filetype: string,
): SupportedFileType | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (EXTENSION_MAP[ext]) return EXTENSION_MAP[ext];
  if (MIME_TYPE_MAP[filetype]) return MIME_TYPE_MAP[filetype];
  return null;
}

export async function convertToText(
  file: File,
  filename: string,
  filetype: string,
): Promise<string> {
  const { parseOffice } = await loadOfficeparser();
  const buffer = await file.arrayBuffer();
  const fileType = detectFiletype(filename, filetype);
  const ast = await parseOffice(buffer, { fileType });
  const { value } = await ast.to("text", {
    includeImages: false,
    textConfig: { preserveLayout: false, renderNotes: false },
  });
  return value;
}
