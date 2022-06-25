import * as Loader from "../elements/loader";

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

export async function getSection(): Promise<Section> {
  Loader.show();

  const language = "javascript";

  const repoListRequestEndpoint = `https://api.github.com/search/repositories?q=language:${language}&sort=stars&order=desc`;
  console.log(repoListRequestEndpoint);
  const repoListResponse = (await apiRequest(
    repoListRequestEndpoint
  )) as RepoListResponse;
  const repoName = getRandomItem(repoListResponse.items).full_name;

  const fileListEndpoint = `https://api.github.com/search/code?q=%20+language:${language}+repo:${repoName}`;
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

function getRandomItem<T>(list: T[]): T {
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}
