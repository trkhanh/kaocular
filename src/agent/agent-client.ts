import fetch from 'node-fetch';

const SERVER_URL = process.env.AGENT_SERVER_URL || 'http://localhost:3456';

interface TestOptions {
  context?: string;
  instruction: string;
}

/**
 * Check if the agent server is ready
 */
async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    const data = await response.json() as any;
    return data.status === 'ready';
  } catch (error) {
    return false;
  }
}

/**
 * Format failed request for terminal output
 */
function formatFailedRequest(request: any, index: number): string {
  let output = `--- Request #${index + 1} ---\n`;
  output += `URL: ${request.url}\n`;
  output += `Status: ${request.status} ${request.statusText || ''}\n`;
  output += `Method: ${request.method || 'N/A'}\n`;
  output += `Timestamp: ${request.timestamp}\n`;
  output += `Type: ${request.type}\n`;
  
  if (request.headers) {
    output += '\nHeaders:\n';
    Object.entries(request.headers).forEach(([key, value]) => {
      output += `  ${key}: ${value}\n`;
    });
  }
  
  if (request.postData) {
    output += '\nRequest Body:\n';
    try {
      const parsed = JSON.parse(request.postData);
      output += JSON.stringify(parsed, null, 2) + '\n';
    } catch {
      output += request.postData + '\n';
    }
  }
  
  if (request.responseBody) {
    output += '\nResponse Body:\n';
    try {
      const parsed = JSON.parse(request.responseBody);
      output += JSON.stringify(parsed, null, 2) + '\n';
    } catch {
      output += request.responseBody + '\n';
    }
  }
  
  output += '\n' + '='.repeat(50) + '\n';
  return output;
}

/**
 * Send a test command to the agent server
 */
async function sendTest(options: TestOptions) {
  try {
    // Check if server is ready
    const isReady = await checkHealth();
    if (!isReady) {
      console.error('❌ Agent server is not ready. Please run: pnpm agent --run');
      process.exit(1);
    }
    
    console.log('📡 Sending test command to agent...\n');
    
    const response = await fetch(`${SERVER_URL}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
    
    const result = await response.json() as any;
    
    if (result.success) {
      console.log('✅ Test completed successfully\n');
      
      // Display agent messages if available
      if (result.agentMessages && result.agentMessages.length > 0) {
        console.log('🤖 Agent Messages:');
        console.log('='.repeat(50));
        result.agentMessages.forEach((msg: any) => {
          if (typeof msg === 'string') {
            console.log(msg);
          } else if (msg.content) {
            console.log(msg.content);
          } else {
            console.log(JSON.stringify(msg, null, 2));
          }
        });
        console.log('='.repeat(50));
        console.log('');
      }
      
      // Display agent steps if available
      if (result.agentSteps) {
        console.log('👣 Agent Steps Taken:');
        console.log('='.repeat(50));
        if (typeof result.agentSteps === 'string') {
          console.log(result.agentSteps);
        } else if (Array.isArray(result.agentSteps)) {
          result.agentSteps.forEach((step: any, i: number) => {
            console.log(`Step ${i + 1}: ${JSON.stringify(step, null, 2)}`);
          });
        } else {
          console.log(JSON.stringify(result.agentSteps, null, 2));
        }
        console.log('='.repeat(50));
        console.log('');
      }
      
      if (result.logs) {
        // Display summary statistics
        const failedRequestsArray = Array.isArray(result.logs.failedRequests) 
          ? result.logs.failedRequests 
          : [];
          
        console.log('📊 Test Statistics:');
        console.log(`   Console logs: ${result.logs.console?.length || 0}`);
        console.log(`   Network requests: ${result.logs.network || 0}`);
        console.log(`   Failed requests: ${failedRequestsArray.length}`);
        console.log('');
        
        // Show detailed failed requests if any
        if (failedRequestsArray.length > 0) {
          console.log('\n⚠️ FAILED NETWORK REQUESTS REPORT');
          console.log('='.repeat(50));
          console.log(`Generated: ${new Date().toISOString()}`);
          console.log(`Total Failed Requests: ${failedRequestsArray.length}`);
          console.log('='.repeat(50));
          console.log('');
          
          failedRequestsArray.forEach((request: any, index: number) => {
            console.log(formatFailedRequest(request, index));
          });
        }
        
        // Show storage data with details
        if (result.logs.storage) {
          console.log('🗄️ Storage Data:');
          const localStorageKeys = Object.keys(result.logs.storage.localStorage || {});
          console.log(`   LocalStorage items: ${localStorageKeys.length}`);
          if (localStorageKeys.length > 0) {
            console.log('   LocalStorage contents:');
            Object.entries(result.logs.storage.localStorage || {}).forEach(([key, value]) => {
              console.log(`     ${key}: ${value}`);
            });
          }
          
          const cookies = result.logs.storage.cookies || [];
          console.log(`   Cookies: ${cookies.length}`);
          if (cookies.length > 0) {
            console.log('   Cookie details:');
            cookies.forEach((cookie: any) => {
              console.log(`     ${cookie.name}: ${cookie.value}`);
            });
          }
        }
      }
    } else {
      console.error('❌ Test failed:', result.error);
    }
    
  } catch (error: any) {
    console.error('❌ Failed to connect to agent server:', error.message);
    console.log('\n💡 Make sure the agent is running: ./agent.sh --run');
    process.exit(1);
  }
}

/**
 * Get current logs from the agent
 */
async function getLogs() {
  try {
    const response = await fetch(`${SERVER_URL}/logs`);
    const logs = await response.json();
    
    console.log('📊 Current Agent Logs:');
    console.log(JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('❌ Failed to get logs:', error);
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): TestOptions | null {
  const args = process.argv.slice(2);
  
  let context: string | undefined;
  let instruction: string | undefined;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-context' && i + 1 < args.length) {
      context = args[i + 1];
      i++;
    } else if (!instruction) {
      // Everything else is the instruction
      instruction = args.slice(i).join(' ');
      break;
    }
  }
  
  if (!instruction) {
    console.error('❌ Missing instruction. Usage:');
    console.error('   pnpm agent --test "click the button"');
    console.error('   pnpm agent --test -context "User is logged in" "navigate to dashboard"');
    return null;
  }
  
  return { context, instruction };
}

// Main execution
async function main() {
  const options = parseArgs();
  
  if (!options) {
    process.exit(1);
  }
  
  await sendTest(options);
}

if (require.main === module) {
  main().catch(console.error);
}
