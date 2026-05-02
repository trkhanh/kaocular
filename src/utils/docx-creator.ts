import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import * as fs from 'fs';
import * as path from 'path';

export interface DOCXGenerationOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  company?: string;
  category?: string;
  comments?: string;
}

export class DOCXGenerator {
  constructor() {
    // Initialize DOCX generator
  }

  async generateFromText(
    text: string,
    outputPath: string,
    options: DOCXGenerationOptions = {}
  ): Promise<string> {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Ensure .docx extension
      if (!outputPath.toLowerCase().endsWith('.docx')) {
        outputPath += '.docx';
      }

      // Convert text to DOCX document
      const doc = this.textToDOCX(text, options);

      // Generate and save DOCX
      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(outputPath, buffer);

      return outputPath;
    } catch (error) {
      throw new Error(`DOCX generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateFromHTML(
    html: string,
    outputPath: string,
    options: DOCXGenerationOptions = {}
  ): Promise<string> {
    try {
      // Convert HTML to plain text first (simplified approach)
      const text = this.htmlToText(html);
      return this.generateFromText(text, outputPath, options);
    } catch (error) {
      throw new Error(`DOCX generation from HTML failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private textToDOCX(text: string, options: DOCXGenerationOptions): Document {
    const children: (Paragraph | Table)[] = [];
    
    // If content is empty or invalid, create a default paragraph
    if (!text || typeof text !== 'string') {
      children.push(new Paragraph({
        children: [new TextRun({
          text: "Generated document content",
          size: 24
        })],
        spacing: { after: 200 }
      }));
    } else {
      // Parse content and convert to DOCX elements
      const lines = text.split('\n');
      let currentParagraph: TextRun[] = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine === '') {
          // Empty line - end current paragraph
          if (currentParagraph.length > 0) {
            children.push(new Paragraph({
              children: currentParagraph,
              spacing: { after: 200 }
            }));
            currentParagraph = [];
          }
          continue;
        }
      
        // Check for headings
        if (trimmedLine.startsWith('# ')) {
          // H1
          if (currentParagraph.length > 0) {
            children.push(new Paragraph({
              children: currentParagraph,
              spacing: { after: 200 }
            }));
            currentParagraph = [];
          }
          children.push(new Paragraph({
            text: trimmedLine.substring(2),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }));
        } else if (trimmedLine.startsWith('## ')) {
          // H2
          if (currentParagraph.length > 0) {
            children.push(new Paragraph({
              children: currentParagraph,
              spacing: { after: 200 }
            }));
            currentParagraph = [];
          }
          children.push(new Paragraph({
            text: trimmedLine.substring(3),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 }
          }));
        } else if (trimmedLine.startsWith('### ')) {
          // H3
          if (currentParagraph.length > 0) {
            children.push(new Paragraph({
              children: currentParagraph,
              spacing: { after: 200 }
            }));
            currentParagraph = [];
          }
          children.push(new Paragraph({
            text: trimmedLine.substring(4),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 200 }
          }));
        } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          // Bullet point
          if (currentParagraph.length > 0) {
            children.push(new Paragraph({
              children: currentParagraph,
              spacing: { after: 200 }
            }));
            currentParagraph = [];
          }
          children.push(new Paragraph({
            text: trimmedLine.substring(2),
            spacing: { after: 100 }
          }));
        } else if (trimmedLine.match(/^\d+\. /)) {
          // Numbered list
          if (currentParagraph.length > 0) {
            children.push(new Paragraph({
              children: currentParagraph,
              spacing: { after: 200 }
            }));
            currentParagraph = [];
          }
          children.push(new Paragraph({
            text: trimmedLine.replace(/^\d+\. /, ''),
            spacing: { after: 100 }
          }));
        } else {
          // Regular paragraph text
          currentParagraph.push(new TextRun({
            text: trimmedLine + ' ',
            size: 24 // 12pt
          }));
        }
      }
      
      // Add any remaining paragraph
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({
          children: currentParagraph,
          spacing: { after: 200 }
        }));
      }
    }

    // Ensure there's at least one paragraph
    if (children.length === 0) {
      children.push(new Paragraph({
        children: [new TextRun({
          text: "Generated document content",
          size: 24
        })],
        spacing: { after: 200 }
      }));
    }

    return new Document({
      creator: options.author || "AI Document Generator",
      title: options.title || "Generated Document",
      description: options.subject || "AI-generated document",
      subject: options.subject || "Generated Document",
      sections: [{
        properties: {},
        children: children
      }]
    });
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    let text = html;
    
    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  async generateTable(
    headers: string[],
    rows: string[][],
    outputPath: string,
    options: DOCXGenerationOptions = {}
  ): Promise<string> {
    try {
      const tableRows: TableRow[] = [];
      
      // Header row
      const headerCells = headers.map(header => 
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: header,
              bold: true,
              size: 24
            })],
            alignment: AlignmentType.CENTER
          })],
          shading: {
            fill: "E6E6E6"
          }
        })
      );
      tableRows.push(new TableRow({ children: headerCells }));
      
      // Data rows
      for (const row of rows) {
        const cells = row.map(cell => 
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: cell,
                size: 24
              })]
            })]
          })
        );
        tableRows.push(new TableRow({ children: cells }));
      }
      
      const table = new Table({
        rows: tableRows,
        width: {
          size: 100,
          type: WidthType.PERCENTAGE
        }
      });
      
      const doc = new Document({
        creator: options.author || "AI Document Generator",
        title: options.title || "Generated Table Document",
        description: options.subject || "AI-generated table document",
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: options.title || "Generated Table",
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 400 }
            }),
            table
          ]
        }]
      });
      
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate and save DOCX
      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(outputPath, buffer);
      
      return outputPath;
    } catch (error) {
      throw new Error(`DOCX table generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Example usage
async function main() {
  const generator = new DOCXGenerator();
  
  try {
    const sampleText = `# Sample Document

This is a sample document generated from plain text.

## Introduction

This DOCX generator can convert plain text into a formatted Word document with:

- Headings and subheadings
- Bullet points
- Numbered lists
- Proper formatting

## Features

1. Automatic text formatting
2. Customizable options
3. Professional styling
4. Easy to use

## Conclusion

This is a simple and effective way to generate DOCX files from text input.`;

    const outputPath = await generator.generateFromText(
      sampleText,
      './generated-files/sample-document',
      {
        title: 'Sample DOCX Document',
        author: 'DOCX Generator',
        subject: 'Demonstration Document',
        keywords: ['docx', 'generation', 'text', 'document']
      }
    );

    console.log('✅ DOCX generated successfully:', outputPath);
    
  } catch (error) {
    console.error('❌ Error generating DOCX:', error);
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  main();
}
