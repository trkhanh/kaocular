import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing logs table with vector extensions...\n');

  // Create a test log entry
  const log = await prisma.log.create({
    data: {
      issueText: 'Database connection timeout after 30 seconds when running migration',
      solutionText: 'Increased connection pool size and added retry logic with exponential backoff',
      tags: ['database', 'timeout', 'migration', 'connection-pool'],
      metadata: {
        errorCode: 'ETIMEDOUT',
        duration: 30000,
        retries: 3
      }
    }
  });

  console.log('Created log entry:', log);

  // Test full-text search using raw SQL
  const searchResults = await prisma.$queryRawUnsafe(`
    SELECT id, issue_text, solution_text, 
           ts_rank(text_search, to_tsquery('english', 'database & connection')) as rank
    FROM logs
    WHERE text_search @@ to_tsquery('english', 'database & connection')
    ORDER BY rank DESC
  `);

  console.log('\nFull-text search results for "database & connection":');
  console.log(searchResults);

  // Test tag search
  const tagResults = await prisma.log.findMany({
    where: {
      tags: {
        has: 'database'
      }
    }
  });

  console.log('\nLogs with "database" tag:');
  console.log(tagResults);

  // Clean up
  await prisma.log.deleteMany();
  console.log('\nTest completed and cleaned up!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });