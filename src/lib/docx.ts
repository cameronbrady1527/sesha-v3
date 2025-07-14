// lib/docx.ts
import { Document, Packer, Paragraph, TextRun, BorderStyle, HeadingLevel } from "docx";

/**
 * Generate a DocX document from Lexical rich content.
 * This function converts the Lexical JSON structure into a DocX document.
 */
export async function generateDocx({ headline, richContent, slug, version, createdByName }: {
  headline: string;
  richContent: string;
  slug: string;
  version: string;
  createdByName: string;
}): Promise<Uint8Array> {
  const parsed = JSON.parse(richContent);

  // 1. Build metadata header
  const now = new Date();
  const metadataText = `Slug: ${slug}  Version: ${version}  Export by: ${createdByName} on : ${now.toLocaleString()}`;
  const metaParagraph = new Paragraph({
    children: [ new TextRun({ text: metadataText, italics: true }) ],
    spacing: { after: 200 }
  });

  // 2. Horizontal rule with spacing
  const hrParagraph = new Paragraph({
    border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "auto" }
    },
    spacing: { before: 100, after: 100 }
  });

  // 3. Title with extra space below
  const titleParagraph = new Paragraph({
    text: headline,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 200, after: 300 }
  });

  function traverse(node: any): Paragraph[] {
    if (node.type === "root") {
      return node.children.flatMap(traverse);
    }
    if (node.type === "heading") {
      const text = node.children.map((c: any) => c.text).join("");
      return [
        new Paragraph({ text, heading: HeadingLevel.HEADING_2 }),
      ];
    }
    if (node.type === "paragraph") {
      const runs = node.children.map((child: any) =>
        new TextRun({
          text: child.text || "",
          bold: !!(child.format & 1),
          italics: !!(child.format & 2),
          underline: (child.format & 4) ? { type: "single" } : undefined,
        })
      );
      return [new Paragraph({ children: runs })];
    }
    return [];
  }

  const bodyParagraphs = traverse({ type: "root", children: parsed.root.children });
  const doc = new Document({
    sections: [{
        properties: {},
        children: [
          metaParagraph,
          hrParagraph,
          titleParagraph,
          ...bodyParagraphs
        ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}