import express from 'express';
import { StagehandWithBrowserTools } from './stagehand-browser-tools';

// Function to create run entry via API
async function createRunEntry(taskId: string, status: string, metadata: any = {}) {
  try {
    const response = await fetch('http://localhost:3000/api/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId,
        status,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          source: 'agent-server'
        }
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Run entry created:', result.id);
      return result;
    } else {
      console.log('⚠️ Failed to create run entry:', response.status);
    }
  } catch (error) {
    console.log('⚠️ Could not connect to frontend API for run logging:', error.message);
  }
  return null;
}

const app = express();
app.use(express.json());

let stagehand: StagehandWithBrowserTools | null = null;
let isReady = false;

const PORT = process.env.AGENT_PORT || 3456;

/**
 * Initialize Stagehand browser (no LLM)
 */
async function initializeAgent() {
  try {
    console.log(`🚀 Initializing Kaocular Browser Automation Agent`);
    
    stagehand = new StagehandWithBrowserTools({
      env: 'LOCAL',
      localBrowserLaunchOptions: {
        headless: false,  // Keep browser visible
        devtools: true,   // Show DevTools for debugging
        args: [
          '--start-maximized',  // Start browser maximized
          '--disable-blink-features=AutomationControlled',  // Hide automation
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        defaultViewport: null,  // Use full screen instead of default viewport
      },
    });

    await stagehand.init();
    await stagehand.startMonitoring();
    
    // Navigate to the test app (use TARGET_PORT from environment or default to 3000)
    const targetPort = process.env.TARGET_PORT || '3000';
    const targetUrl = `http://localhost:${targetPort}`;
    
    try {
      await stagehand.page.goto(targetUrl);
      console.log(`✅ Connected to application on port ${targetPort}`);
    } catch (error) {
      console.log(`⚠️ Failed to connect to ${targetUrl}`);
      console.log('Please ensure your application is running on the specified port.');
      throw error;
    }
    
    // Handle browser page close
    stagehand.page.on('close', () => {
      console.log('\n⚠️ Browser window was closed');
      console.log('🛑 Shutting down agent server...');
      process.exit(0);
    });
    
    isReady = true;
    console.log('✅ Agent is ready and listening on port', PORT);
    console.log('🖥️  Browser is visible and will stay open');
    console.log('📡 Waiting for commands...');
    console.log('💡 Tip: Keep the browser window open - closing it will stop the agent\n');
    
  } catch (error) {
    console.error('❌ Failed to initialize agent:', error);
    process.exit(1);
  }
}

/**
 * Execute a single browser command
 */
async function executeBrowserCommand(command: string, params: any): Promise<any> {
  if (!stagehand || !stagehand.page) {
    throw new Error('Browser not available');
  }

  const page = stagehand.page;

  switch (command.toLowerCase()) {
    case 'click':
      if (!params.selector) throw new Error('Missing selector for click command');
      console.log(`  🖱️  Clicking: ${params.selector}`);
      await page.click(params.selector, { timeout: params.timeout || 5000 });
      break;

    case 'type':
      if (!params.selector) throw new Error('Missing selector for type command');
      if (!params.text) throw new Error('Missing text for type command');
      console.log(`  ⌨️  Typing in ${params.selector}: ${params.text}`);
      await page.fill(params.selector, params.text, { timeout: params.timeout || 5000 });
      break;

    case 'navigate':
    case 'goto':
      if (!params.url) throw new Error('Missing url for navigate command');
      console.log(`  🔗 Navigating to: ${params.url}`);
      await page.goto(params.url, { 
        waitUntil: params.waitUntil || 'networkidle',
        timeout: params.timeout || 30000 
      });
      break;

    case 'wait':
      if (params.ms) {
        console.log(`  ⏳ Waiting ${params.ms}ms`);
        await page.waitForTimeout(params.ms);
      } else if (params.selector) {
        console.log(`  ⏳ Waiting for element: ${params.selector}`);
        await page.waitForSelector(params.selector, { timeout: params.timeout || 5000 });
      }
      break;

    case 'verify':
      if (!params.selector) throw new Error('Missing selector for verify command');
      console.log(`  ✓ Verifying element exists: ${params.selector}`);
      const isVisible = await page.isVisible(params.selector);
      if (!isVisible) {
        throw new Error(`Element not found or not visible: ${params.selector}`);
      }
      break;

    case 'screenshot':
      console.log(`  📸 Taking screenshot`);
      const screenshotPath = params.path || 'screenshot.png';
      await page.screenshot({ path: screenshotPath, fullPage: true });
      return { screenshot: screenshotPath };

    case 'evaluate':
      if (!params.script) throw new Error('Missing script for evaluate command');
      console.log(`  🔍 Evaluating script`);
      return await page.evaluate((script: string) => eval(script), params.script);

    case 'clear_logs':
      console.log(`  🗑️  Clearing logs`);
      stagehand.clearLogs();
      break;

    default:
      throw new Error(`Unknown command: ${command}`);
  }

  return { success: true };
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: isReady ? 'ready' : 'initializing',
    service: 'Kaocular Browser Automation Agent (Cursor-powered)',
    port: PORT
  });
});

