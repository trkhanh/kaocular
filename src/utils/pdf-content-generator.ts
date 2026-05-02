import { CerebrasClient } from '../agent/cerebras-client';
import { PDFGenerator, PDFGenerationOptions } from './pdf-creator';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface PDFContentGenerationOptions extends PDFGenerationOptions {
  contentType?: 'report' | 'article' | 'document' | 'analysis' | 'summary';
  length?: 'short' | 'medium' | 'long';
  style?: 'formal' | 'casual' | 'technical' | 'academic';
  includeSections?: boolean;
  includeConclusion?: boolean;
  includeReferences?: boolean;
}

export class PDFContentGenerator {
  private cerebrasClient: CerebrasClient;
  private pdfGenerator: PDFGenerator;

  constructor() {
    // Get API key from environment variables
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) {
      throw new Error('CEREBRAS_API_KEY not found in environment variables. Please add it to your .env file.');
    }

    this.cerebrasClient = new CerebrasClient(apiKey);
    this.pdfGenerator = new PDFGenerator();
  }

  async generatePDFFromPrompt(
    prompt: string,
    outputPath: string,
    options: PDFContentGenerationOptions = {}
  ): Promise<string> {
    try {
      console.log('🤖 Generating content with Cerebras AI...');
      
      // Generate content using Cerebras API
      const content = await this.generateContent(prompt, options);
      
      console.log('📄 Converting content to PDF...');
      
      // Generate PDF from the content
      const pdfPath = await this.pdfGenerator.generateFromText(
        content,
        outputPath,
        {
          title: options.title,
          author: options.author || 'AI Content Generator',
          subject: options.subject,
          keywords: options.keywords,
          format: options.format,
          landscape: options.landscape,
          printBackground: options.printBackground,
          margin: options.margin
        }
      );

      console.log('✅ PDF generated successfully!');
      return pdfPath;
    } catch (error) {
      throw new Error(`PDF content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateContent(prompt: string, options: PDFContentGenerationOptions): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(options);
    
    try {
      const content = await this.cerebrasClient.generateStructuredContent(
        prompt,
        'markdown',
        systemPrompt
      );

      return content;
    } catch (error) {
      throw new Error(`Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSystemPrompt(options: PDFContentGenerationOptions): string {
    let systemPrompt = 'You are a professional content writer. Create comprehensive, well-structured content that would be suitable for a professional document. ';

    // Content type instructions
    switch (options.contentType) {
      case 'report':
        systemPrompt += 'Structure this as a formal business report with executive summary, methodology, findings, and recommendations. ';
        break;
      case 'article':
        systemPrompt += 'Write this as an engaging article with clear introduction, main points, and conclusion. ';
        break;
      case 'document':
        systemPrompt += 'Create a professional document with clear sections and proper formatting. ';
        break;
      case 'analysis':
        systemPrompt += 'Provide a detailed analysis with data interpretation, insights, and conclusions. ';
        break;
      case 'summary':
        systemPrompt += 'Create a comprehensive summary with key points and main takeaways. ';
        break;
      default:
        systemPrompt += 'Create well-structured content with clear organization. ';
    }

    // Length instructions
    switch (options.length) {
      case 'short':
        systemPrompt += 'Keep the content concise and focused (2-3 pages). ';
        break;
      case 'medium':
        systemPrompt += 'Provide moderate detail and depth (4-6 pages). ';
        break;
      case 'long':
        systemPrompt += 'Provide comprehensive coverage with extensive detail (8+ pages). ';
        break;
    }

    // Style instructions
    switch (options.style) {
      case 'formal':
        systemPrompt += 'Use formal, professional language and tone. ';
        break;
      case 'casual':
        systemPrompt += 'Use conversational, accessible language. ';
        break;
      case 'technical':
        systemPrompt += 'Use technical terminology and detailed explanations. ';
        break;
      case 'academic':
        systemPrompt += 'Use academic writing style with proper citations and formal structure. ';
        break;
    }

    // Structure requirements
    systemPrompt += 'Use clear headings (## for main sections, ### for subsections) and proper formatting. ';
    
    if (options.includeSections !== false) {
      systemPrompt += 'Organize content into logical sections with descriptive headings. ';
    }
    
    if (options.includeConclusion !== false) {
      systemPrompt += 'Include a conclusion section that summarizes key points. ';
    }
    
    if (options.includeReferences) {
      systemPrompt += 'Include a references section if applicable. ';
    }

    systemPrompt += 'Use bullet points (-) and numbered lists (1.) where appropriate. Ensure the content is informative, well-researched, and professionally written.';

    return systemPrompt;
  }

  async generateReport(
    topic: string,
    outputPath: string,
    options: PDFContentGenerationOptions = {}
  ): Promise<string> {
    const reportPrompt = `Create a comprehensive report on: ${topic}`;
    
    return this.generatePDFFromPrompt(reportPrompt, outputPath, {
      ...options,
      contentType: 'report',
      title: options.title || `Report: ${topic}`,
      subject: options.subject || `Comprehensive analysis of ${topic}`
    });
  }

  async generateArticle(
    topic: string,
    outputPath: string,
    options: PDFContentGenerationOptions = {}
  ): Promise<string> {
    const articlePrompt = `Write an engaging article about: ${topic}`;
    
    return this.generatePDFFromPrompt(articlePrompt, outputPath, {
      ...options,
      contentType: 'article',
      title: options.title || `Article: ${topic}`,
      subject: options.subject || `Informative article about ${topic}`
    });
  }

  async generateAnalysis(
    topic: string,
    outputPath: string,
    options: PDFContentGenerationOptions = {}
  ): Promise<string> {
    const analysisPrompt = `Provide a detailed analysis of: ${topic}`;
    
    return this.generatePDFFromPrompt(analysisPrompt, outputPath, {
      ...options,
      contentType: 'analysis',
      title: options.title || `Analysis: ${topic}`,
      subject: options.subject || `In-depth analysis of ${topic}`
    });
  }

  async close(): Promise<void> {
    await this.pdfGenerator.close();
  }
}

// Example usage and CLI interface
async function main() {
  let generator: PDFContentGenerator | undefined;
  
  try {
    console.log('🚀 PDF Content Generator with Cerebras AI\n');

    generator = new PDFContentGenerator();
    const outputDir = './generated-files';
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate a single PDF document
    console.log('📊 Generating PDF document...');
    const pdfPath = await generator.generatePDFFromPrompt(
      'Create a comprehensive report about the future of artificial intelligence in healthcare, including current applications, emerging technologies, challenges, opportunities, and future predictions.',
      path.join(outputDir, 'ai_healthcare_future_report'),
      {
        contentType: 'report',
        length: 'medium',
        style: 'formal',
        title: 'AI in Healthcare: Future Outlook',
        author: 'AI Research Team',
        subject: 'Healthcare Technology Analysis',
        keywords: ['artificial intelligence', 'healthcare', 'technology', 'future'],
        includeReferences: true
      }
    );
    console.log('✅ PDF generated:', pdfPath);

    console.log('\n🎉 PDF generated successfully!');
    console.log(`📁 Check the ${outputDir} directory for your generated file.`);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    // Clean up resources
    if (generator) {
      await generator.close();
    }
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  main();
}
