import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export class DocumentParser {
  static async extractText(buffer: Buffer, fileType: string): Promise<string> {
    const normalizedType = fileType.toLowerCase().replace(/^\./, "");

    switch (normalizedType) {
      case "pdf":
        return this.parsePdf(buffer);
      case "txt":
      case "md":
      case "markdown":
        return buffer.toString("utf-8");
      default:
        throw new Error(`Unsupported file type: ${fileType}. Supported types: pdf, txt, md`);
    }
  }

  private static async parsePdf(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text || "";
    } catch (error: any) {
      throw new Error(`Failed to parse PDF document: ${error.message || "Unknown error"}`);
    }
  }
}
