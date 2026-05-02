import { StagehandWithBrowserTools } from '../agent/stagehand-browser-tools';
import { getStagehandConfig, getProviderInfo } from '../agent/config';
import { saveFailedRequestsToFile, formatFailedRequestsSummary } from '../utils/save-failed-requests';

async function runStagehandWithBrowserTools() {
  const providerInfo = getProviderInfo();
  console.log(`Using ${providerInfo.name} (${providerInfo.model})`);
  
  const stagehand = new StagehandWithBrowserTools({
    env: 'LOCAL',
    localBrowserLaunchOptions: {
      headless: false,
      devtools: true,
    },
    ...getStagehandConfig(),
  });

  try {
    await stagehand.init();
    await stagehand.startMonitoring();

    // Navigate to the Next.js app (will be at localhost:3000)
    await stagehand.page.goto('http://localhost:3000');
    
    console.log('\n=== Testing Console Logs ===');
    await stagehand.page.goto('https://example.com');
    await stagehand.page.waitForTimeout(1000);
    
    const consoleLogs = stagehand.getConsoleLogs();
    console.log('Console Logs:', consoleLogs);

    console.log('\n=== Testing LocalStorage ===');
    await stagehand.page.evaluate(() => {
      localStorage.setItem('test-key', 'test-value');
    });
    await stagehand.page.waitForTimeout(1000);
    
    const storageData = await stagehand.getStorageData();
    console.log('Storage Data:', storageData);

    console.log('\n=== Testing Network Requests ===');
    await stagehand.page.goto('https://httpbin.org/get');
    await stagehand.page.waitForTimeout(2000);
    
    const networkLogs = stagehand.getNetworkLogs();
    console.log('Network Logs:', networkLogs);

    console.log('\n=== Testing Failed Requests ===');
    await stagehand.page.goto('https://httpbin.org/status/404');
    await stagehand.page.waitForTimeout(2000);
    
    const failedRequests = stagehand.getFailedRequests();
    console.log(formatFailedRequestsSummary(failedRequests));
    
    // Save failed requests to file
    if (failedRequests.length > 0) {
      const filepath = saveFailedRequestsToFile(failedRequests);
      console.log(`Failed requests saved to: ${filepath}`);
    }

    // Get page data
    console.log('\n=== Getting Page Data ===');
    const pageTitle = await stagehand.page.title();
    const pageUrl = stagehand.page.url();
    console.log('Page Title:', pageTitle);
    console.log('Page URL:', pageUrl);

    // Export all logs
    const logsExport = stagehand.exportLogs();
    console.log('\n=== Exported Logs ===');
    console.log(logsExport);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await stagehand.close();
  }
}

// Run the example
if (require.main === module) {
  runStagehandWithBrowserTools().catch(console.error);
}
