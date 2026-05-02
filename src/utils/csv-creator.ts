import * as fs from 'fs';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';

export interface CSVGenerationOptions {
  headers?: string[];
  delimiter?: string;
  encoding?: string;
  append?: boolean;
}

export interface CSVData {
  [key: string]: any;
}

export class CSVCreator {
  constructor() {}

  /**
   * Creates a CSV file from an array of objects
   * @param data - Array of objects to convert to CSV
   * @param outputPath - Path where the CSV file should be saved
   * @param options - Optional configuration for CSV generation
   * @returns Promise<string> - Path to the generated CSV file
   */
  async generateFromData(
    data: CSVData[],
    outputPath: string,
    options: CSVGenerationOptions = {}
  ): Promise<string> {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Ensure .csv extension
      if (!outputPath.toLowerCase().endsWith('.csv')) {
        outputPath += '.csv';
      }

      // Extract headers from data if not provided
      const headers = options.headers || this.extractHeaders(data);

      // Create CSV writer
      const csvWriter = createObjectCsvWriter({
        path: outputPath,
        header: headers.map(header => ({ id: header, title: header })),
        encoding: options.encoding || 'utf8',
        append: options.append || false
      });

      // Write data to CSV
      await csvWriter.writeRecords(data);

      return outputPath;
    } catch (error) {
      throw new Error(`CSV generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates a CSV file from structured text content
   * @param content - Structured text content to parse and convert to CSV
   * @param outputPath - Path where the CSV file should be saved
   * @param options - Optional configuration for CSV generation
   * @returns Promise<string> - Path to the generated CSV file
   */
  async generateFromText(
    content: string,
    outputPath: string,
    options: CSVGenerationOptions = {}
  ): Promise<string> {
    try {
      // Parse the structured content into CSV data
      const data = this.parseStructuredContent(content);
      
      // Generate CSV from the parsed data
      return this.generateFromData(data, outputPath, options);
    } catch (error) {
      throw new Error(`CSV generation from text failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates a CSV file from a table-like structure
   * @param tableData - Table data with rows and columns
   * @param outputPath - Path where the CSV file should be saved
   * @param options - Optional configuration for CSV generation
   * @returns Promise<string> - Path to the generated CSV file
   */
  async generateFromTable(
    tableData: { headers: string[], rows: any[][] },
    outputPath: string,
    options: CSVGenerationOptions = {}
  ): Promise<string> {
    try {
      // Convert table data to object array
      const data = tableData.rows.map(row => {
        const obj: CSVData = {};
        tableData.headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      // Generate CSV with specified headers
      return this.generateFromData(data, outputPath, {
        ...options,
        headers: tableData.headers
      });
    } catch (error) {
      throw new Error(`CSV generation from table failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extracts headers from an array of objects
   * @param data - Array of objects
   * @returns Array of header strings
   */
  private extractHeaders(data: CSVData[]): string[] {
    if (data.length === 0) {
      return [];
    }

    const allKeys = new Set<string>();
    data.forEach(obj => {
      Object.keys(obj).forEach(key => allKeys.add(key));
    });

    return Array.from(allKeys);
  }

  /**
   * Parses structured text content into CSV data
   * @param content - Structured text content
   * @returns Array of objects suitable for CSV generation
   */
  private parseStructuredContent(content: string): CSVData[] {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const data: CSVData[] = [];

    // Try to detect the format and parse accordingly
    if (this.isTableFormat(lines)) {
      return this.parseTableFormat(lines);
    } else if (this.isListFormat(lines)) {
      return this.parseListFormat(lines);
    } else {
      // Default: treat as simple data entries
      return this.parseSimpleFormat(lines);
    }
  }

  /**
   * Checks if content is in table format
   * @param lines - Array of text lines
   * @returns boolean indicating if content is table format
   */
  private isTableFormat(lines: string[]): boolean {
    // Look for patterns like "| Header1 | Header2 |" or tab-separated values
    return lines.some(line => 
      line.includes('|') || 
      line.split('\t').length > 2 ||
      line.match(/^\s*\w+\s+\w+\s+\w+/)
    );
  }

  /**
   * Checks if content is in list format
   * @param lines - Array of text lines
   * @returns boolean indicating if content is list format
   */
  private isListFormat(lines: string[]): boolean {
    // Look for patterns like "Key: Value" or "Name - Description"
    return lines.some(line => 
      line.includes(':') || 
      line.includes(' - ') ||
      line.match(/^\s*\w+\s*[:=]\s*/)
    );
  }

  /**
   * Parses table format content
   * @param lines - Array of text lines
   * @returns Array of objects
   */
  private parseTableFormat(lines: string[]): CSVData[] {
    const data: CSVData[] = [];
    let headers: string[] = [];
    let inDataSection = false;

    for (const line of lines) {
      if (line.includes('|')) {
        // Markdown table format
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
        
        if (!inDataSection) {
          headers = cells;
          inDataSection = true;
        } else if (cells.length === headers.length) {
          const obj: CSVData = {};
          headers.forEach((header, index) => {
            obj[header] = cells[index] || '';
          });
          data.push(obj);
        }
      } else if (line.includes('\t')) {
        // Tab-separated format
        const cells = line.split('\t');
        
        if (!inDataSection) {
          headers = cells;
          inDataSection = true;
        } else if (cells.length === headers.length) {
          const obj: CSVData = {};
          headers.forEach((header, index) => {
            obj[header] = cells[index] || '';
          });
          data.push(obj);
        }
      }
    }

    return data;
  }

  /**
   * Parses list format content
   * @param lines - Array of text lines
   * @returns Array of objects
   */
  private parseListFormat(lines: string[]): CSVData[] {
    const data: CSVData[] = [];
    let currentObj: CSVData = {};

    for (const line of lines) {
      if (line.includes(':') || line.includes(' - ')) {
        const separator = line.includes(':') ? ':' : ' - ';
        const [key, value] = line.split(separator, 2);
        
        if (key && value) {
          currentObj[key.trim()] = value.trim();
        }
      } else if (line.trim() === '' && Object.keys(currentObj).length > 0) {
        // Empty line indicates end of current object
        data.push(currentObj);
        currentObj = {};
      }
    }

    // Add the last object if it exists
    if (Object.keys(currentObj).length > 0) {
      data.push(currentObj);
    }

    return data;
  }

  /**
   * Parses simple format content
   * @param lines - Array of text lines
   * @returns Array of objects
   */
  private parseSimpleFormat(lines: string[]): CSVData[] {
    // For simple format, create a single column CSV with the content
    return lines.map((line, index) => ({
      'Line': index + 1,
      'Content': line
    }));
  }

  /**
   * Validates CSV data structure
   * @param data - Array of objects to validate
   * @returns boolean indicating if data is valid
   */
  validateData(data: CSVData[]): boolean {
    if (!Array.isArray(data) || data.length === 0) {
      return false;
    }

    // Check if all objects have consistent structure
    const firstKeys = Object.keys(data[0]);
    return data.every(obj => 
      typeof obj === 'object' && 
      obj !== null &&
      Object.keys(obj).length > 0
    );
  }

  /**
   * Gets statistics about the CSV data
   * @param data - Array of objects
   * @returns Object with statistics
   */
  getDataStatistics(data: CSVData[]): {
    rowCount: number;
    columnCount: number;
    headers: string[];
    sampleData: CSVData;
  } {
    if (data.length === 0) {
      return {
        rowCount: 0,
        columnCount: 0,
        headers: [],
        sampleData: {}
      };
    }

    const headers = Object.keys(data[0]);
    return {
      rowCount: data.length,
      columnCount: headers.length,
      headers: headers,
      sampleData: data[0]
    };
  }
}
