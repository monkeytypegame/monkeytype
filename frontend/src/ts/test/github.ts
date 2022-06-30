import * as Loader from "../elements/loader";

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

  const languageIsMapped = Object.prototype.hasOwnProperty.call(
    languageToGithubLanguageMap,
    language
  );
  const codeLanguage = languageIsMapped
    ? languageToGithubLanguageMap[language]
    : "javascript";

  const repoListRequestEndpoint = `https://api.github.com/search/repositories?q=language:${codeLanguage}&sort=stars&order=desc`;
  console.log(repoListRequestEndpoint);
  const repoListResponse = (await apiRequest(
    repoListRequestEndpoint
  )) as RepoListResponse;
  const repoName = getRandomItem(repoListResponse.items, {
    maxIndex: 25, // maxIndex because we want some randomness, but still want a popular repository
  }).full_name;

  const fileListEndpoint = `https://api.github.com/search/code?q=%20+language:${codeLanguage}+repo:${repoName}`;
  const fileListResponse = (await apiRequest(
    fileListEndpoint
  )) as FileListResponse;
  const fileContentEndpoint = getRandomItem(fileListResponse.items).url;

  const fileContentResponse = (await apiRequest(
    fileContentEndpoint
  )) as FileResponse;

  const decodedContent = window.atob(fileContentResponse.content);
  const words = decodedContent
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove invisible characters
    .replace(/\s+/g, " ") // Convert all whitespace to space
    .trim() // Removing whitespace before and after text
    .split(" ");

  const section = { words };

  Loader.hide();

  return section;
}

async function apiRequest(url: string): Promise<unknown> {
  const fileRequest = await fetch(url);
  if (!fileRequest.ok) {
    throw Error(fileRequest.statusText);
  }
  return await fileRequest.json();
}

function getRandomItem<T>(list: T[], options?: { maxIndex?: number }): T {
  const maxIndex = options?.maxIndex
    ? Math.min(list.length, options.maxIndex)
    : list.length;
  const randomIndex = Math.floor(Math.random() * maxIndex);
  return list[randomIndex];
}
