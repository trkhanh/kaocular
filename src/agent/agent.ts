#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

/**
 * Main agent CLI
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }
  
  const command = args[0];
  
  switch (command) {
    case '--run':
    case '-r':
      runAgentServer();
      break;
      
    case '--test':
    case '-t':
      runAgentTest(args.slice(1));
      break;
      
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

/**
 * Start the agent server
 */
function runAgentServer() {
  console.log('🚀 Starting agent server...\n');
  
  const serverPath = path.join(__dirname, 'agent-server.ts');
  const child = spawn('tsx', [serverPath], {
    stdio: 'inherit',
    shell: true,
  });
  
  child.on('error', (error) => {
    console.error('Failed to start agent server:', error);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Agent server exited with code ${code}`);
      process.exit(code || 1);
    }
  });
}

/**
 * Send test command to agent
 */
function runAgentTest(args: string[]) {
  const clientPath = path.join(__dirname, 'agent-client.ts');
  const child = spawn('tsx', [clientPath, ...args], {
    stdio: 'inherit',
    shell: true,
  });
  
  child.on('error', (error) => {
    console.error('Failed to run test:', error);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     Circular - Cursor-Powered Browser Automation Agent        ║
╚════════════════════════════════════════════════════════════════╝

Usage: pnpm agent [command] [options]

Commands:
  --run, -r           Start the browser automation server
  --test, -t          Send test command to running agent (legacy)
  --help, -h          Show this help message

⚠️  Note: This version is optimized for Cursor integration.
    Use /execute endpoint with structured commands instead of --test.

Command Format (via HTTP):
  POST /execute
  {
    "command": "click|type|navigate|wait|verify|screenshot|evaluate",
    "params": { ... }
  }

Examples:
  # Start the agent server (Terminal 1)
  pnpm agent --run
  
  # Send HTTP request (e.g., from Cursor)
  curl -X POST http://localhost:3456/execute \\
    -H "Content-Type: application/json" \\
    -d '{"command": "click", "params": {"selector": "button.login"}}'
  
  # Available commands:
  # click:     { selector, timeout? }
  # type:      { selector, text, timeout? }
  # navigate:  { url, waitUntil?, timeout? }
  # wait:      { ms? } or { selector, timeout? }
  # verify:    { selector, timeout? }
  # screenshot: { path? }
  # evaluate:  { script }

Requirements:
  1. The target application must be running
  2. Start the agent server (--run)
  3. Send commands via HTTP to port 3456
  4. Keep the browser window open

Environment Variables:
  AGENT_PORT          Port for agent server (default: 3456)
  TARGET_PORT         Port of target application (default: 3000)
`);
}

// Run the CLI
if (require.main === module) {
  main();
}
