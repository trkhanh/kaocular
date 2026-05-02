import { CerebrasClient } from '../agent/cerebras-client';
import { CSVCreator, CSVGenerationOptions, CSVData } from './csv-creator';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface CSVContentGenerationOptions extends CSVGenerationOptions {
  contentType?: 'data' | 'report' | 'analysis' | 'list' | 'table';
  dataType?: 'structured' | 'tabular' | 'key-value' | 'list';
  includeHeaders?: boolean;
  maxRows?: number;
  includeMetadata?: boolean;
}

export class CSVContentGenerator {
  private cerebrasClient: CerebrasClient;
  private csvCreator: CSVCreator;

  constructor() {
    // Get API key from environment variables
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) {
      throw new Error('CEREBRAS_API_KEY not found in environment variables. Please add it to your .env file.');
    }

    this.cerebrasClient = new CerebrasClient(apiKey);
    this.csvCreator = new CSVCreator();
  }

  async generateCSVFromPrompt(
    prompt: string,
    outputPath: string,
    options: CSVContentGenerationOptions = {}
  ): Promise<string> {
    try {
      console.log('🤖 Generating content with Cerebras AI...');
      
      // Generate content using Cerebras API
      const content = await this.generateContent(prompt, options);
      
      console.log('📊 Converting content to CSV...');
      
      // Generate CSV from the content
      const csvPath = await this.csvCreator.generateFromText(
        content,
        outputPath,
        {
          headers: options.headers,
          delimiter: options.delimiter,
          encoding: options.encoding,
          append: options.append
        }
      );

      console.log('✅ CSV generated successfully!');
      return csvPath;
    } catch (error) {
      throw new Error(`CSV content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateStructuredDataCSV(
    prompt: string,
    outputPath: string,
    options: CSVContentGenerationOptions = {}
  ): Promise<string> {
    try {
      console.log('🤖 Generating structured data with Cerebras AI...');
      
      // Generate structured data using Cerebras API
      const data = await this.generateStructuredData(prompt, options);
      
      console.log('📊 Converting data to CSV...');
      
      // Generate CSV from the structured data
      const csvPath = await this.csvCreator.generateFromData(
        data,
        outputPath,
        {
          headers: options.headers,
          delimiter: options.delimiter,
          encoding: options.encoding,
          append: options.append
        }
      );

      console.log('✅ CSV generated successfully!');
      return csvPath;
    } catch (error) {
      throw new Error(`Structured CSV generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateContent(prompt: string, options: CSVContentGenerationOptions): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(options);
    
    try {
      const content = await this.cerebrasClient.generateStructuredContent(
        prompt,
        'text',
        systemPrompt
      );

      return content;
    } catch (error) {
      throw new Error(`Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateStructuredData(prompt: string, options: CSVContentGenerationOptions): Promise<CSVData[]> {
    const systemPrompt = this.buildStructuredDataPrompt(options);
    
    try {
      const content = await this.cerebrasClient.generateStructuredContent(
        prompt,
        'json',
        systemPrompt
      );

      // Parse the JSON content
      const parsedData = JSON.parse(content);
      
      // Ensure it's an array
      if (Array.isArray(parsedData)) {
        return parsedData;
      } else if (typeof parsedData === 'object' && parsedData !== null) {
        // If it's a single object, wrap it in an array
        return [parsedData];
      } else {
        throw new Error('Generated content is not in the expected format');
      }
    } catch (error) {
      throw new Error(`Structured data generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSystemPrompt(options: CSVContentGenerationOptions): string {
    let systemPrompt = 'You are a data analyst and CSV content generator. Create well-structured, tabular content that can be easily converted to CSV format. ';

    // Content type instructions
    switch (options.contentType) {
      case 'data':
        systemPrompt += 'Structure this as organized data with clear rows and columns. ';
        break;
      case 'report':
        systemPrompt += 'Create a data report with structured information in tabular format. ';
        break;
      case 'analysis':
        systemPrompt += 'Provide analytical data with metrics, values, and insights in structured format. ';
        break;
      case 'list':
        systemPrompt += 'Create a structured list with consistent columns and clear categorization. ';
        break;
      case 'table':
        systemPrompt += 'Format this as a table with headers and organized rows of data. ';
        break;
      default:
        systemPrompt += 'Create structured, tabular content with clear organization. ';
    }

    // Data type instructions
    switch (options.dataType) {
      case 'structured':
        systemPrompt += 'Use a consistent structure with clear column headers and organized rows. ';
        break;
      case 'tabular':
        systemPrompt += 'Format as a table with headers and aligned data columns. ';
        break;
      case 'key-value':
        systemPrompt += 'Use key-value pairs in a structured format. ';
        break;
      case 'list':
        systemPrompt += 'Create a structured list with consistent formatting. ';
        break;
    }

    // Format requirements
    systemPrompt += 'Use clear column separators (| or tabs) and ensure consistent formatting. ';
    
    if (options.includeHeaders !== false) {
      systemPrompt += 'Include clear column headers. ';
    }
    
    if (options.maxRows) {
      systemPrompt += `Limit the output to approximately ${options.maxRows} rows of data. `;
    }
    
    if (options.includeMetadata) {
      systemPrompt += 'Include metadata columns like ID, timestamp, or source information where relevant. ';
    }

    systemPrompt += 'Ensure the data is clean, consistent, and ready for CSV conversion. Use pipe separators (|) between columns for easy parsing.';

    return systemPrompt;
  }

  private buildStructuredDataPrompt(options: CSVContentGenerationOptions): string {
    let systemPrompt = 'You are a data generator that creates structured JSON data suitable for CSV conversion. Generate an array of objects where each object represents a row of data. ';

    // Content type instructions
    switch (options.contentType) {
      case 'data':
        systemPrompt += 'Create structured data objects with consistent properties. ';
        break;
      case 'report':
        systemPrompt += 'Generate report data with metrics, values, and analytical information. ';
        break;
      case 'analysis':
        systemPrompt += 'Create analytical data with insights, measurements, and findings. ';
        break;
      case 'list':
        systemPrompt += 'Generate list data with categorized items and properties. ';
        break;
      case 'table':
        systemPrompt += 'Create tabular data with consistent column structure. ';
        break;
    }

    // Data requirements
    systemPrompt += 'Each object should have the same properties (keys) to ensure consistent CSV structure. ';
    
    if (options.maxRows) {
      systemPrompt += `Generate approximately ${options.maxRows} data objects. `;
    }
    
    if (options.includeMetadata) {
      systemPrompt += 'Include metadata fields like id, timestamp, or source in each object. ';
    }

    systemPrompt += 'Return only valid JSON array format. Ensure all values are strings, numbers, or booleans (no nested objects or arrays).';

    return systemPrompt;
  }

  async generateDataReport(
    topic: string,
    outputPath: string,
    options: CSVContentGenerationOptions = {}
  ): Promise<string> {
    const reportPrompt = `Create a comprehensive data report on: ${topic}. Include relevant metrics, statistics, and structured information.`;
    
    return this.generateStructuredDataCSV(reportPrompt, outputPath, {
      ...options,
      contentType: 'report',
      dataType: 'structured',
      includeMetadata: true
    });
  }

  async generateAnalysisData(
    topic: string,
    outputPath: string,
    options: CSVContentGenerationOptions = {}
  ): Promise<string> {
    const analysisPrompt = `Provide analytical data and insights about: ${topic}. Include measurements, trends, and key findings.`;
    
    return this.generateStructuredDataCSV(analysisPrompt, outputPath, {
      ...options,
      contentType: 'analysis',
      dataType: 'tabular',
      includeMetadata: true
    });
  }

  async generateListData(
    topic: string,
    outputPath: string,
    options: CSVContentGenerationOptions = {}
  ): Promise<string> {
    const listPrompt = `Create a structured list of items related to: ${topic}. Include relevant details and categorization.`;
    
    return this.generateStructuredDataCSV(listPrompt, outputPath, {
      ...options,
      contentType: 'list',
      dataType: 'structured',
      maxRows: options.maxRows || 20
    });
  }

  async close(): Promise<void> {
    // CSV generator doesn't need cleanup like PDF generator
    // but we keep this method for consistency
  }
}

// Example usage and CLI interface
async function main() {
  let generator: CSVContentGenerator | undefined;
  
  try {
    console.log('🚀 CSV Content Generator with Cerebras AI\n');

    generator = new CSVContentGenerator();
    const outputDir = './generated-files';
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate a single CSV document
    console.log('📊 Generating CSV document...');
    const csvPath = await generator.generateStructuredDataCSV(
      'Create a dataset of the top 15 artificial intelligence companies, including their company name, founded year, headquarters location, primary focus area, estimated valuation, and key products or services. Insert dummy data for each column.',
      path.join(outputDir, 'ai_companies_dataset'),
      {
        contentType: 'data',
        dataType: 'structured',
        includeMetadata: true,
        maxRows: 15,
        headers: ['Company Name', 'Founded Year', 'Headquarters', 'Focus Area', 'Valuation', 'Key Products']
      }
    );
    console.log('✅ CSV generated:', csvPath);

    console.log('\n🎉 CSV generated successfully!');
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
