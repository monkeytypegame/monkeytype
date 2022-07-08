import * as Loader from "../elements/loader";
import { getRandomItem } from "../utils/arrays";
import { cache } from "../utils/decorators";

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

interface Section {
  words: string[];
}

interface RepoSearchResponse {
  items: {
    full_name: string;
  }[];
}

interface FileSearchResponse {
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
  const fileUrls = await getFileUrlsWithCache(codeLanguage);
  const fileUrl = getRandomItem(fileUrls);
  const fileContent = await fetchFileContent(fileUrl);
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

async function getFileUrls(codeLanguage: string): Promise<string[]> {
  const repoSearchResponse = await searchRepos(codeLanguage);
  const topRepos = repoSearchResponse.items.slice(0, 25);
  const topRepoNames = topRepos.map((item) => item.full_name);
  const selectedRepoName = getRandomItem(topRepoNames);

  const fileSearchResponse = await searchFiles(codeLanguage, selectedRepoName);
  const fileUrls = fileSearchResponse.items.map((item) => item.url);
  return fileUrls;
}

const getFileUrlsWithCache = cache(getFileUrls);

async function searchRepos(codeLanguage: string): Promise<RepoSearchResponse> {
  const endpoint = `/search/repositories?q=language:${codeLanguage}&sort=stars&order=desc`;
  const response = await sendGithubApiRequest(endpoint);
  return response as RepoSearchResponse;
}

async function searchFiles(
  codeLanguage: string,
  repoName: string
): Promise<FileSearchResponse> {
  const endpoint = `/search/code?q=%20+language:${codeLanguage}+repo:${repoName}`;
  const response = (await sendGithubApiRequest(endpoint)) as FileSearchResponse;
  return response as FileSearchResponse;
}

async function fetchFileContent(url: string): Promise<string> {
  const response = (await sendGithubApiRequest(url)) as FileResponse;
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

async function sendGithubApiRequest(endpoint: string): Promise<unknown> {
  const origin = "https://api.github.com";
  const url = origin + endpoint;
  const fileRequest = await fetch(url);
  if (!fileRequest.ok) {
    throw Error(fileRequest.statusText);
  }
  return await fileRequest.json();
}
