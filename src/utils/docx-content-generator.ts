import { CerebrasClient } from '../agent/cerebras-client';
import { DOCXGenerator, DOCXGenerationOptions } from './docx-creator';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface DOCXContentGenerationOptions extends DOCXGenerationOptions {
  contentType?: 'report' | 'article' | 'document' | 'analysis' | 'summary' | 'proposal' | 'manual';
  length?: 'short' | 'medium' | 'long';
  style?: 'formal' | 'casual' | 'technical' | 'academic' | 'business';
  includeSections?: boolean;
  includeConclusion?: boolean;
  includeReferences?: boolean;
  includeTableOfContents?: boolean;
}

export class DOCXContentGenerator {
  private cerebrasClient: CerebrasClient;
  private docxGenerator: DOCXGenerator;

  constructor() {
    // Get API key from environment variables
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) {
      throw new Error('CEREBRAS_API_KEY not found in environment variables. Please add it to your .env file.');
    }

    this.cerebrasClient = new CerebrasClient(apiKey);
    this.docxGenerator = new DOCXGenerator();
  }

  async generateDOCXFromPrompt(
    prompt: string,
    outputPath: string,
    options: DOCXContentGenerationOptions = {}
  ): Promise<string> {
    try {
      console.log('🤖 Generating content with Cerebras AI...');
      
      // Generate content using Cerebras API
      const content = await this.generateContent(prompt, options);
      
      console.log('📄 Converting content to DOCX...');
      
      // Generate DOCX from the content
      const docxPath = await this.docxGenerator.generateFromText(
        content,
        outputPath,
        {
          title: options.title,
          author: options.author || 'AI Content Generator',
          subject: options.subject,
          keywords: options.keywords,
          company: options.company,
          category: options.category,
          comments: options.comments
        }
      );

      console.log('✅ DOCX generated successfully!');
      return docxPath;
    } catch (error) {
      throw new Error(`DOCX content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateContent(prompt: string, options: DOCXContentGenerationOptions): Promise<string> {
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

  private buildSystemPrompt(options: DOCXContentGenerationOptions): string {
    let systemPrompt = 'You are a professional content writer. Create comprehensive, well-structured content that would be suitable for a professional Word document. ';

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
      case 'proposal':
        systemPrompt += 'Structure this as a business proposal with problem statement, solution, benefits, and implementation plan. ';
        break;
      case 'manual':
        systemPrompt += 'Create a step-by-step manual with clear instructions and procedures. ';
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
      case 'business':
        systemPrompt += 'Use business writing style with clear, actionable language. ';
        break;
    }

    // Structure requirements
    systemPrompt += 'Use clear headings (## for main sections, ### for subsections) and proper formatting. ';
    
    if (options.includeTableOfContents) {
      systemPrompt += 'Include a table of contents at the beginning. ';
    }
    
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
    options: DOCXContentGenerationOptions = {}
  ): Promise<string> {
    const reportPrompt = `Create a comprehensive report on: ${topic}`;
    
    return this.generateDOCXFromPrompt(reportPrompt, outputPath, {
      ...options,
      contentType: 'report',
      title: options.title || `Report: ${topic}`,
      subject: options.subject || `Comprehensive analysis of ${topic}`
    });
  }

  async generateArticle(
    topic: string,
    outputPath: string,
    options: DOCXContentGenerationOptions = {}
  ): Promise<string> {
    const articlePrompt = `Write an engaging article about: ${topic}`;
    
    return this.generateDOCXFromPrompt(articlePrompt, outputPath, {
      ...options,
      contentType: 'article',
      title: options.title || `Article: ${topic}`,
      subject: options.subject || `Informative article about ${topic}`
    });
  }

  async generateAnalysis(
    topic: string,
    outputPath: string,
    options: DOCXContentGenerationOptions = {}
  ): Promise<string> {
    const analysisPrompt = `Provide a detailed analysis of: ${topic}`;
    
    return this.generateDOCXFromPrompt(analysisPrompt, outputPath, {
      ...options,
      contentType: 'analysis',
      title: options.title || `Analysis: ${topic}`,
      subject: options.subject || `In-depth analysis of ${topic}`
    });
  }

  async generateProposal(
    topic: string,
    outputPath: string,
    options: DOCXContentGenerationOptions = {}
  ): Promise<string> {
    const proposalPrompt = `Create a business proposal for: ${topic}`;
    
    return this.generateDOCXFromPrompt(proposalPrompt, outputPath, {
      ...options,
      contentType: 'proposal',
      title: options.title || `Proposal: ${topic}`,
      subject: options.subject || `Business proposal for ${topic}`
    });
  }

  async generateManual(
    topic: string,
    outputPath: string,
    options: DOCXContentGenerationOptions = {}
  ): Promise<string> {
    const manualPrompt = `Create a step-by-step manual for: ${topic}`;
    
    return this.generateDOCXFromPrompt(manualPrompt, outputPath, {
      ...options,
      contentType: 'manual',
      title: options.title || `Manual: ${topic}`,
      subject: options.subject || `Instruction manual for ${topic}`
    });
  }

  async generateTable(
    headers: string[],
    rows: string[][],
    outputPath: string,
    options: DOCXContentGenerationOptions = {}
  ): Promise<string> {
    try {
      console.log('📊 Generating DOCX table...');
      
      const docxPath = await this.docxGenerator.generateTable(
        headers,
        rows,
        outputPath,
        {
          title: options.title || 'Generated Table',
          author: options.author || 'AI Table Generator',
          subject: options.subject || 'Data table document'
        }
      );

      console.log('✅ DOCX table generated successfully!');
      return docxPath;
    } catch (error) {
      throw new Error(`DOCX table generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async close(): Promise<void> {
    // DOCX generator doesn't need cleanup like PDF generator
    // but we keep this method for consistency
  }
}

// Example usage and CLI interface
async function main() {
  let generator: DOCXContentGenerator | undefined;
  
  try {
    console.log('🚀 DOCX Content Generator with Cerebras AI\n');

    generator = new DOCXContentGenerator();
    const outputDir = './generated-files';
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate a single DOCX document
    console.log('📊 Generating DOCX document...');
    const docxPath = await generator.generateDOCXFromPrompt(
      'Create a comprehensive business report about digital transformation in healthcare, including current trends, implementation challenges, benefits, case studies, and future outlook.',
      path.join(outputDir, 'healthcare_digital_transformation_report'),
      {
        contentType: 'report',
        length: 'medium',
        style: 'business',
        title: 'Digital Transformation in Healthcare',
        author: 'Healthcare Research Team',
        subject: 'Healthcare Technology Analysis',
        keywords: ['digital transformation', 'healthcare', 'technology', 'innovation'],
        includeTableOfContents: true,
        includeReferences: true
      }
    );
    console.log('✅ DOCX generated:', docxPath);

    console.log('\n🎉 DOCX generated successfully!');
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
