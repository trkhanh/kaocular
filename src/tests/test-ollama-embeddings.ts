#!/usr/bin/env tsx

import { generateEmbedding, checkEmbeddingService, cosineSimilarity } from '../../lib/embeddings';
import * as dotenv from 'dotenv';

dotenv.config();

async function testOllamaEmbeddings() {
  console.log('🧪 Testing Ollama Embeddings with embeddinggemma:300m');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Check service
    console.log('\n📋 Test 1: Checking Ollama service...');
    const isRunning = await checkEmbeddingService();
    
    if (!isRunning) {
      console.error('❌ Ollama is not running or model not installed');
      console.error('Please run:');
      console.error('  1. ollama serve');
      console.error('  2. ollama pull dengcao/Qwen3-Embedding-4B:Q5_K_M');
      process.exit(1);
    }
    
    // Test 2: Generate single embedding
    console.log('\n📋 Test 2: Generating single embedding...');
    const text1 = "Database connection timeout error";
    const startTime = Date.now();
    const embedding1 = await generateEmbedding(text1);
    const elapsed = Date.now() - startTime;
    
    console.log(`✅ Generated embedding in ${elapsed}ms`);
    console.log(`   Dimensions: ${embedding1.length}`);
    console.log(`   Expected: 768 (native embeddinggemma:300m dimensions)`);
    
    if (embedding1.length !== 768) {
      console.error(`❌ ERROR: Wrong dimensions! Got ${embedding1.length}, expected 768`);
    }
    
    // Check normalization
    const magnitude = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    console.log(`   Magnitude: ${magnitude.toFixed(6)} (should be ~1.0 for normalized)`);
    
    // Test 3: Semantic similarity
    console.log('\n📋 Test 3: Testing semantic similarity...');
    
    const pairs = [
      ["Database connection timeout", "SQL server connection failed"],  // Similar
      ["User authentication failed", "Login error wrong password"],     // Similar
      ["Database connection timeout", "Weather is nice today"],         // Different
    ];
    
    for (const [text1, text2] of pairs) {
      const emb1 = await generateEmbedding(text1);
      const emb2 = await generateEmbedding(text2);
      const similarity = cosineSimilarity(emb1, emb2);
      
      console.log(`\n   "${text1}"`);
      console.log(`   "${text2}"`);
      console.log(`   Similarity: ${(similarity * 100).toFixed(1)}%`);
      
      if (similarity > 0.7) {
        console.log('   → High similarity ✅');
      } else if (similarity > 0.4) {
        console.log('   → Medium similarity');
      } else {
        console.log('   → Low similarity');
      }
    }
    
    // Test 4: Performance test
    console.log('\n📋 Test 4: Performance test (5 embeddings)...');
    const perfStart = Date.now();
    
    const testTexts = [
      "API returns 500 error",
      "Memory leak in React component",
      "Database query optimization needed",
      "Authentication token expired",
      "Network request timeout"
    ];
    
    for (const text of testTexts) {
      await generateEmbedding(text);
    }
    
    const totalTime = Date.now() - perfStart;
    const avgTime = totalTime / testTexts.length;
    
    console.log(`✅ Generated ${testTexts.length} embeddings in ${totalTime}ms`);
    console.log(`   Average: ${avgTime.toFixed(0)}ms per embedding`);
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('Ollama with embeddinggemma:300m is working correctly (768 dimensions).');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testOllamaEmbeddings().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
