import { StagehandWithBrowserTools } from '../agent/stagehand-browser-tools';
import { getStagehandConfig, getAgentConfig, getProviderInfo } from '../agent/config';
import { saveFailedRequestsToFile, formatFailedRequestsSummary } from '../utils/save-failed-requests';

/**
 * Example showing how to use the agent functionality with browser monitoring
 * Works with both Gemini and Anthropic providers
 */
async function runAgentWithBrowserTools() {
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

    // Navigate to the test app
    await stagehand.page.goto('http://localhost:3000');

    // Create an agent for autonomous execution
    const agent = stagehand.agent(getAgentConfig());

    console.log('\n=== Running Agent Tasks ===');
    
    // Let the agent perform complex tasks autonomously
    await agent.execute({
      instruction: "Navigate to https://example.com and get the page title",
      maxSteps: 3
    });

    // Check captured console logs
    const consoleLogs = stagehand.getConsoleLogs();
    console.log('\nCaptured Console Logs:', consoleLogs);

    // Another agent task
    await agent.execute({
      instruction: "Navigate to https://httpbin.org/get and check the response",
      maxSteps: 3
    });

    // Check network logs for requests
    const networkLogs = stagehand.getNetworkLogs();
    console.log('\nNetwork Logs from Agent Actions:', networkLogs);

    // Test storage operations
    await agent.execute({
      instruction: "Set a localStorage item with key 'agentTest' and value 'successfulTest'",
      maxSteps: 3
    });

    const storageData = await stagehand.getStorageData();
    console.log('\nStorage Data After Agent Actions:', storageData);

    // Test error handling
    await agent.execute({
      instruction: "Navigate to a non-existent page to trigger an error",
      maxSteps: 3
    });

    const failedRequests = stagehand.getFailedRequests();
    console.log('\nFailed Requests Summary:');
    console.log(formatFailedRequestsSummary(failedRequests));
    
    // Save failed requests to file
    if (failedRequests.length > 0) {
      const filepath = saveFailedRequestsToFile(failedRequests);
      console.log(`Failed requests saved to: ${filepath}`);
    }

    // Export all logs
    const allLogs = stagehand.exportLogs();
    console.log('\n=== All Captured Logs ===');
    console.log(allLogs);

  } catch (error) {
    console.error('Agent execution error:', error instanceof Error ? error.message : String(error));
    
    // Additional troubleshooting for common errors
    if (error instanceof Error && error.message?.includes('UnsupportedModelError')) {
      console.log('\n⚠️ Model Configuration Issue:');
      console.log(`Currently using: ${providerInfo.model}`);
      console.log('Make sure your API key matches the provider you\'re trying to use.');
      console.log('Check your .env file for the correct API key.');
    }
  } finally {
    await stagehand.close();
  }
}

// Run the example
if (require.main === module) {
  runAgentWithBrowserTools().catch(console.error);
}
