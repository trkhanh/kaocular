# 🤖 Agent Server System Usage Guide

## Overview

The Agent Server System allows you to run Stagehand as a persistent service and send test commands to it via CLI. This provides better control and flexibility for testing web applications.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Next.js    │────▶│ Agent Server │────▶│   Browser    │
│    App      │     │  (Port 3456) │     │  (Automated) │
└─────────────┘     └─────────────┘     └──────────────┘
                           ▲
                           │
                    ┌──────────────┐
                    │ Agent Client │
                    │ (CLI Commands)│
                    └──────────────┘
```

## Prerequisites

Before using the agent scripts, ensure you have:
1. **tsx installed globally**: `npm install -g tsx` or `pnpm add -g tsx`
2. **Dependencies installed**: `pnpm install` or `npm install`
3. **Environment configured**: `.env` file with your API keys

## Quick Start

### Step 1: Start the Next.js App
```bash
pnpm dev:next
```
Wait for "Ready" message

### Step 2: Start the Agent Server
```bash
# Unix/Mac/Linux
./agent.sh --run

# Windows
agent.bat --run
```
This will:
- Initialize Stagehand with browser tools
- **Open a visible browser window** (maximized with DevTools)
- Navigate to http://localhost:3000
- Start listening on port 3456 for test commands
- **Keep the browser open** until you stop the server

⚠️ **Important**: The browser window will stay visible and open. Don't close it manually - use Ctrl+C in the terminal or the shutdown command to stop the agent properly.

### Step 3: Send Test Commands
In a new terminal:
```bash
# Unix/Mac/Linux
./agent.sh --test "Click the Test Console button"
./agent.sh --test -context "Testing forms" "Fill and submit the form"

# Windows
agent.bat --test "Click the Test Console button"
agent.bat --test -context "Testing forms" "Fill and submit the form"
```

## Command Reference

### Starting the Server

```bash
# Unix/Mac/Linux
./agent.sh --run

# Windows
agent.bat --run
```

### Sending Test Commands

#### Basic Syntax
```bash
# Unix/Mac/Linux
./agent.sh --test "<instruction>"

# Windows
agent.bat --test "<instruction>"
```

#### With Context
```bash
# Unix/Mac/Linux
./agent.sh --test -context "<context>" "<instruction>"

# Windows
agent.bat --test -context "<context>" "<instruction>"
```

The context is prepended to your instruction and helps provide additional information to the agent.

## Examples

### Example 1: Testing Console Logs
```bash
# Unix/Mac/Linux
./agent.sh --test "Click the Test Console button and enter 'Hello World' in the input field"

# Windows
agent.bat --test "Click the Test Console button and enter 'Hello World' in the input field"
```

### Example 2: Form Testing with Context
```bash
# Unix/Mac/Linux
./agent.sh --test -context "User is testing form validation" "Fill the form with invalid email and submit, then check for error messages"

# Windows
agent.bat --test -context "User is testing form validation" "Fill the form with invalid email and submit, then check for error messages"
```

### Example 3: Storage Testing
```bash
# Unix/Mac/Linux
./agent.sh --test "Set localStorage item with key 'user' and value 'John Doe' using the storage form"

# Windows
agent.bat --test "Set localStorage item with key 'user' and value 'John Doe' using the storage form"
```

### Example 4: Navigation Testing
```bash
# Unix/Mac/Linux
./agent.sh --test -context "User wants to test navigation" "Click all buttons on the page and verify they work"

# Windows
agent.bat --test -context "User wants to test navigation" "Click all buttons on the page and verify they work"
```

### Example 5: Error Handling
```bash
# Unix/Mac/Linux
./agent.sh --test -context "Testing error handling" "Click the Test Broken API button and verify error is displayed"

# Windows
agent.bat --test -context "Testing error handling" "Click the Test Broken API button and verify error is displayed"
```

## What Happens During a Test

1. **Page Refresh**: The agent always refreshes the page first
2. **Log Clearing**: Previous logs are cleared
3. **Context Application**: If provided, context is added to the instruction
4. **Task Execution**: Agent executes the instruction
5. **Result Collection**: Console logs, network requests, and storage data are collected
6. **Error Saving**: Failed requests are saved to timestamped text files

## Output

After each test, you'll see:
- Number of console logs captured
- Number of network requests made
- Summary of failed requests
- Path to saved error file (if any)
- Storage data changes

## Advanced Usage

### Custom Port
```bash
AGENT_PORT=4567 pnpm agent --run
AGENT_SERVER_URL=http://localhost:4567 pnpm agent --test "Click button"
```

### Checking Server Status
```bash
curl http://localhost:3456/health
```

### Getting Current Logs
```bash
curl http://localhost:3456/logs
```

### Shutting Down Server
```bash
curl -X POST http://localhost:3456/shutdown
```
Or just press Ctrl+C in the server terminal

## Troubleshooting

### "Agent server is not ready"
- Make sure you ran `pnpm agent --run` first
- Check if port 3456 is available
- Verify your API keys are set in `.env`

### "Cannot connect to localhost:3000"
- Ensure Next.js is running: `pnpm dev:next`
- Check if port 3000 is available

### "Test execution failed"
- Check the browser window for visual errors
- Look at the agent server terminal for detailed logs
- Review the saved failed-requests.txt file

## Best Practices

1. **Always start Next.js first** before the agent server
2. **Use descriptive contexts** to help the agent understand the scenario
3. **Be specific in instructions** - the more detailed, the better
4. **Check failed request files** for debugging API errors
5. **Watch the browser** to see what the agent is doing
6. **Keep instructions focused** on one task at a time

## Testing Workflow Example

```bash
# Terminal 1
pnpm dev:next

# Terminal 2 
pnpm agent --run

# Terminal 3 - Run your test suite
pnpm agent --test "Navigate to homepage"
pnpm agent --test -context "User logged in" "Click on dashboard link"
pnpm agent --test -context "Testing user profile" "Update profile name to 'Jane Doe'"
pnpm agent --test -context "Testing logout" "Click logout and verify redirect to login"
```

## Integration with CI/CD

You can integrate this into your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Start Next.js
  run: pnpm dev:next &
  
- name: Start Agent Server
  run: pnpm agent --run &
  
- name: Wait for services
  run: sleep 10
  
- name: Run Tests
  run: |
    pnpm agent --test "Test login flow"
    pnpm agent --test "Test checkout process"
    pnpm agent --test "Test error handling"
```
