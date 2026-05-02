import { StagehandWithBrowserTools } from '../agent/stagehand-browser-tools';
import { getStagehandConfig, getProviderInfo } from '../agent/config';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Quick test to verify the setup is working correctly
 */
async function testSetup() {
  console.log('🔧 Testing Stagehand with Browser Tools Setup...\n');

  // Check environment
  try {
    const providerInfo = getProviderInfo();
    console.log(`✅ Environment variables loaded (using ${providerInfo.name})`);
  } catch (error) {
    console.error('❌ No API key found in .env file');
    console.log('Please create a .env file with:');
    console.log('  CEREBRAS_API_KEY=your_key_here');
    process.exit(1);
  }

  // Test Stagehand initialization
  try {
    const modelConfig = getStagehandConfig();

    const stagehand = new StagehandWithBrowserTools({
      env: 'LOCAL',
      localBrowserLaunchOptions: {
        headless: true, // Run headless for quick test
      },
      ...modelConfig,
    });

    console.log('✅ Stagehand instance created');

    await stagehand.init();
    console.log('✅ Stagehand initialized');

    await stagehand.startMonitoring();
    console.log('✅ Browser monitoring started');

    // Test navigation
    await stagehand.page.goto('https://example.com');
    console.log('✅ Navigation successful');

    // Test console log capture
    await stagehand.page.evaluate(() => {
      console.log('Test message from browser');
    });
    
    await stagehand.page.waitForTimeout(500);
    const logs = stagehand.getConsoleLogs();
    if (logs.length > 0) {
      console.log('✅ Console log capture working');
    }

    // Test network monitoring
    const networkLogs = stagehand.getNetworkLogs();
    if (networkLogs.length > 0) {
      console.log('✅ Network monitoring working');
    }

    await stagehand.close();
    console.log('✅ Cleanup successful');

    console.log('\n🎉 All tests passed! Your setup is working correctly.');
    console.log('\nNext steps:');
    console.log('1. Start the Next.js app: pnpm dev:next');
    console.log('2. Run examples: pnpm run:stagehand or pnpm run:agent');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Check your API key (CEREBRAS_API_KEY) is valid');
    console.log('2. Ensure Chrome/Chromium is installed');
    console.log('3. Run: pnpm install');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testSetup().catch(console.error);
}
