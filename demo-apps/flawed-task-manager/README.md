# 🚨 Flawed Task Manager

A deliberately buggy task management application designed to test the Agent System's debugging capabilities.

## 🎯 Purpose

This application contains **10 intentional bugs** across the frontend, backend, and system architecture. It serves as a controlled testing environment for the Agent System to practice identifying, diagnosing, and reporting common web application issues.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open in browser:**
   Navigate to http://localhost:3001

4. **Test with Agent System:**
   ```bash
   cd ../../
   ./agent.sh --test "Test the task manager and find any issues"
   ```

## 🐛 Intentional Bugs

### Backend Issues (6 bugs)
1. **Random API Failures** - GET /api/tasks fails 10% of the time
2. **Missing Input Validation** - Accepts empty/null task titles
3. **Server Crashes** - PUT requests crash on invalid task IDs
4. **Fake Deletion** - DELETE doesn't actually remove tasks
5. **No Error Handling** - Server startup lacks error handling
6. **Unhandled Promises** - Deliberate unhandled promise rejection

### Frontend Issues (4 bugs)
7. **Poor Error Messages** - Generic, unhelpful error feedback
8. **Null Value Display** - Doesn't handle undefined task titles
9. **No Client Validation** - Allows invalid form submissions
10. **State Inconsistency** - UI and server state get out of sync

## 🎮 Features

- **Task Creation** - Add tasks with title and priority
- **Task Toggle** - Mark tasks complete/incomplete
- **Task Deletion** - Remove tasks (but not really!)
- **Bug Triggers** - Buttons to manually trigger specific issues

## 🧪 Testing Scenarios

### Basic Functionality
- Create a new task
- Toggle task completion
- Delete a task
- Reload page and verify persistence

### Bug Discovery
- Use "Bug Trigger" buttons to cause specific issues
- Try creating tasks without titles
- Attempt to toggle non-existent tasks
- Delete tasks and check if they're really gone

### Error Handling
- Trigger random API errors
- Submit invalid data
- Test edge cases and boundary conditions

## 🎯 Expected Agent Discoveries

The Agent System should identify:
- ✅ API reliability issues
- ✅ Input validation problems
- ✅ Error handling deficiencies
- ✅ Data persistence issues
- ✅ UI/UX inconsistencies
- ✅ Server stability problems

## 📋 Agent Test Commands

### Comprehensive Testing
```bash
./agent.sh --test -context "Testing flawed task manager with known bugs. App has intentional issues in validation, error handling, and data persistence." "Create several tasks, toggle their completion, delete some tasks, then reload the page to verify everything works correctly"
```

### Specific Bug Hunting
```bash
./agent.sh --test -context "Looking for validation bugs in task creation" "Try to create tasks with empty titles and see what happens"

./agent.sh --test -context "Testing data persistence" "Create a task, delete it, then reload the page to see if it's really gone"

./agent.sh --test -context "Testing error handling" "Click the 'Trigger Random API Error' button multiple times"
```

### Edge Case Testing
```bash
./agent.sh --test -context "Testing edge cases and error conditions" "Use all the bug trigger buttons and observe what happens"
```

## 📊 Success Metrics

The Agent System is successful if it:
- Identifies at least 7 out of 10 intentional bugs
- Reports specific error conditions and their causes
- Suggests potential fixes or improvements
- Recognizes inconsistent application behavior

## 🔧 Technical Details

- **Framework**: Vanilla HTML/CSS/JavaScript + Express.js
- **Port**: 3001 (configured for Agent System testing)
- **Storage**: In-memory (data lost on restart)
- **Dependencies**: Express, CORS

## ⚠️ Important Notes

- This app is **intentionally broken** - don't use it for real tasks!
- Every bug is designed to be discoverable by automated testing
- The app runs on port 3001 specifically for Agent System integration
- Data is stored in memory and will be lost when the server restarts

---

Happy bug hunting! 🕵️‍♂️
