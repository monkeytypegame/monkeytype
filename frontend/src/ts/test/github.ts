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
  const endpoint = `https://api.github.com/search/repositories?q=language:${codeLanguage}&sort=stars&order=desc`;
  const response = await sendGithubApiRequest(endpoint);
  return response as RepoSearchResponse;
}

async function searchFiles(
  codeLanguage: string,
  repoName: string
): Promise<FileSearchResponse> {
  const endpoint = `https://api.github.com/search/code?q=%20+language:${codeLanguage}+repo:${repoName}`;
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

async function sendGithubApiRequest(url: string): Promise<unknown> {
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

function cache<T extends unknown[], U>(
  fn: (...args: T) => U,
  options = {
    cacheDurationMilliseconds: 30000,
  }
): (...args: T) => U {
  let cacheTimestamp = Date.now();
  const cache = new Map();

  const isCacheExpired = (): boolean => {
    if (cacheTimestamp === null) {
      return true;
    }

    if (Date.now() > cacheTimestamp + options.cacheDurationMilliseconds) {
      return true;
    }

    return false;
  };

  const cachedFn = (...args: T): U => {
    if (isCacheExpired()) {
      cache.clear();
    }

    const cacheKey = JSON.stringify(args);

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = fn(...args);

    cache.set(cacheKey, result);
    cacheTimestamp = Date.now();

    return result;
  };

  return cachedFn;
}
