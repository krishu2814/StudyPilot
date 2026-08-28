export interface TextSplitterOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

/**
 * Splits text into overlapping chunks using recursive character splitting.
 * Tries splitting by paragraphs (\n\n), newlines (\n), sentence endings (. ! ?), spaces, and finally characters.
 */
export class RecursiveCharacterTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(options?: TextSplitterOptions) {
    this.chunkSize = options?.chunkSize ?? 500;
    this.chunkOverlap = options?.chunkOverlap ?? 100;
    this.separators = ["\n\n", "\n", ". ", "! ", "? ", " ", ""];

    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error("chunkOverlap must be smaller than chunkSize");
    }
  }

  splitText(text: string): string[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const trimmed = text.trim();
    if (trimmed.length <= this.chunkSize) {
      return [trimmed];
    }

    return this.split(trimmed, this.separators);
  }

  private split(text: string, separators: string[]): string[] {
    const finalChunks: string[] = [];

    // Find the best separator that exists in text
    let separator = separators[separators.length - 1];
    let newSeparators: string[] = [];

    for (let i = 0; i < separators.length; i++) {
      const s = separators[i];
      if (s === "" || text.includes(s)) {
        separator = s;
        newSeparators = separators.slice(i + 1);
        break;
      }
    }

    const splits = separator === "" ? Array.from(text) : text.split(separator);
    const goodSplits: string[] = [];

    for (const s of splits) {
      if (s.trim().length > 0) {
        goodSplits.push(s.trim());
      }
    }

    let currentChunk: string[] = [];
    let currentLen = 0;

    for (const split of goodSplits) {
      const splitLen = split.length + (currentChunk.length > 0 && separator !== "" ? separator.length : 0);

      if (currentLen + splitLen > this.chunkSize && currentChunk.length > 0) {
        const chunkStr = currentChunk.join(separator === "" ? "" : separator);
        if (chunkStr.length > this.chunkSize && newSeparators.length > 0) {
          finalChunks.push(...this.split(chunkStr, newSeparators));
        } else {
          finalChunks.push(chunkStr);
        }

        // Apply overlap
        while (currentLen > this.chunkOverlap && currentChunk.length > 0) {
          const removed = currentChunk.shift()!;
          currentLen -= removed.length + (currentChunk.length > 0 && separator !== "" ? separator.length : 0);
        }
      }

      currentChunk.push(split);
      currentLen += split.length + (currentChunk.length > 1 && separator !== "" ? separator.length : 0);
    }

    if (currentChunk.length > 0) {
      const chunkStr = currentChunk.join(separator === "" ? "" : separator);
      if (chunkStr.length > this.chunkSize && newSeparators.length > 0) {
        finalChunks.push(...this.split(chunkStr, newSeparators));
      } else {
        finalChunks.push(chunkStr);
      }
    }

    return finalChunks.filter((chunk) => chunk.trim().length > 0);
  }
}

export const defaultTextSplitter = new RecursiveCharacterTextSplitter();
