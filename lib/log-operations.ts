import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from './embeddings';

const prisma = new PrismaClient();

interface StoreLogParams {
  issue: string;
  solution?: string;
  tags: string[];
  metadata?: Record<string, any>;
}

interface RetrieveParams {
  input: string;
  limit?: number;
}

/**
 * Store a log entry with embeddings in the database
 */
export async function storeLog(params: StoreLogParams) {
  const { issue, solution, tags, metadata } = params;
  
  console.log('Generating embedding for issue text...');
  const startTime = Date.now();
  const embedding = await generateEmbedding(issue);
  const embeddingTime = Date.now() - startTime;
  console.log(`✅ Embedding generated in ${embeddingTime}ms`);
  
  // Create metadata with additional context
  const fullMetadata = {
    ...metadata,
    embeddingModel: 'Qwen/Qwen3-Embedding-4B',
    embeddingDimensions: embedding.length,
    embeddingGenerationTimeMs: embeddingTime,
    sourceType: 'agent-cli',
    storedAt: new Date().toISOString(),
  };
  
  console.log('Storing log in database...');
  
  // Since pgvector expects a specific format, we need to format the embedding properly
  // For Prisma with pgvector, we use a raw query to insert the vector
  const result = await prisma.$executeRaw`
    INSERT INTO logs (
      id, 
      issue_text, 
      solution_text, 
      tags, 
      metadata, 
      embedding,
      embedding_generated_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      ${issue},
      ${solution},
      ${tags},
      ${JSON.stringify(fullMetadata)}::jsonb,
      ${JSON.stringify(embedding)}::vector,
      ${new Date()},
      ${new Date()},
      ${new Date()}
    )
  `;
  
  console.log('✅ Log stored successfully');
  
  return {
    success: true,
    metadata: fullMetadata,
  };
}

/**
 * Retrieve relevant logs based on semantic search
 */
export async function retrieveLogs(params: RetrieveParams) {
  const { input, limit = 5 } = params;
  
  console.log('Generating embedding for query...');
  const queryEmbedding = await generateEmbedding(input);
  
  console.log('Searching for similar logs...');
  
  // Use both vector similarity and text search
  // First, get results using vector similarity
  const vectorResults = await prisma.$queryRaw<any[]>`
    SELECT 
      id,
      issue_text,
      solution_text,
      tags,
      metadata,
      timestamp,
      created_at,
      1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity_score
    FROM logs
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${limit}
  `;
  
  // Also do a text search for hybrid results
  const textResults = await prisma.$queryRaw<any[]>`
    SELECT 
      id,
      issue_text,
      solution_text,
      tags,
      metadata,
      timestamp,
      created_at,
      ts_rank(text_search, plainto_tsquery('english', ${input})) as text_score
    FROM logs
    WHERE text_search @@ plainto_tsquery('english', ${input})
    ORDER BY ts_rank(text_search, plainto_tsquery('english', ${input})) DESC
    LIMIT ${limit}
  `;
  
  // Combine and deduplicate results
  const allResults = new Map();
  
  // Add vector results with priority
  vectorResults.forEach(result => {
    allResults.set(result.id, {
      ...result,
      score: result.similarity_score,
      matchType: 'vector',
    });
  });
  
  // Add text results if not already present
  textResults.forEach(result => {
    if (!allResults.has(result.id)) {
      allResults.set(result.id, {
        ...result,
        score: result.text_score,
        matchType: 'text',
      });
    } else {
      // Combine scores if present in both
      const existing = allResults.get(result.id);
      existing.matchType = 'hybrid';
      existing.textScore = result.text_score;
    }
  });
  
  // Sort by score and return top results
  const finalResults = Array.from(allResults.values())
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit);
  
  return finalResults;
}

/**
 * Search logs by tags
 */
export async function searchByTags(tags: string[], limit: number = 5) {
  const results = await prisma.log.findMany({
    where: {
      tags: {
        hasSome: tags,
      },
    },
    take: limit,
    orderBy: {
      timestamp: 'desc',
    },
  });
  
  return results;
}

// Cleanup function
export async function disconnect() {
  await prisma.$disconnect();
}
