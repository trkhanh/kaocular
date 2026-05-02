import { StagehandWithBrowserTools } from '../agent/stagehand-browser-tools';
import { getStagehandConfig, getProviderInfo } from '../agent/config';

/**
 * Test script to verify browser stays visible
 */
async function testBrowserVisibility() {
  const providerInfo = getProviderInfo();
  console.log(`🔧 Testing Browser Visibility with ${providerInfo.name}\n`);
  
  console.log('Starting browser with visible configuration...');
  const stagehand = new StagehandWithBrowserTools({
    env: 'LOCAL',
    localBrowserLaunchOptions: {
      headless: false,  // Keep browser visible
      devtools: true,   // Show DevTools
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
      ],
      defaultViewport: null,  // Use full screen
    },
    ...getStagehandConfig(),
  });

  try {
    await stagehand.init();
    console.log('✅ Browser opened and visible');
    console.log('🖥️  Browser window should be maximized with DevTools');
    
    // Navigate to test page
    await stagehand.page.goto('http://localhost:3000');
    console.log('✅ Navigated to test app');
    
    // Keep browser open for observation
    console.log('\n📌 Browser will stay open for 10 seconds...');
    console.log('   You should see:');
    console.log('   - Maximized browser window');
    console.log('   - DevTools panel open');
    console.log('   - The test app loaded');
    
    await stagehand.page.waitForTimeout(10000);
    
    console.log('\n✅ Test completed - closing browser');
    await stagehand.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await stagehand.close();
  }
}

// Run the test
if (require.main === module) {
  testBrowserVisibility().catch(console.error);
}
