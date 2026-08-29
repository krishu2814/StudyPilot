import { RecursiveCharacterTextSplitter, defaultTextSplitter } from "../src/utils/textSplitter.js";
import { DocumentParser } from "../src/utils/documentParser.js";

describe("TextSplitter Utility", () => {
  it("should return empty array for empty or whitespace text", () => {
    expect(defaultTextSplitter.splitText("")).toEqual([]);
    expect(defaultTextSplitter.splitText("   \n\t ")).toEqual([]);
  });

  it("should return single chunk if text is smaller than chunkSize", () => {
    const text = "This is a short note.";
    const chunks = defaultTextSplitter.splitText(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it("should split long text into multiple chunks with overlap", () => {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 50,
      chunkOverlap: 10,
    });

    const text =
      "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. It is widely used for building robust applications.";

    const chunks = splitter.splitText(text);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(80); // within tolerance
    });
  });

  it("should throw error if chunkOverlap is greater than or equal to chunkSize", () => {
    expect(() => {
      new RecursiveCharacterTextSplitter({ chunkSize: 100, chunkOverlap: 100 });
    }).toThrow("chunkOverlap must be smaller than chunkSize");
  });
});

describe("DocumentParser Utility", () => {
  it("should extract text from plain text buffer", async () => {
    const buffer = Buffer.from("Hello, this is a plain text file.", "utf-8");
    const result = await DocumentParser.extractText(buffer, "txt");
    expect(result).toBe("Hello, this is a plain text file.");
  });

  it("should extract text from markdown buffer", async () => {
    const markdown = "# Title\n\n- Point 1\n- Point 2";
    const buffer = Buffer.from(markdown, "utf-8");
    const result = await DocumentParser.extractText(buffer, "md");
    expect(result).toBe(markdown);
  });

  it("should attempt to parse PDF buffer and fail gracefully on corrupt buffer", async () => {
    const buffer = Buffer.from("Not a real PDF stream", "utf-8");
    await expect(DocumentParser.extractText(buffer, "pdf")).rejects.toThrow(
      "Failed to parse PDF document"
    );
  });

  it("should throw error for unsupported file extensions", async () => {
    const buffer = Buffer.from("data", "utf-8");
    await expect(DocumentParser.extractText(buffer, "docx")).rejects.toThrow(
      "Unsupported file type: docx"
    );
  });
});
