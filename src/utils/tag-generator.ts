import { generateObject } from 'ai';
import { cerebras } from '@ai-sdk/cerebras';
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Schema for error message tag extraction
const errorTagExtractionSchema = z.object({
  tags: z.array(z.string()).describe('Array of searchable tags for database queries'),
  errorType: z.string().describe('Primary error type/category'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).describe('Error severity level'),
  components: z.array(z.string()).describe('System components affected by the error'),
  keywords: z.array(z.string()).describe('Key technical terms and identifiers'),
  confidence: z.number().min(0).max(1).describe('Confidence score for the tag extraction (0-1)')
});

export interface ErrorTagResult {
  tags: string[];
  errorType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  components: string[];
  keywords: string[];
  confidence: number;
}

export interface ErrorTagOptions {
  maxTags?: number;
  includeComponents?: boolean;
  includeKeywords?: boolean;
  systemPrompt?: string;
}

/**
 * Extracts searchable tags from an error message for database queries
 * @param errorMessage - The error message to analyze and tag
 * @param options - Optional configuration for tag generation
 * @returns Promise<ErrorTagResult> - Object containing error tags, type, severity, and components
 */
export async function generateErrorTags(
  errorMessage: string,
  options: ErrorTagOptions = {}
): Promise<ErrorTagResult> {
  try {
    const {
      maxTags = 8,
      includeComponents = true,
      includeKeywords = true,
      systemPrompt
    } = options;

    // Specialized system prompt for error message analysis
    const defaultSystemPrompt = `You are an expert at analyzing error messages and creating searchable tags for database queries.

Your task is to:
1. Extract up to ${maxTags} searchable tags that would be useful for database queries
2. Identify the primary error type/category
3. Determine the severity level (low, medium, high, critical)
4. ${includeComponents ? 'Identify system components affected' : ''}
5. ${includeKeywords ? 'Extract key technical terms and identifiers' : ''}
6. Provide a confidence score for the analysis

Guidelines for tags:
- Use lowercase, hyphenated format (e.g., "database-connection", "authentication-failed")
- Focus on searchable terms that would help find similar errors
- Include error codes, component names, and failure types
- Make tags specific enough to be useful for filtering
- Avoid overly generic terms like "error" or "failed"
- Include both technical and business context

Severity guidelines:
- critical: System crashes, data loss, security breaches
- high: Major functionality broken, performance issues
- medium: Feature failures, non-critical errors
- low: Warnings, minor issues, cosmetic problems`;

    const result = await generateObject({
      model: cerebras('llama-3.3-70b'),
      schema: errorTagExtractionSchema,
      system: systemPrompt || defaultSystemPrompt,
      prompt: `Analyze this error message and extract searchable tags:\n\n${errorMessage}`,
      temperature: 0.2, // Very low temperature for consistent error analysis
      maxRetries: 2
    });

    // Ensure we don't exceed maxTags
    const filteredResult = {
      ...result.object,
      tags: result.object.tags.slice(0, maxTags),
      components: includeComponents ? result.object.components : [],
      keywords: includeKeywords ? result.object.keywords : []
    };

    return filteredResult;

  } catch (error) {
    throw new Error(`Error tag generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts tags from multiple error messages in batch
 * @param errorMessages - Array of error messages to analyze
 * @param options - Optional configuration for tag generation
 * @returns Promise<ErrorTagResult[]> - Array of error tag extraction results
 */
export async function generateErrorTagsBatch(
  errorMessages: string[],
  options: ErrorTagOptions = {}
): Promise<ErrorTagResult[]> {
  try {
    // Process error messages in parallel (be mindful of rate limits)
    const promises = errorMessages.map(errorMessage => generateErrorTags(errorMessage, options));
    const batchResults = await Promise.all(promises);
    
    return batchResults;
  } catch (error) {
    throw new Error(`Batch error tag generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyzes error patterns and suggests common tags for similar errors
 * @param errorMessages - Array of error messages to analyze for patterns
 * @param options - Optional configuration for analysis
 * @returns Promise<{commonTags: string[], patterns: string[]}> - Common tags and patterns found
 */
export async function analyzeErrorPatterns(
  errorMessages: string[],
  options: ErrorTagOptions = {}
): Promise<{commonTags: string[], patterns: string[]}> {
  try {
    const patternSchema = z.object({
      commonTags: z.array(z.string()).describe('Most frequently occurring tags across all error messages'),
      patterns: z.array(z.string()).describe('Common error patterns and themes identified')
    });

    const systemPrompt = `You are an expert at analyzing error message patterns. Analyze the provided error messages to identify:
1. Common tags that appear across multiple errors
2. Recurring patterns and themes
3. Most frequent error types and components

Focus on identifying tags that would be most useful for database queries and error categorization.`;

    const combinedErrors = errorMessages.join('\n\n---\n\n');
    
    const result = await generateObject({
      model: cerebras('llama-3.3-70b'),
      schema: patternSchema,
      system: systemPrompt,
      prompt: `Analyze these error messages for common patterns and tags:\n\n${combinedErrors}`,
      temperature: 0.2,
      maxRetries: 2
    });

    return result.object;

  } catch (error) {
    throw new Error(`Error pattern analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Example usage and CLI interface
async function main() {
  try {
    console.log('🏷️  Error Message Tag Generator with Cerebras AI\n');

    // Check for API key
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) {
      console.log('❌ CEREBRAS_API_KEY not found in environment variables');
      console.log('   Please set your Cerebras API key in the .env file:');
      console.log('   CEREBRAS_API_KEY=your_api_key_here');
      return;
    }

    // Example 1: Database connection error
    console.log('📝 Example 1: Database connection error...');
    const dbError = `
      Error: Connection timeout to database server 'prod-db-01' after 30 seconds.
      Failed to establish connection to PostgreSQL database 'user_management'.
      Connection string: postgresql://user:***@prod-db-01:5432/user_management
      Error code: ECONNREFUSED
      Timestamp: 2024-01-15T10:30:45.123Z
    `;

    const dbErrorTags = await generateErrorTags(dbError, {
      maxTags: 8,
      includeComponents: true,
      includeKeywords: true
    });

    console.log('✅ Database error tags extracted:');
    console.log('Tags:', dbErrorTags.tags);
    console.log('Error Type:', dbErrorTags.errorType);
    console.log('Severity:', dbErrorTags.severity);
    console.log('Components:', dbErrorTags.components);
    console.log('Keywords:', dbErrorTags.keywords);
    console.log('Confidence:', dbErrorTags.confidence);
    console.log('');

    // Example 2: Authentication error
    console.log('📝 Example 2: Authentication error...');
    const authError = `
      Authentication failed for user 'admin@company.com'.
      Invalid JWT token provided. Token expired at 2024-01-15T09:45:00Z.
      Request ID: req_123456789
      IP Address: 192.168.1.100
      User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
      Endpoint: /api/v1/users/profile
    `;

    const authErrorTags = await generateErrorTags(authError, {
      maxTags: 6,
      includeComponents: true,
      includeKeywords: true
    });

    console.log('✅ Authentication error tags extracted:');
    console.log('Tags:', authErrorTags.tags);
    console.log('Error Type:', authErrorTags.errorType);
    console.log('Severity:', authErrorTags.severity);
    console.log('Components:', authErrorTags.components);
    console.log('Keywords:', authErrorTags.keywords);
    console.log('Confidence:', authErrorTags.confidence);
    console.log('');

    // Example 3: Batch error processing
    console.log('📝 Example 3: Batch error processing...');
    const errorMessages = [
      'Memory allocation failed: Out of memory error in Node.js process. Heap size exceeded 2GB limit.',
      'File not found: /var/log/application.log - Permission denied when trying to read log file.',
      'API rate limit exceeded: 429 Too Many Requests. Limit: 1000 requests per hour. Current: 1001 requests.'
    ];

    const batchErrorTags = await generateErrorTagsBatch(errorMessages, {
      maxTags: 5,
      includeComponents: true,
      includeKeywords: true
    });

    console.log('✅ Batch error tags extracted:');
    batchErrorTags.forEach((result, index) => {
      console.log(`Error ${index + 1}:`, result.tags);
      console.log(`  Type: ${result.errorType}, Severity: ${result.severity}`);
      console.log(`  Components: ${result.components.join(', ')}`);
      console.log('');
    });

    // Example 4: Error pattern analysis
    console.log('📝 Example 4: Error pattern analysis...');
    const patternAnalysis = await analyzeErrorPatterns(errorMessages);
    console.log('✅ Error pattern analysis:');
    console.log('Common Tags:', patternAnalysis.commonTags);
    console.log('Patterns:', patternAnalysis.patterns);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  main();
}
