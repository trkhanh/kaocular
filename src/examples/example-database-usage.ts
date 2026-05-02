import { QADatabaseService } from '../../lib/database';
import { LogLevel } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    console.log('🚀 QA Database Example Usage');
    console.log('============================');
    
    // Example: Save a log entry (test failure)
    console.log('\n📝 Saving log entry...');
    
    const logEntry = await QADatabaseService.saveLogEntry({
      level: LogLevel.ERROR,
      message: 'Test failed: Login validation error - Invalid credentials provided',
      tags: ['authentication', 'login', 'test-failure']
    });
    
    console.log(`✅ Log entry saved: ${logEntry.id}`);
    
    // Example: Save a solution (fix from Cursor)
    console.log('\n🔧 Saving solution...');
    
    const solution = await QADatabaseService.saveSolution({
      logEntryId: logEntry.id,
      issueText: 'Login validation is failing due to incorrect credential checking logic',
      solutionText: 'Updated the validation logic to properly check user credentials and handle edge cases',
      tags: ['fix', 'authentication', 'validation']
    });
    
    console.log(`✅ Solution saved: ${solution.id}`);
    
    // Example: Save another log entry (warning)
    console.log('\n⚠️ Saving warning log...');
    
    const warningLog = await QADatabaseService.saveLogEntry({
      level: LogLevel.WARN,
      message: 'Performance warning: Database query taking longer than expected',
      tags: ['performance', 'database', 'slow-query']
    });
    
    console.log(`✅ Warning log saved: ${warningLog.id}`);
    
    // Example: Get recent log entries
    console.log('\n📊 Recent log entries:');
    const recentLogs = await QADatabaseService.getRecentLogEntries(5);
    recentLogs.forEach((log, index) => {
      const hasSolution = log.solution ? '✅' : '❌';
      const tags = log.tags.map(t => t.name).join(', ');
      console.log(`${index + 1}. [${log.level}] ${log.message.substring(0, 50)}... ${hasSolution} (tags: ${tags})`);
    });
    
    // Example: Get error logs that need solutions
    console.log('\n❌ Error logs needing solutions:');
    const errorLogs = await QADatabaseService.getErrorLogsNeedingSolutions();
    errorLogs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.level}] ${log.message.substring(0, 50)}...`);
    });
    
    // Example: Find similar log entries
    console.log('\n🔍 Finding similar log entries:');
    const similarLogs = await QADatabaseService.findSimilarLogEntries('login', LogLevel.ERROR);
    similarLogs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.level}] ${log.message.substring(0, 50)}...`);
    });
    
    // Example: Get all tags
    console.log('\n🏷️ All tags in database:');
    const allTags = await QADatabaseService.getAllTags();
    console.log('Tags:', allTags.join(', '));
    
    console.log('\n✅ QA Database example completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Run the example
main();