/**
 * Execute command endpoint
 */
app.post('/execute', async (req, res) => {
  if (!isReady || !stagehand) {
    return res.status(503).json({ error: 'Agent not ready' });
  }

  // Check if browser context is still valid
  try {
    await stagehand.page.evaluate(() => true);
  } catch (error) {
    console.log('⚠️ Browser context lost, reinitializing...');
    try {
      isReady = false;
      await initializeAgent();
      console.log('✅ Agent reinitialized successfully');
    } catch (reinitError: any) {
      console.error('❌ Failed to reinitialize agent:', reinitError.message);
      isReady = false;
      return res.status(503).json({ error: 'Agent reinitialization failed: ' + reinitError.message });
    }
  }

  const { command, params = {}, instruction } = req.body;
  
  // Support both command-based and instruction-based requests for backward compatibility
  if (!command && !instruction) {
    return res.status(400).json({ error: 'Missing command or instruction' });
  }

  const taskId = `task-${Date.now()}`;
  const startTime = new Date();
  const commandName = command || instruction;

  console.log('\n📋 Received request:');
  console.log(`   Type: ${command ? 'command' : 'instruction'}`);
  console.log(`   Value: ${commandName}`);
  if (Object.keys(params).length > 0) {
    console.log(`   Params:`, params);
  }
  
  // Log run start
  await createRunEntry(taskId, 'running', {
    command: commandName,
    commandType: command ? 'structured' : 'instruction',
    startTime: startTime.toISOString()
  });
  
  try {
    // Ensure page is available
    console.log('🔄 Checking page status...');
    try {
      const currentUrl = await stagehand.page.url();
      console.log(`📍 Current page: ${currentUrl}`);
    } catch (pageError: any) {
      console.log('⚠️ Page not responsive, attempting reconnect...');
      const targetPort = process.env.TARGET_PORT || '3000';
      const targetUrl = `http://localhost:${targetPort}`;
      await stagehand.page.goto(targetUrl, { waitUntil: 'networkidle' });
      console.log(`✅ Reconnected to application`);
    }
    
    // Clear previous logs
    stagehand.clearLogs();
    
    console.log('🚀 Executing command...');
    
    let result: any;
    if (command) {
      // Structured command execution
      result = await executeBrowserCommand(command, params);
    } else {
      // For backward compatibility: treat instruction as a simple command
      // Cursor should send properly formatted commands instead
      console.log('⚠️ Instruction-based execution deprecated. Please use command format.');
      result = { 
        success: false, 
        error: 'Use structured command format: { command, params }' 
      };
      throw new Error('Instruction format deprecated, use commands');
    }
    
    // Collect results
    const consoleLogs = stagehand.getConsoleLogs();
    const networkLogs = stagehand.getNetworkLogs();
    const failedRequests = stagehand.getFailedRequests();
    const storageData = await stagehand.getStorageData();
    
    console.log('✅ Command executed successfully');
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    // Log successful completion
    await createRunEntry(taskId, 'completed', {
      command: commandName,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      consoleLogs: consoleLogs.length,
      networkRequests: networkLogs.length,
      failedRequests: failedRequests.length
    });
    
    res.json({
      success: true,
      taskId,
      duration,
      result,
      logs: {
        console: consoleLogs,
        network: networkLogs.length,
        failedRequests: failedRequests,
        storage: storageData
      }
    });
    
  } catch (error: any) {
    console.error('❌ Execution failed:', error.message);
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    // Log failed completion
    await createRunEntry(taskId, 'failed', {
      command: commandName,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      error: error.message
    });
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      taskId,
      duration
    });
  }
});

/**
 * Legacy /test endpoint for backward compatibility
 */
app.post('/test', async (req, res) => {
  // Redirect to /execute with instruction as a note
  res.status(501).json({
    error: 'Legacy /test endpoint deprecated',
    message: 'Use /execute with structured commands: { command, params }',
    example: {
      command: 'click',
      params: { selector: 'button.login' }
    }
  });
});

/**
 * Get current logs endpoint
 */
app.get('/logs', async (req, res) => {
  if (!stagehand) {
    return res.status(503).json({ error: 'Agent not ready' });
  }
  
  const consoleLogs = stagehand.getConsoleLogs();
  const networkLogs = stagehand.getNetworkLogs();
  const failedRequests = stagehand.getFailedRequests();
  const storageData = await stagehand.getStorageData();
  
  res.json({
    console: consoleLogs,
    network: networkLogs,
    failedRequests: failedRequests,
    storage: storageData
  });
});

/**
 * Shutdown endpoint
 */
app.post('/shutdown', async (req, res) => {
  console.log('🛑 Shutting down agent...');
  
  if (stagehand) {
    await stagehand.close();
  }
  
  res.json({ message: 'Agent shutdown initiated' });
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

// Start the server
app.listen(PORT, () => {
  console.log(`🌐 Kaocular Agent Server starting on http://localhost:${PORT}`);
  initializeAgent();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  if (stagehand) {
    await stagehand.close();
  }
  process.exit(0);
});
