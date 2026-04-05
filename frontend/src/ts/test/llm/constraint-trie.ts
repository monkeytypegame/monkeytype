import { ConstraintStateId } from "./types";
import { isValidSurfaceForm } from "./surface-forms";

type ConstraintTrieNode = {
  children: Map<string, ConstraintStateId>;
  isWord: boolean;
  prefix: string;
};

export class ConstraintTrie {
  readonly rootStateId = 0;

  private readonly nodes: ConstraintTrieNode[] = [
    {
      children: new Map<string, ConstraintStateId>(),
      isWord: false,
      prefix: "",
    },
  ];

  constructor(words: string[]) {
    if (words.length === 0) {
      throw new Error("ConstraintTrie requires at least one word");
    }

    for (const word of words) {
      if (!isValidSurfaceForm(word)) {
        throw new Error(
          `invalid surface form (must not contain spaces): ${word}`,
        );
      }

      this.addWord(word);
    }
  }

  getStateCount(): number {
    return this.nodes.length;
  }

  getPrefix(stateId: ConstraintStateId): string {
    return this.getNode(stateId).prefix;
  }

  isWordState(stateId: ConstraintStateId): boolean {
    return this.getNode(stateId).isWord;
  }

  consumeChar(
    stateId: ConstraintStateId,
    char: string,
  ): ConstraintStateId | null {
    const node = this.getNode(stateId);
    const directTransition = node.children.get(char);

    if (directTransition !== undefined) {
      return directTransition;
    }

    if (char === " " && node.isWord) {
      return this.rootStateId;
    }

    return null;
  }

  consumeText(
    stateId: ConstraintStateId,
    text: string,
  ): ConstraintStateId | null {
    let currentStateId = stateId;

    for (const char of text) {
      const nextStateId = this.consumeChar(currentStateId, char);

      if (nextStateId === null) {
        return null;
      }

      currentStateId = nextStateId;
    }

    return currentStateId;
  }

  private addWord(word: string): void {
    if (word.length === 0) {
      throw new Error("ConstraintTrie words must be non-empty");
    }

    let currentStateId = this.rootStateId;

    for (const char of word) {
      const currentNode = this.getNode(currentStateId);
      let nextStateId = currentNode.children.get(char);

      if (nextStateId === undefined) {
        nextStateId = this.nodes.length;
        this.nodes.push({
          children: new Map<string, ConstraintStateId>(),
          isWord: false,
          prefix: `${currentNode.prefix}${char}`,
        });
        currentNode.children.set(char, nextStateId);
      }

      currentStateId = nextStateId;
    }

    this.getNode(currentStateId).isWord = true;
  }

  private getNode(stateId: ConstraintStateId): ConstraintTrieNode {
    const node = this.nodes[stateId];

    if (node === undefined) {
      throw new Error(`Unknown constraint trie state: ${stateId}`);
    }

    return node;
  }
}
