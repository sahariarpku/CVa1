import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

export const generateDocx = async (content: string, filename: string) => {
    const lines = content.split('\n');
    const children: (Paragraph)[] = [];

    lines.forEach(line => {
        const trimmed = line.trim();

        // Identify Headers
        if (trimmed.startsWith('### ')) {
            children.push(new Paragraph({
                text: trimmed.replace('### ', ''),
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 },
            }));
        } else if (trimmed.startsWith('## ')) {
            children.push(new Paragraph({
                text: trimmed.replace('## ', ''),
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 150 },
            }));
        } else if (trimmed.startsWith('# ')) {
            children.push(new Paragraph({
                text: trimmed.replace('# ', ''),
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 200 },
            }));
        }
        // Bold specific lines like "Dear Hiring Committee," or "Subject:"
        else if (trimmed.startsWith('Subject:') || trimmed.startsWith('Dear') || trimmed.startsWith('Sincerely') || trimmed.startsWith('Best regards')) {
            children.push(new Paragraph({
                children: [new TextRun({ text: trimmed, bold: true })],
                spacing: { before: 100, after: 100 },
            }));
        }
        // Bullet points (basic)
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            children.push(new Paragraph({
                text: trimmed.replace(/^[-*] /, ''),
                bullet: { level: 0 }
            }));
        }
        // Standard text
        else if (trimmed.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun(trimmed)],
                spacing: { after: 100 },
            }));
        }
        // Empty lines
        else {
            children.push(new Paragraph({ text: "" }));
        }
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: children,
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
};
