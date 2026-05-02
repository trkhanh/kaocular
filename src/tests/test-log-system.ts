#!/usr/bin/env tsx

import { storeLog, retrieveLogs, disconnect } from '../../lib/log-operations';
import * as dotenv from 'dotenv';

dotenv.config();

const testData = [
  {
    issue: "Application crashes when user uploads files larger than 10MB",
    solution: "Increased file upload limit in nginx.conf and adjusted Express body parser settings",
    tags: ["bug", "upload", "nginx"],
    metadata: { severity: "high", component: "file-upload" }
  },
  {
    issue: "Database connection pool exhausted during peak traffic",
    solution: "Increased connection pool size from 20 to 100 and added connection timeout handling",
    tags: ["database", "performance", "scaling"],
    metadata: { severity: "critical", component: "database" }
  },
  {
    issue: "Memory leak detected in React component lifecycle",
    solution: "Added cleanup in useEffect return function to remove event listeners",
    tags: ["bug", "memory", "react", "frontend"],
    metadata: { severity: "medium", component: "frontend" }
  },
  {
    issue: "API response times slow for user profile endpoint",
    solution: "Added Redis caching layer with 5 minute TTL for user profile data",
    tags: ["performance", "api", "caching"],
    metadata: { severity: "medium", component: "api" }
  },
  {
    issue: "Authentication tokens expiring too quickly causing user frustration",
    solution: "Extended JWT expiration from 1 hour to 24 hours and implemented refresh token mechanism",
    tags: ["auth", "ux", "security"],
    metadata: { severity: "low", component: "authentication" }
  }
];

async function runTests() {
  console.log('🧪 Testing Log Storage and Retrieval System\n');
  console.log('=' .repeat(60));
  
  // Test 1: Store sample logs
  console.log('\n📝 Test 1: Storing sample logs...\n');
  for (const data of testData) {
    try {
      console.log(`Storing: "${data.issue.substring(0, 50)}..."`);
      await storeLog(data);
      console.log('✅ Stored successfully\n');
    } catch (error) {
      console.error('❌ Failed to store:', error);
    }
  }
  
  // Wait a moment for indexing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('=' .repeat(60));
  
  // Test 2: Semantic search
  console.log('\n🔍 Test 2: Semantic Search\n');
  
  const searches = [
    "file upload problems",
    "slow performance issues",
    "authentication and login",
    "memory problems in frontend",
    "database connection errors"
  ];
  
  for (const query of searches) {
    console.log(`\nQuery: "${query}"`);
    console.log('-'.repeat(40));
    
    try {
      const results = await retrieveLogs({ input: query, limit: 3 });
      
      if (results.length === 0) {
        console.log('No results found');
      } else {
        results.forEach((result, idx) => {
          console.log(`${idx + 1}. Issue: ${result.issue_text.substring(0, 60)}...`);
          console.log(`   Score: ${(result.score * 100).toFixed(1)}% | Type: ${result.matchType}`);
          if (result.tags && result.tags.length > 0) {
            console.log(`   Tags: ${result.tags.join(', ')}`);
          }
        });
      }
    } catch (error) {
      console.error('❌ Search failed:', error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Test completed!\n');
}

// Run tests
runTests()
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    disconnect();
  });
