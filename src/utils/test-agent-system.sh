#!/bin/bash

# Test script for the agent system

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "═══════════════════════════════════════════════════════════"
echo "       Testing Stagehand Agent System"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Step 1: Check if Next.js is running
echo "Step 1: Checking if Next.js is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Next.js is running"
else
    echo "❌ Next.js is not running"
    echo "Please run 'pnpm dev:next' in another terminal first"
    exit 1
fi

# Step 2: Check if agent server is running
echo ""
echo "Step 2: Checking agent server..."
if curl -s http://localhost:3456/health > /dev/null; then
    echo "✅ Agent server is already running"
else
    echo "⚠️ Agent server is not running"
    echo "Please run './agent.sh --run' in another terminal"
    echo "Waiting for you to start it..."
    
    # Wait for user to start the server
    while ! curl -s http://localhost:3456/health > /dev/null; do
        sleep 2
    done
    echo "✅ Agent server detected!"
fi

# Step 3: Run test commands
echo ""
echo "Step 3: Running test commands..."
echo ""

# Test 1: Simple click
echo "Test 1: Testing console button..."
"$SCRIPT_DIR/agent.sh" --test "Click on the Test Console button"
sleep 2

# Test 2: With context
echo ""
echo "Test 2: Testing form with context..."
"$SCRIPT_DIR/agent.sh" --test -context "Testing the form submission feature" "Fill the form with name 'Test User', email 'test@example.com', message 'Hello World' and submit it"
sleep 2

# Test 3: Storage test
echo ""
echo "Test 3: Testing localStorage..."
"$SCRIPT_DIR/agent.sh" --test "Set a localStorage item with key 'testKey' and value 'testValue' using the storage form"
sleep 2

# Test 4: Error handling
echo ""
echo "Test 4: Testing error handling..."
"$SCRIPT_DIR/agent.sh" --test -context "We expect this to generate errors" "Click the Test Broken API button"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "       All tests completed!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Check the generated failed-requests.txt files for error details"
