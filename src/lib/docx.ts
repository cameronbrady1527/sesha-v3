// lib/docx.ts
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
  HeadingLevel,
  ShadingType,
} from "docx";

export interface ExportOptions {
  headline: string;
  richContent: string;
  slug: string;
  version: string;
  author: string;
}

export async function generateDocx({
  headline,
  richContent,
  slug,
  version,
  author,
}: ExportOptions): Promise<Uint8Array> {
  // 1) Parse the Lexical JSON
  const parsed = JSON.parse(richContent);

  // 2) Convert a text node into a TextRun
  function runsForText(node: any): TextRun {
    const opts: any = { text: node.text || "" };

    // Inline formatting
    if (node.format & 1) opts.bold = true;
    if (node.format & 2) opts.italics = true;
    if (node.format & 4) opts.underline = true;
    if (node.format & 8) opts.strike = true;

    // Code span (bit 16)
    if (node.format & 16) {
      opts.font = "Courier New";
      opts.shading = { type: ShadingType.CLEAR, fill: "F3F4F6" };
    }

    // Color/background from inline style
    const style: string = node.style || "";
    const colorMatch = /color:\s*#([0-9A-Fa-f]{6})/.exec(style);
    if (colorMatch) opts.color = colorMatch[1];
    const bgMatch = /background-color:\s*#([0-9A-Fa-f]{6})/.exec(style);
    if (bgMatch) opts.shading = { type: ShadingType.CLEAR, fill: bgMatch[1] };

    return new TextRun(opts);
  }

  // 3) Build paragraphs recursively
  function buildParagraphs(nodes: any[]): Paragraph[] {
    const paras: Paragraph[] = [];

    for (const node of nodes) {
      switch (node.type) {
        case "heading": {
          const tag = node.tag || "h2";
          const levelMap: Record<string, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
            h1: HeadingLevel.HEADING_1,
            h2: HeadingLevel.HEADING_2,
            h3: HeadingLevel.HEADING_3,
          };
          const headingLevel = levelMap[tag] || HeadingLevel.HEADING_2;
          const runs = (node.children || []).map(runsForText);
          paras.push(new Paragraph({ children: runs, heading: headingLevel }));
          break;
        }
        case "paragraph": {
          const runs = (node.children || []).map(runsForText);
          paras.push(new Paragraph({ children: runs }));
          break;
        }
        case "quote": {
          const runs = (node.children || []).map(runsForText);
          paras.push(
            new Paragraph({
              children: runs,
              border: {
                left: { style: BorderStyle.SINGLE, size: 2, color: "BFBFBF" },
              },
              indent: { left: 200 },
            })
          );
          break;
        }
        case "list": {
          const items = node.children || [];
          if (node.listType === "check") {
            for (const item of items) {
              const runs = (item.children || []).map(runsForText);
              const checkbox = item.checked ? "☑ " : "☐ ";
              paras.push(
                new Paragraph({
                  children: [new TextRun({ text: checkbox }), ...runs],
                })
              );
            }
          } else if (node.listType === "number") {
            for (const item of items) {
              const runs = (item.children || []).map(runsForText);
              const prefix = `${item.value ?? 1}. `;
              paras.push(
                new Paragraph({
                  children: [new TextRun({ text: prefix }), ...runs],
                })
              );
            }
          } else {
            for (const item of items) {
              const runs = (item.children || []).map(runsForText);
              paras.push(new Paragraph({ children: runs, bullet: { level: 0 } }));
            }
          }
          break;
        }
      }
    }

    return paras;
  }

  // 4) Metadata header, horizontal rule, title, and body
  const now = new Date().toLocaleString();
  const metaText = `Slug: ${slug}  Version: ${version}  Export by: ${author} on ${now}`;
  const metaParagraph = new Paragraph({
    children: [new TextRun({ text: metaText, italics: true })],
    spacing: { after: 200 },
  });

  const hrParagraph = new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "auto" } },
    spacing: { before: 100, after: 100 },
  });

  const titleParagraph = new Paragraph({
    text: headline,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 200, after: 300 },
  });

  const bodyParagraphs = buildParagraphs(parsed.root.children || []);

  // 5) Assemble and pack
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [metaParagraph, hrParagraph, titleParagraph, ...bodyParagraphs],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}
