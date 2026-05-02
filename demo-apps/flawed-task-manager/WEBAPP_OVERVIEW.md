# Flawed Task Manager - Comprehensive Overview

## 🎯 Purpose & Core Functionality
- **Primary Goal**: A deliberately flawed task management application designed to test the Agent System's debugging capabilities
- **Target Users**: Developers testing the Agent System's ability to identify and diagnose common web application issues
- **Key Value Proposition**: Provides a controlled environment with known bugs for testing automated debugging tools

## 🏗️ Architecture Overview
- **Frontend**: Vanilla HTML/CSS/JavaScript with intentional client-side issues
- **Backend**: Express.js server with deliberate API flaws and error conditions
- **Data Flow**: Simple REST API with in-memory storage (no persistence)
- **Key Integrations**: None (standalone application)

## 🎮 Core Features & User Flows

### Feature 1: Task Creation
- **Purpose**: Allow users to create new tasks with title and priority
- **User Flow**: Enter task title → Select priority → Click "Add Task" → Task appears in list
- **Technical Implementation**: POST /api/tasks endpoint with JSON payload
- **Dependencies**: None
- **Edge Cases**: Empty titles, missing priority, server errors

### Feature 2: Task Toggle (Complete/Incomplete)
- **Purpose**: Mark tasks as completed or incomplete
- **User Flow**: Click "Complete" button → Task status changes → UI updates
- **Technical Implementation**: PUT /api/tasks/:id endpoint
- **Dependencies**: Task must exist
- **Edge Cases**: Non-existent task IDs, server crashes

