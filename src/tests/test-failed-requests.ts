import { StagehandWithBrowserTools } from '../agent/stagehand-browser-tools';
import { saveFailedRequestsToFile, formatFailedRequestsSummary } from '../utils/save-failed-requests';
import { getStagehandConfig, getProviderInfo } from '../agent/config';

/**
 * Quick test to demonstrate saving failed requests to a text file
 */
async function testFailedRequestsCapture() {
  const providerInfo = getProviderInfo();
  console.log(`🔧 Testing Failed Request Capture with ${providerInfo.name}\n`);

  const stagehand = new StagehandWithBrowserTools({
    env: 'LOCAL',
    localBrowserLaunchOptions: {
      headless: true, // Run headless for quick test
    },
    ...getStagehandConfig(),
  });

  try {
    await stagehand.init();
    await stagehand.startMonitoring();

    console.log('📡 Making some test requests...\n');

    // Navigate to the test app
    await stagehand.page.goto('http://localhost:3000');
    
    // Make some failed requests
    console.log('Testing broken API endpoint...');
    await stagehand.page.evaluate(() => {
      // Directly trigger failed requests
      fetch('/api/nonexistent').catch(() => {});
      fetch('/api/trpc/brokenEndpoint?batch=1&input={}').catch(() => {});
    });

    // Wait for requests to complete
    await stagehand.page.waitForTimeout(2000);

    // Get all failed requests
    const failedRequests = stagehand.getFailedRequests();
    
    console.log('\n📊 Results:');
    console.log(formatFailedRequestsSummary(failedRequests));
    
    if (failedRequests.length > 0) {
      const filepath = saveFailedRequestsToFile(failedRequests, 'test-failed-requests.txt');
      console.log(`\n✅ Failed requests saved to: ${filepath}`);
      console.log('📄 Open the file to see detailed error information');
    } else {
      console.log('\n⚠️ No failed requests detected');
      console.log('Make sure the Next.js app is running on http://localhost:3000');
    }

    await stagehand.close();

  } catch (error) {
    console.error('❌ Error:', error);
    await stagehand.close();
  }
}

// Run the test
if (require.main === module) {
  testFailedRequestsCapture().catch(console.error);
}
