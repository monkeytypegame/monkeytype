import * as Loader from "../elements/loader";

const fallbackCodeLanguage = "javascript";

const languageToGithubLanguageMap: Record<string, string> = {
  code_python: "python",
  code_c: "c",
  code_csharp: "csharp",
  "code_c++": "c++",
  code_dart: "dart",
  code_brainfck: "brainfuck",
  code_fsharp: "fsharp",
  code_javascript: "javascript",
  code_javascript_1k: "javascript",
  code_julia: "julia",
  code_html: "html",
  code_pascal: "pascal",
  code_java: "java",
  code_kotlin: "kotlin",
  code_go: "go",
  code_rust: "rust",
  code_ruby: "ruby",
  code_r: "r",
  code_swift: "swift",
  code_scala: "scala",
  code_bash: "bash",
  code_lua: "lua",
  code_matlab: "matlab",
  code_sql: "sql",
  code_perl: "perl",
  code_php: "php",
  code_vim: "vim",
};

const cacheDuration = 60000;
let cacheTimestamp = Date.now();
let cachedFileUrls: string[] | null = null;

interface Section {
  words: string[];
}

interface RepoListResponse {
  items: {
    full_name: string;
  }[];
}

interface FileListResponse {
  items: {
    name: string;
    url: string;
  }[];
}

interface FileResponse {
  content: string;
}

export async function getSection(language: string): Promise<Section> {
  Loader.show();

  const codeLanguage = getCodeLanguage(language);

  if (Date.now() > cacheTimestamp + cacheDuration) {
    cachedFileUrls = null;
  }

  if (cachedFileUrls === null) {
    const repoNames = await getTopRepos(codeLanguage);
    const repoName = getRandomItem(repoNames);
    const fileUrls = await getFileUrls(codeLanguage, repoName);

    cachedFileUrls = fileUrls;
    cacheTimestamp = Date.now();
  }

  const fileUrl = getRandomItem(cachedFileUrls);
  const fileContent = await getFileContent(fileUrl);
  const words = extractWords(fileContent);
  const section = { words };

  Loader.hide();

  return section;
}

function getCodeLanguage(language: string): string {
  const languageIsMapped = Object.prototype.hasOwnProperty.call(
    languageToGithubLanguageMap,
    language
  );
  return languageIsMapped
    ? languageToGithubLanguageMap[language]
    : fallbackCodeLanguage;
}

async function getTopRepos(codeLanguage: string): Promise<string[]> {
  const endpoint = `https://api.github.com/search/repositories?q=language:${codeLanguage}&sort=stars&order=desc`;
  const response = (await apiRequest(endpoint)) as RepoListResponse;
  const topRepos = response.items.slice(0, 25);
  return topRepos.map((repo) => repo.full_name);
}

async function getFileUrls(
  codeLanguage: string,
  repoName: string
): Promise<string[]> {
  const endpoint = `https://api.github.com/search/code?q=%20+language:${codeLanguage}+repo:${repoName}`;
  const response = (await apiRequest(endpoint)) as FileListResponse;
  return response.items.map((item) => item.url);
}

async function getFileContent(url: string): Promise<string> {
  const response = (await apiRequest(url)) as FileResponse;
  const content = window.atob(response.content);
  return content;
}

function extractWords(fileContent: string): string[] {
  return fileContent
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove invisible characters
    .replace(/\s+/g, " ") // Convert all whitespace to space
    .trim() // Removing whitespace before and after text
    .split(" ");
}

async function apiRequest(url: string): Promise<unknown> {
  const fileRequest = await fetch(url);
  if (!fileRequest.ok) {
    throw Error(fileRequest.statusText);
  }
  return await fileRequest.json();
}

function getRandomItem<T>(list: T[]): T {
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}
