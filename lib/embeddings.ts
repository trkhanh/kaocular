import fetch from 'node-fetch';

// Configuration for Ollama service
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || 'embeddinggemma:300m';

// TypeScript interfaces for Ollama API
interface OllamaEmbedRequest {
  model: string;
  input: string | string[];
  truncate?: boolean;
  keep_alive?: string;
}

interface OllamaEmbedResponse {
  model: string;
  embeddings: number[][];
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
}

interface OllamaModelInfo {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: Record<string, any>;
}

/**
 * Check if Ollama is running and the embedding model is available
 */
export async function checkEmbeddingService(): Promise<boolean> {
  try {
    // Check if Ollama is running
    const versionResponse = await fetch(`${OLLAMA_API_URL}/api/version`);
    if (!versionResponse.ok) {
      console.error('❌ Ollama is not running');
      return false;
    }
    
    const version = await versionResponse.json() as { version: string };
    console.log(`✅ Ollama version ${version.version} is running`);
    
    // Check if our embedding model is available
    const modelsResponse = await fetch(`${OLLAMA_API_URL}/api/tags`);
    if (!modelsResponse.ok) {
      console.error('❌ Could not get model list');
      return false;
    }
    
    const models = await modelsResponse.json() as { models: OllamaModelInfo[] };
    const hasEmbeddingModel = models.models.some(m => 
      m.name === EMBEDDING_MODEL || m.name === EMBEDDING_MODEL.split(':')[0]
    );
    
    if (!hasEmbeddingModel) {
      console.error(`❌ Embedding model ${EMBEDDING_MODEL} not found`);
      console.error(`Please run: ollama pull embeddinggemma:300m`);
      return false;
    }
    
    console.log(`✅ Embedding model ${EMBEDDING_MODEL} is available`);
    return true;
    
  } catch (error) {
    console.error('❌ Error checking Ollama service:', error);
    return false;
  }
}

/**
 * Initialize the embedding service (check if Ollama is available)
 */
export async function initializeEmbeddings(): Promise<boolean> {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds
  
  for (let i = 0; i < maxRetries; i++) {
    const isServiceRunning = await checkEmbeddingService();
    
    if (isServiceRunning) {
      console.log('✅ Ollama embedding service is ready');
      return true;
    }
    
    if (i < maxRetries - 1) {
      console.log(`⏳ Waiting for Ollama service... (attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  console.error('⚠️  Ollama service is not available!');
  console.error('Please ensure:');
  console.error('  1. Ollama is installed and running');
  console.error(`  2. The embedding model is installed: ollama pull ${EMBEDDING_MODEL}`);
  throw new Error('Ollama embedding service not available');
}

/**
 * Generate embeddings using Ollama's API
 * Returns a 768-dimensional vector from embeddinggemma:300m
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Make sure service is running
    const isServiceRunning = await checkEmbeddingService();
    if (!isServiceRunning) {
      await initializeEmbeddings();
    }
    
    // Prepare request for Ollama
    const request: OllamaEmbedRequest = {
      model: EMBEDDING_MODEL,
      input: text,
      truncate: true,  // Truncate if text is too long
      keep_alive: '5m' // Keep model loaded for 5 minutes
    };
    
    // Call Ollama's embedding API
    const startTime = Date.now();
    const response = await fetch(`${OLLAMA_API_URL}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }
    
    const data: OllamaEmbedResponse = await response.json();
    const elapsedMs = Date.now() - startTime;
    
    // Extract the embedding (Ollama returns array of arrays for batch support)
    let embedding: number[];
    if (data.embeddings && Array.isArray(data.embeddings) && data.embeddings.length > 0) {
      embedding = data.embeddings[0];
    } else {
      throw new Error('Invalid embedding response from Ollama');
    }
    
    // Log performance info
    console.log(`⚡ Embedding generated in ${elapsedMs}ms (Ollama processing: ${(data.total_duration / 1e6).toFixed(0)}ms)`);
    
    // embeddinggemma:300m produces 768-dim embeddings natively
    if (embedding.length !== 768) {
      console.warn(`⚠️ Unexpected dimensions: got ${embedding.length}, expected 768 from embeddinggemma:300m`);
    }
    
    // Normalize the embedding for cosine similarity
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      embedding = embedding.map(val => val / norm);
    }
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding with Ollama:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in a batch
 * More efficient than calling generateEmbedding multiple times
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    // Make sure service is running
    const isServiceRunning = await checkEmbeddingService();
    if (!isServiceRunning) {
      await initializeEmbeddings();
    }
    
    // Ollama's /api/embed supports batch input
    const request: OllamaEmbedRequest = {
      model: EMBEDDING_MODEL,
      input: texts,  // Array of texts
      truncate: true,
      keep_alive: '5m'
    };
    
    const startTime = Date.now();
    const response = await fetch(`${OLLAMA_API_URL}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama batch embedding error (${response.status}): ${errorText}`);
    }
    
    const data: OllamaEmbedResponse = await response.json();
    const elapsedMs = Date.now() - startTime;
    
    console.log(`⚡ Batch of ${texts.length} embeddings generated in ${elapsedMs}ms`);
    
    // Process and normalize each embedding
    return data.embeddings.map(embedding => {
      // embeddinggemma:300m should produce 768 dimensions
      if (embedding.length !== 768) {
        console.warn(`⚠️ Batch embedding: Unexpected dimensions ${embedding.length}`);  
      }
      
      // Normalize
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      if (norm > 0) {
        return embedding.map(val => val / norm);
      }
      return embedding;
    });
  } catch (error) {
    console.error('Error generating batch embeddings with Ollama:', error);
    throw error;
  }
}

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error(`Vectors must have the same length: ${vec1.length} vs ${vec2.length}`);
  }
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) {
    return 0;
  }
  
  return dotProduct / denominator;
}

/**
 * Load the embedding model into Ollama's memory
 * This pre-loads the model to avoid cold start delays
 */
export async function preloadEmbeddingModel(): Promise<void> {
  try {
    console.log(`📦 Pre-loading embedding model ${EMBEDDING_MODEL}...`);
    
    // Generate a dummy embedding to load the model
    await generateEmbedding('preload');
    
    console.log(`✅ Model ${EMBEDDING_MODEL} is loaded and ready`);
  } catch (error) {
    console.warn('Warning: Could not pre-load embedding model:', error);
  }
}