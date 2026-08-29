import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Helper to parse simple markdown elements safely into rich React elements
  const renderFormattedText = (rawText: string) => {
    // Split text by lines to parse blocks, tables, lists, and headings
    const lines = rawText.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Markdown Table detection (| Col 1 | Col 2 |)
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerRow = tableLines[0]
            .split("|")
            .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
            .map((c) => c.trim());

          // Skip separator line if present (e.g. |:---|:---|)
          const dataRows = tableLines.slice(tableLines[1].includes("---") ? 2 : 1).map((r) =>
            r
              .split("|")
              .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
              .map((c) => c.trim())
          );

          elements.push(
            <div key={`table-${i}`} style={{ overflowX: "auto", margin: "14px 0" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  fontSize: "0.88rem",
                  background: "#ffffff",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  border: "1.5px solid var(--border-subtle)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <thead>
                  <tr style={{ background: "linear-gradient(135deg, #eef2ff, #f5f3ff)" }}>
                    {headerRow.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontWeight: 700,
                          color: "var(--primary)",
                          borderBottom: "1.5px solid var(--border-subtle)",
                          borderRight: hIdx < headerRow.length - 1 ? "1px solid var(--border-subtle)" : "none",
                        }}
                      >
                        {formatInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      style={{
                        background: rIdx % 2 === 0 ? "#ffffff" : "#f8fafc",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          style={{
                            padding: "10px 14px",
                            borderBottom: rIdx < dataRows.length - 1 ? "1px solid var(--border-subtle)" : "none",
                            borderRight: cIdx < row.length - 1 ? "1px solid var(--border-subtle)" : "none",
                            color: "var(--text-primary)",
                          }}
                        >
                          {formatInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 2. Code Block detection (``` ... ```)
      if (line.trim().startsWith("```")) {
        const codeLines: string[] = [];
        i++; // skip opening fence
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing fence

        elements.push(
          <div
            key={`code-${i}`}
            style={{
              margin: "12px 0",
              background: "#0f172a",
              color: "#e2e8f0",
              padding: "14px 18px",
              borderRadius: "var(--radius-md)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.85rem",
              lineHeight: 1.6,
              overflowX: "auto",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
            }}
          >
            <pre style={{ margin: 0, whiteSpace: "pre" }}>{codeLines.join("\n")}</pre>
          </div>
        );
        continue;
      }

      // 3. Active Learning Check Callout Box
      if (line.includes("Active Learning Check") || line.includes("Quick Knowledge Check") || line.includes("Quick Check-In")) {
        const calloutLines: string[] = [line];
        i++;
        while (i < lines.length && lines[i].trim() !== "---" && lines[i].trim() !== "") {
          calloutLines.push(lines[i]);
          i++;
        }

        elements.push(
          <div
            key={`callout-${i}`}
            style={{
              margin: "16px 0",
              padding: "16px 20px",
              borderRadius: "var(--radius-lg)",
              background: "linear-gradient(135deg, #eef2ff 0%, #f0fdf4 100%)",
              border: "1.5px solid rgba(99, 102, 241, 0.3)",
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span className="badge badge-primary" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                🎯 Active Recall Concept Check
              </span>
            </div>
            <div style={{ color: "var(--text-primary)", fontSize: "0.92rem", lineHeight: 1.6 }}>
              {calloutLines.slice(1).map((l, lIdx) => (
                <p key={lIdx} style={{ margin: "4px 0" }}>
                  {formatInline(l)}
                </p>
              ))}
            </div>
          </div>
        );
        continue;
      }

      // 4. Headings (#, ##, ###)
      if (line.startsWith("### ")) {
        elements.push(
          <h4
            key={`h3-${i}`}
            style={{
              fontSize: "1.08rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: "18px 0 8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {formatInline(line.replace(/^###\s+/, ""))}
          </h4>
        );
        i++;
        continue;
      }

      if (line.startsWith("## ")) {
        elements.push(
          <h3
            key={`h2-${i}`}
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "var(--primary)",
              margin: "20px 0 10px",
              paddingBottom: "4px",
              borderBottom: "1.5px solid var(--primary-light)",
            }}
          >
            {formatInline(line.replace(/^##\s+/, ""))}
          </h3>
        );
        i++;
        continue;
      }

      // 5. Horizontal Divider (---)
      if (line.trim() === "---") {
        elements.push(
          <hr
            key={`hr-${i}`}
            style={{
              border: "none",
              borderTop: "1.5px solid rgba(226, 232, 240, 0.8)",
              margin: "16px 0",
            }}
          />
        );
        i++;
        continue;
      }

      // 6. Bullet Lists (* or -)
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const listItems: string[] = [];
        while (i < lines.length && (lines[i].trim().startsWith("* ") || lines[i].trim().startsWith("- "))) {
          listItems.push(lines[i].trim().replace(/^[\*\-]\s+/, ""));
          i++;
        }

        elements.push(
          <ul key={`ul-${i}`} style={{ margin: "10px 0 10px 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {listItems.map((item, idx) => (
              <li key={idx} style={{ color: "var(--text-primary)", fontSize: "0.925rem", lineHeight: 1.6 }}>
                {formatInline(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // 7. Regular Paragraph
      if (line.trim().length > 0) {
        elements.push(
          <p key={`p-${i}`} style={{ margin: "8px 0", lineHeight: 1.65, fontSize: "0.925rem", color: "var(--text-primary)" }}>
            {formatInline(line)}
          </p>
        );
      }

      i++;
    }

    return elements;
  };

  // Inline formatting helper for bold (**text**), italics (*text*), code (`text`), etc.
  const formatInline = (text: string): React.ReactNode => {
    if (!text) return "";

    // Parse bold (**text**) and code (`text`)
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={idx} style={{ fontWeight: 750, color: "var(--text-primary)" }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code
            key={idx}
            style={{
              background: "var(--bg-subtle)",
              color: "var(--primary)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "0.85em",
              fontWeight: 600,
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        return <em key={idx}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return <div className="markdown-content">{renderFormattedText(content)}</div>;
};
