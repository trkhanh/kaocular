import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

export interface PDFGenerationOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  format?: 'A4' | 'Letter' | 'Legal';
  landscape?: boolean;
  printBackground?: boolean;
}

export class PDFGenerator {
  private browser: puppeteer.Browser | null = null;

  constructor() {
    // Initialize browser lazily when needed
  }

  private async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async generateFromText(
    text: string,
    outputPath: string,
    options: PDFGenerationOptions = {}
  ): Promise<string> {
    let browser: puppeteer.Browser | null = null;
    let page: puppeteer.Page | null = null;
    
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Ensure .pdf extension
      if (!outputPath.toLowerCase().endsWith('.pdf')) {
        outputPath += '.pdf';
      }

      // Convert text to HTML
      const html = this.textToHTML(text, options);

      // Generate PDF
      browser = await this.getBrowser();
      page = await browser.newPage();
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        path: outputPath,
        format: options.format || 'A4',
        landscape: options.landscape || false,
        printBackground: options.printBackground || true,
        margin: {
          top: options.margin?.top || '1cm',
          right: options.margin?.right || '1cm',
          bottom: options.margin?.bottom || '1cm',
          left: options.margin?.left || '1cm'
        }
      });

      return outputPath;
    } catch (error) {
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clean up page and browser
      if (page) {
        await page.close();
      }
      if (browser) {
        await browser.close();
        this.browser = null; // Reset the browser instance
      }
    }
  }

  async generateFromHTML(
    html: string,
    outputPath: string,
    options: PDFGenerationOptions = {}
  ): Promise<string> {
    let browser: puppeteer.Browser | null = null;
    let page: puppeteer.Page | null = null;
    
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Ensure .pdf extension
      if (!outputPath.toLowerCase().endsWith('.pdf')) {
        outputPath += '.pdf';
      }

      // Generate PDF
      browser = await this.getBrowser();
      page = await browser.newPage();
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        path: outputPath,
        format: options.format || 'A4',
        landscape: options.landscape || false,
        printBackground: options.printBackground || true,
        margin: {
          top: options.margin?.top || '1cm',
          right: options.margin?.right || '1cm',
          bottom: options.margin?.bottom || '1cm',
          left: options.margin?.left || '1cm'
        }
      });

      return outputPath;
    } catch (error) {
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clean up page and browser
      if (page) {
        await page.close();
      }
      if (browser) {
        await browser.close();
        this.browser = null; // Reset the browser instance
      }
    }
  }

  private textToHTML(text: string, options: PDFGenerationOptions): string {
    // Convert plain text to HTML with basic formatting
    const lines = text.split('\n');
    let html = '';

    // Add document metadata
    html += `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${options.title || 'Generated Document'}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-top: 30px;
        }
        h2 {
            color: #34495e;
            margin-top: 25px;
        }
        h3 {
            color: #7f8c8d;
            margin-top: 20px;
        }
        p {
            margin-bottom: 15px;
            text-align: justify;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #bdc3c7;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 14px;
            color: #7f8c8d;
        }
        ul, ol {
            margin-bottom: 15px;
            padding-left: 30px;
        }
        li {
            margin-bottom: 5px;
        }
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>`;

    // Add header if title is provided
    if (options.title) {
      html += `
    <div class="header">
        <div class="title">${options.title}</div>`;
      
      if (options.author) {
        html += `<div class="subtitle">Author: ${options.author}</div>`;
      }
      
      if (options.subject) {
        html += `<div class="subtitle">Subject: ${options.subject}</div>`;
      }
      
      html += `</div>`;
    }

    // Process text lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '') {
        html += '<br>';
        continue;
      }

      // Check for headings
      if (line.startsWith('# ')) {
        html += `<h1>${line.substring(2)}</h1>`;
      } else if (line.startsWith('## ')) {
        html += `<h2>${line.substring(3)}</h2>`;
      } else if (line.startsWith('### ')) {
        html += `<h3>${line.substring(4)}</h3>`;
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Start unordered list
        html += '<ul>';
        html += `<li>${line.substring(2)}</li>`;
        
        // Continue with list items
        while (i + 1 < lines.length && (lines[i + 1].startsWith('- ') || lines[i + 1].startsWith('* '))) {
          i++;
          html += `<li>${lines[i].substring(2)}</li>`;
        }
        html += '</ul>';
      } else if (line.match(/^\d+\. /)) {
        // Start ordered list
        html += '<ol>';
        html += `<li>${line.replace(/^\d+\. /, '')}</li>`;
        
        // Continue with list items
        while (i + 1 < lines.length && lines[i + 1].match(/^\d+\. /)) {
          i++;
          html += `<li>${lines[i + 1].replace(/^\d+\. /, '')}</li>`;
        }
        html += '</ol>';
      } else {
        // Regular paragraph
        html += `<p>${line}</p>`;
      }
    }

    html += `
</body>
</html>`;

    return html;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Example usage
async function main() {
  const generator = new PDFGenerator();
  
  try {
    const sampleText = `# Sample Document

This is a sample document generated from plain text.

## Introduction

This PDF generator can convert plain text into a formatted PDF document with:

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

This is a simple and effective way to generate PDFs from text input.`;

    const outputPath = await generator.generateFromText(
      sampleText,
      './generated-files/sample-document',
      {
        title: 'Sample PDF Document',
        author: 'PDF Generator',
        subject: 'Demonstration Document',
        keywords: ['pdf', 'generation', 'text', 'document']
      }
    );

    console.log('✅ PDF generated successfully:', outputPath);
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
  } finally {
    await generator.close();
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  main();
}
