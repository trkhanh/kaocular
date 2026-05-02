const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001; // This will be the port the agent tests

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage (intentionally flawed - will lose data on restart)
let tasks = [
  { id: 1, title: 'Sample Task', completed: false, priority: 'medium' },
  { id: 2, title: 'Another Task', completed: true, priority: 'high' }
];
let nextId = 3;

// INTENTIONAL BUG #1: Missing error handling
app.get('/api/tasks', (req, res) => {
  // Sometimes this will randomly fail to simulate server issues
  if (Math.random() < 0.1) {
    throw new Error('Random server error!');
  }
  res.json(tasks);
});

// INTENTIONAL BUG #2: No validation on task creation
app.post('/api/tasks', (req, res) => {
  const { title, priority } = req.body;
  
  // No validation - will create tasks with undefined/null values
  const newTask = {
    id: nextId++,
    title: title, // Could be undefined
    completed: false,
    priority: priority || 'low' // At least has a default
  };
  
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// INTENTIONAL BUG #3: No error handling for invalid IDs
app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);
  
  // Will crash if task not found
  task.completed = !task.completed;
  res.json(task);
});

// INTENTIONAL BUG #4: Memory leak - never actually deletes
app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  // Pretends to delete but doesn't actually remove from array
  res.status(204).send();
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚨 Flawed Task Manager running on http://localhost:${PORT}`);
  console.log('⚠️  This app contains intentional bugs for testing purposes!');
});

// INTENTIONAL BUG #5: Unhandled promise rejection
setTimeout(() => {
  Promise.reject(new Error('Unhandled promise rejection'));
}, 5000);