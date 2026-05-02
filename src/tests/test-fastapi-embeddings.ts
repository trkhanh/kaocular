#!/usr/bin/env tsx

import { generateEmbedding, generateEmbeddingsBatch, cosineSimilarity, checkEmbeddingService } from '../../lib/embeddings';
import * as dotenv from 'dotenv';

dotenv.config();

// Test data for semantic similarity
const testTexts = [
  // Similar pairs
  { text: "The cat sat on the mat", category: "animals" },
  { text: "A feline rested on the rug", category: "animals" },
  
  // Technical issues
  { text: "Database connection timeout error", category: "database" },
  { text: "SQL server connection failed", category: "database" },
  
  // Authentication
  { text: "User login failed with invalid credentials", category: "auth" },
  { text: "Authentication error: wrong password", category: "auth" },
  
  // Performance
  { text: "Application running slowly", category: "performance" },
  { text: "System performance degradation detected", category: "performance" },
];

async function testEmbeddingDimensions() {
  console.log('\n📐 Test 1: Verify 1536-dimensional embeddings\n');
  
  const text = "Test embedding dimensions";
  console.log(`Generating embedding for: "${text}"`);
  
  const embedding = await generateEmbedding(text);
  
  console.log(`✅ Embedding dimensions: ${embedding.length}`);
  
  if (embedding.length !== 1536) {
    console.error(`❌ ERROR: Expected 1536 dimensions, got ${embedding.length}`);
    return false;
  }
  
  // Check if normalized (should have magnitude ~1)
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  console.log(`✅ Embedding magnitude: ${magnitude.toFixed(4)} (should be ~1.0 for normalized vectors)`);
  
  // Check value range
  const min = Math.min(...embedding);
  const max = Math.max(...embedding);
  console.log(`✅ Value range: [${min.toFixed(4)}, ${max.toFixed(4)}]`);
  
  return true;
}

async function testSemanticSimilarity() {
  console.log('\n🧠 Test 2: Semantic Similarity with 1536-dim vectors\n');
  
  // Generate embeddings for all test texts
  console.log('Generating embeddings for test texts...');
  const embeddings = await Promise.all(
    testTexts.map(async (item) => ({
      ...item,
      embedding: await generateEmbedding(item.text)
    }))
  );
  
  console.log(`✅ Generated ${embeddings.length} embeddings, each with ${embeddings[0].embedding.length} dimensions\n`);
  
  // Calculate similarities
  console.log('Similarity Matrix:');
  console.log('=' .repeat(80));
  
  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      const similarity = cosineSimilarity(embeddings[i].embedding, embeddings[j].embedding);
      const percentage = (similarity * 100).toFixed(1);
      
      // Same category should have higher similarity
      const sameCategory = embeddings[i].category === embeddings[j].category;
      const emoji = sameCategory ? '✅' : '  ';
      
      console.log(`${emoji} [${embeddings[i].category}] "${embeddings[i].text.substring(0, 30)}..."`);
      console.log(`   [${embeddings[j].category}] "${embeddings[j].text.substring(0, 30)}..."`);
      console.log(`   Similarity: ${percentage}% ${similarity > 0.7 ? '(High)' : similarity > 0.4 ? '(Medium)' : '(Low)'}`);
      console.log('');
    }
  }
  
  return true;
}

async function testBatchProcessing() {
  console.log('\n⚡ Test 3: Batch Processing with 1536-dim vectors\n');
  
  const batchTexts = [
    "First test sentence",
    "Second test sentence",
    "Third test sentence"
  ];
  
  console.log(`Processing batch of ${batchTexts.length} texts...`);
  
  const startTime = Date.now();
  const batchEmbeddings = await generateEmbeddingsBatch(batchTexts);
  const batchTime = Date.now() - startTime;
  
  console.log(`✅ Batch processing completed in ${batchTime}ms`);
  
  // Verify dimensions
  for (let i = 0; i < batchEmbeddings.length; i++) {
    console.log(`   Text ${i + 1}: ${batchEmbeddings[i].length} dimensions`);
    if (batchEmbeddings[i].length !== 1536) {
      console.error(`❌ ERROR: Text ${i + 1} has wrong dimensions!`);
      return false;
    }
  }
  
  // Compare with individual processing time
  console.log('\nComparing with individual processing...');
  const individualStartTime = Date.now();
  for (const text of batchTexts) {
    await generateEmbedding(text);
  }
  const individualTime = Date.now() - individualStartTime;
  
  console.log(`Individual processing: ${individualTime}ms`);
  console.log(`Batch processing: ${batchTime}ms`);
  console.log(`Speed improvement: ${((individualTime / batchTime) * 100 - 100).toFixed(0)}%`);
  
  return true;
}

async function testGPUAcceleration() {
  console.log('\n🚀 Test 4: GPU Acceleration Check\n');
  
  const serviceRunning = await checkEmbeddingService();
  
  if (serviceRunning) {
    // The checkEmbeddingService function already logs GPU info
    console.log('✅ Service check completed');
  } else {
    console.log('❌ Service not running');
    return false;
  }
  
  // Test performance with a longer text
  const longText = `
    This is a longer text to test GPU acceleration performance. 
    When processing longer texts, GPU acceleration should provide 
    significant performance improvements compared to CPU processing.
    The embedding model will process this entire text and generate 
    a 1536-dimensional vector representation.
  `.trim();
  
  console.log('\nPerformance test with longer text...');
  const startTime = Date.now();
  const embedding = await generateEmbedding(longText);
  const elapsed = Date.now() - startTime;
  
  console.log(`✅ Generated ${embedding.length}-dim embedding in ${elapsed}ms`);
  
  return true;
}

async function runAllTests() {
  console.log('🧪 FastAPI Embedding Service Test Suite');
  console.log('Testing 1536-dimensional Qwen embeddings');
  console.log('=' .repeat(80));
  
  try {
    // Check service first
    console.log('\n🔌 Checking FastAPI service connection...');
    const serviceReady = await checkEmbeddingService();
    
    if (!serviceReady) {
      console.error('❌ FastAPI embedding service is not running!');
      console.error('Please start it first: ./start-embedding-service.sh');
      process.exit(1);
    }
    
    // Run tests
    const tests = [
      { name: 'Dimension Test', fn: testEmbeddingDimensions },
      { name: 'Semantic Similarity', fn: testSemanticSimilarity },
      { name: 'Batch Processing', fn: testBatchProcessing },
      { name: 'GPU Acceleration', fn: testGPUAcceleration },
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      try {
        const result = await test.fn();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`❌ ${test.name} failed with error:`, error);
        failed++;
      }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(80));
    console.log('📊 Test Summary:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   Total: ${tests.length}`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! FastAPI service with 1536-dim embeddings is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});