### Feature 3: Task Deletion
- **Purpose**: Remove tasks from the list
- **User Flow**: Click "Delete" button → Task disappears from UI
- **Technical Implementation**: DELETE /api/tasks/:id endpoint (intentionally broken)
- **Dependencies**: Task must exist in UI
- **Edge Cases**: Fake deletion (doesn't actually remove from server)

### Feature 4: Bug Trigger Buttons
- **Purpose**: Manually trigger specific bugs for testing
- **User Flow**: Click trigger button → Bug manifests → Agent can observe issue
- **Technical Implementation**: JavaScript functions that cause specific problems
- **Dependencies**: Various API endpoints and client-side code
- **Edge Cases**: All triggers are designed to cause edge cases

## 🎯 Domain-Specific Knowledge

### Task Management Rules & Logic
- **Core Concepts**: 
  - Tasks have ID, title, completion status, and priority
  - Priority levels: high, medium, low
  - Tasks can be created, toggled, and "deleted"

- **Business Rules**:
  - Tasks should have meaningful titles (but validation is intentionally missing)
  - Priority should be selected (but defaults to low if missing)
  - Completed tasks should be visually distinct
  - Deleted tasks should be removed from both UI and server (but server deletion is broken)

- **Common Scenarios**:
  - Create task with title and priority
  - Mark task as complete/incomplete
  - Delete unwanted tasks
  - Handle server errors gracefully

- **Edge Cases** (All Intentionally Broken):
  - Empty or null task titles
  - Server randomly returning errors
  - Non-existent task operations
  - Memory leaks and unhandled promises
  - UI/server state inconsistencies

- **Validation Rules** (Intentionally Missing):
  - Task titles should not be empty
  - Task IDs should exist before operations
  - Server errors should be handled gracefully
  - Client-side validation should prevent invalid submissions

## 🔧 Technical Implementation Details

### Database Schema
- **Key Tables**: None (in-memory array)
- **Relationships**: None
- **Constraints**: None (intentionally missing)

### API Endpoints
- **GET /api/tasks**: Retrieve all tasks (randomly fails 10% of the time)
- **POST /api/tasks**: Create new task (no validation)
- **PUT /api/tasks/:id**: Toggle task completion (crashes on invalid ID)
- **DELETE /api/tasks/:id**: "Delete" task (doesn't actually delete)

### State Management
- **Frontend State**: Local array synchronized with server (poorly)
- **Backend State**: In-memory array, lost on restart
- **Real-time Updates**: None

## 🧪 Testing Strategy

### Critical User Flows to Test
- **Flow 1**: Create task → Verify it appears → Toggle completion → Verify status change
- **Flow 2**: Create multiple tasks → Delete one → Reload page → Verify deletion persistence
- **Flow 3**: Trigger random errors → Verify error handling and user feedback

### Edge Cases to Always Test
- Creating tasks with empty titles
- Toggling non-existent tasks
- Deleting tasks and checking persistence
- Server error scenarios
- Client-side validation failures

### Integration Points
- REST API endpoints
- Client-server state synchronization
- Error handling and user feedback

## 🚨 Intentional Issues & Bugs

### Backend Issues (server.js)
1. **Missing Error Handling**: Random 10% failure rate on GET /api/tasks
2. **No Input Validation**: POST endpoint accepts undefined/null values
3. **Crash on Invalid ID**: PUT endpoint crashes when task not found
4. **Fake Deletion**: DELETE endpoint doesn't actually remove tasks
5. **No Server Error Handling**: Server startup has no error handling
6. **Unhandled Promise Rejection**: Deliberate unhandled promise after 5 seconds

### Frontend Issues (index.html)
7. **Poor Error Handling**: Generic error messages, no user guidance
8. **Null/Undefined Display**: Doesn't handle undefined task titles properly
9. **No Client Validation**: Allows empty task submissions
10. **UI/Server Inconsistency**: UI removes deleted tasks but server keeps them

### System Issues
- **Data Persistence**: In-memory storage loses data on restart
- **No Logging**: No proper error logging or monitoring
- **No Rate Limiting**: API has no protection against abuse
- **Security**: No input sanitization or validation

## 🎯 Expected Agent Behavior

The Agent System should be able to:

### Identify Issues
- Detect when API calls fail randomly
- Notice tasks with empty/undefined titles
- Observe server crashes on invalid operations
- Discover that deleted tasks reappear after page reload

### Test Scenarios
- **Scenario 1**: "Create a new task and verify it works" → Should discover validation issues
- **Scenario 2**: "Delete a task and confirm it's gone" → Should find fake deletion bug
- **Scenario 3**: "Test error handling" → Should trigger and identify poor error messages
- **Scenario 4**: "Complete all user flows" → Should discover multiple integration issues

### Success Metrics
- **Functional**: Agent identifies at least 5 of the 10 intentional bugs
- **Error Detection**: Agent notices when operations fail or behave unexpectedly
- **User Experience**: Agent recognizes poor error messages and UX issues
- **Data Consistency**: Agent discovers UI/server state inconsistencies

## 📊 How to Use This App for Testing

### 1. Start the Application
```bash
cd demo-apps/flawed-task-manager
npm start
```
Application runs on http://localhost:3001

### 2. Test with Agent System
```bash
cd ../../
./agent.sh --test -context "Testing flawed task manager app on localhost:3001. 
App Purpose: Task management with intentional bugs for testing
Features: Create tasks, toggle completion, delete tasks, bug trigger buttons
Known Issues: Random API failures, missing validation, fake deletions
Expected: Agent should identify multiple bugs and inconsistencies" "Create a new task, toggle its completion, then delete it and verify everything works correctly"
```

### 3. Trigger Specific Bugs
Use the bug trigger buttons or test specific scenarios:
- Create task without title
- Toggle non-existent task
- Delete task and reload to see it's still there
- Trigger random API errors

### 4. Observe Agent Behavior
The agent should:
- Notice when operations fail
- Identify inconsistent behavior
- Report specific issues found
- Suggest potential solutions

---

**Remember**: This app is intentionally broken. Every bug is designed to be discoverable by the Agent System. The agent's job is to find these issues and help debug them!
