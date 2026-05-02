#!/usr/bin/env tsx

import { storeLog, disconnect } from '../../lib/log-operations';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Parse command line arguments
function parseArgs(args: string[]): { issue?: string; solution?: string; tags: string[]; metadata?: Record<string, any> } {
  const result: { issue?: string; solution?: string; tags: string[]; metadata?: Record<string, any> } = {
    tags: [],
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--issue':
      case '-i':
        result.issue = args[++i];
        break;
        
      case '--solution':
      case '--solve':
      case '-s':
        result.solution = args[++i];
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
        
      case '--metadata':
      case '-m':
        try {
          result.metadata = JSON.parse(args[++i]);
        } catch (e) {
          console.error('Invalid JSON for metadata');
        }
        break;
    }
  }
  
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   Agent Store - Log Storage Tool               ║
╚════════════════════════════════════════════════════════════════╝

Usage: tsx agent-store.ts --issue "<issue>" [options]

Options:
  --issue, -i    <text>     Issue description (required)
  --solution, -s <text>     Solution description (optional)
  --solve                   Alias for --solution
  --tags, -t     <tag1> ... Tags for categorization (space-separated)
  --metadata, -m <json>     Additional metadata as JSON
  --help, -h                Show this help message

Examples:
  # Store an issue with solution and tags
  tsx agent-store.ts --issue "API returns 500 error" --solve "Fixed DB connection pool" --tags bug api database
  
  # Store with metadata
  tsx agent-store.ts --issue "Performance issue" --tags performance --metadata '{"severity":"high","component":"frontend"}'
    `);
    process.exit(0);
  }
  
  const params = parseArgs(args);
  
  // Validate required fields
  if (!params.issue) {
    console.error('❌ Error: --issue is required');
    process.exit(1);
  }
  
  console.log('📝 Storing log entry...');
  console.log('Issue:', params.issue);
  if (params.solution) console.log('Solution:', params.solution);
  if (params.tags.length > 0) console.log('Tags:', params.tags);
  if (params.metadata) console.log('Metadata:', params.metadata);
  console.log('');
  
  try {
    const result = await storeLog({
      issue: params.issue,
      solution: params.solution,
      tags: params.tags,
      metadata: params.metadata,
    });
    
    console.log('✅ Successfully stored log entry');
    console.log('Metadata:', result.metadata);
  } catch (error) {
    console.error('❌ Error storing log:', error);
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
