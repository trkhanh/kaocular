#!/usr/bin/env tsx

import { retrieveLogs, searchByTags, disconnect } from '../../lib/log-operations';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Parse command line arguments
function parseArgs(args: string[]): { input?: string; tags?: string[]; limit?: number } {
  const result: { input?: string; tags?: string[]; limit?: number } = {
    limit: 5,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--input':
      case '-i':
        result.input = args[++i];
        break;
        
      case '--tags':
      case '-t':
        // Collect tags until we hit another flag or end of args
        const tags: string[] = [];
        while (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          tags.push(args[++i]);
        }
        result.tags = tags;
        break;
        
      case '--limit':
      case '-l':
        result.limit = parseInt(args[++i], 10);
        if (isNaN(result.limit) || result.limit < 1) {
          console.error('Invalid limit value');
          result.limit = 5;
        }
        break;
    }
  }
  
  return result;
}

function formatResult(result: any, index: number) {
  console.log(`\n${colors.bright}${colors.cyan}═══ Result ${index + 1} ═══${colors.reset}`);
  
  // Issue text
  console.log(`${colors.yellow}Issue:${colors.reset}`);
  console.log(`  ${result.issue_text || result.issueText}`);
  
  // Solution if available
  if (result.solution_text || result.solutionText) {
    console.log(`${colors.green}Solution:${colors.reset}`);
    console.log(`  ${result.solution_text || result.solutionText}`);
  }
  
  // Tags
  if (result.tags && result.tags.length > 0) {
    console.log(`${colors.magenta}Tags:${colors.reset} ${result.tags.join(', ')}`);
  }
  
  // Match type and score
  if (result.matchType) {
    const scoreColor = result.score > 0.8 ? colors.green : result.score > 0.5 ? colors.yellow : colors.dim;
    console.log(`${colors.blue}Match Type:${colors.reset} ${result.matchType}`);
    console.log(`${colors.blue}Score:${colors.reset} ${scoreColor}${(result.score * 100).toFixed(2)}%${colors.reset}`);
    
    if (result.textScore) {
      console.log(`${colors.blue}Text Score:${colors.reset} ${result.textScore.toFixed(4)}`);
    }
  }
  
  // Timestamp
  const timestamp = result.timestamp || result.created_at || result.createdAt;
  if (timestamp) {
    const date = new Date(timestamp);
    console.log(`${colors.dim}Stored: ${date.toLocaleString()}${colors.reset}`);
  }
  
  // Metadata if interesting
  if (result.metadata && typeof result.metadata === 'object') {
    const meta = result.metadata;
    if (meta.severity || meta.component || meta.priority) {
      console.log(`${colors.dim}Metadata:${colors.reset}`);
      if (meta.severity) console.log(`  Severity: ${meta.severity}`);
      if (meta.component) console.log(`  Component: ${meta.component}`);
      if (meta.priority) console.log(`  Priority: ${meta.priority}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                Agent Retrieve - Log Search Tool                ║
╚════════════════════════════════════════════════════════════════╝

Usage: tsx agent-retrieve.ts --input "<query>" [options]

Options:
  --input, -i    <text>     Search query for semantic search (required unless using --tags)
  --tags, -t     <tag1> ... Search by tags (space-separated)
  --limit, -l    <number>   Maximum results to return (default: 5)
  --help, -h                Show this help message

Examples:
  # Semantic search
  tsx agent-retrieve.ts --input "database connection errors"
  
  # Search with limit
  tsx agent-retrieve.ts --input "API performance issues" --limit 10
  
  # Search by tags
  tsx agent-retrieve.ts --tags bug database
  
  # Combined search
  tsx agent-retrieve.ts --input "authentication" --tags security --limit 3
    `);
    process.exit(0);
  }
  
  const params = parseArgs(args);
  
  // Validate that we have either input or tags
  if (!params.input && (!params.tags || params.tags.length === 0)) {
    console.error('❌ Error: Either --input or --tags is required');
    process.exit(1);
  }
  
  console.log(`${colors.bright}${colors.blue}🔍 Searching logs...${colors.reset}`);
  
  if (params.input) {
    console.log(`Query: "${params.input}"`);
  }
  if (params.tags && params.tags.length > 0) {
    console.log(`Tags: ${params.tags.join(', ')}`);
  }
  console.log(`Limit: ${params.limit}`);
  console.log('');
  
  try {
    let results: any[] = [];
    
    if (params.input) {
      // Semantic search
      results = await retrieveLogs({
        input: params.input,
        limit: params.limit,
      });
    } else if (params.tags && params.tags.length > 0) {
      // Tag-based search
      results = await searchByTags(params.tags, params.limit);
    }
    
    if (results.length === 0) {
      console.log(`${colors.yellow}No matching logs found.${colors.reset}`);
    } else {
      console.log(`${colors.green}Found ${results.length} result(s):${colors.reset}`);
      
      results.forEach((result, index) => {
        formatResult(result, index);
      });
      
      console.log(`\n${colors.bright}${colors.cyan}═══ End of Results ═══${colors.reset}\n`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error retrieving logs:${colors.reset}`, error);
    process.exit(1);
  } finally {
    await disconnect();
  }
}

// Run the main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
