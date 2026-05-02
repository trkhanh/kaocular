import { Task, TaskRun, Solution, DashboardStats, BrowserLog, NetworkLog, LogEntry } from '@/types'

// Mock data that integrates with the Stagehand browser tools structure
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    name: 'Login Flow Test',
    description: 'Test the complete user login flow including form validation and error handling',
    status: 'completed',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T14:30:00Z'),
    totalRuns: 25,
    successfulRuns: 23,
    failedRuns: 2,
    tags: ['authentication', 'forms', 'critical'],
    lastRunAt: new Date('2024-01-15T14:30:00Z'),
    averageRunTime: 12500,
  },
  {
    id: 'task-2',
    name: 'E-commerce Checkout',
    description: 'Validate the complete checkout process including payment flow',
    status: 'running',
    createdAt: new Date('2024-01-14T09:15:00Z'),
    updatedAt: new Date('2024-01-15T11:45:00Z'),
    totalRuns: 18,
    successfulRuns: 15,
    failedRuns: 2,
    tags: ['payments', 'checkout', 'critical', 'e-commerce'],
    lastRunAt: new Date('2024-01-15T11:45:00Z'),
    averageRunTime: 28750,
  },
  {
    id: 'task-3',
    name: 'API Integration Test',
    description: 'Test all API endpoints for data consistency and error handling',
    status: 'failed',
    createdAt: new Date('2024-01-13T16:20:00Z'),
    updatedAt: new Date('2024-01-15T09:10:00Z'),
    totalRuns: 8,
    successfulRuns: 5,
    failedRuns: 3,
    tags: ['api', 'integration', 'backend'],
    lastRunAt: new Date('2024-01-15T09:10:00Z'),
    averageRunTime: 8200,
  },
]

export const mockRuns: TaskRun[] = [
  {
    id: 'run-1',
    taskId: 'task-1',
    status: 'completed',
    startedAt: new Date('2024-01-15T14:25:00Z'),
    completedAt: new Date('2024-01-15T14:30:00Z'),
    duration: 300000, // 5 minutes
    logs: [
      {
        id: 'log-1',
        runId: 'run-1',
        message: 'Starting login flow test',
        timestamp: new Date('2024-01-15T14:25:00Z'),
        tags: ['authentication', 'test-start'],
      },
      {
        id: 'log-2',
        runId: 'run-1',
        message: 'Navigating to login page',
        timestamp: new Date('2024-01-15T14:25:15Z'),
        tags: ['navigation', 'login-page'],
      },
      {
        id: 'log-3',
        runId: 'run-1',
        message: 'Filling login form with test credentials',
        timestamp: new Date('2024-01-15T14:26:00Z'),
        tags: ['form-filling', 'credentials'],
      },
      {
        id: 'log-4',
        runId: 'run-1',
        message: 'Login successful, redirected to dashboard',
        timestamp: new Date('2024-01-15T14:28:30Z'),
        tags: ['success', 'redirect', 'dashboard'],
      },
    ],
    consoleOutputs: [
      {
        id: 'console-1',
        type: 'log',
        text: 'User authenticated successfully',
        timestamp: new Date('2024-01-15T14:28:30Z'),
        args: ['user-id', '12345'],
      },
      {
        id: 'console-2',
        type: 'info',
        text: 'Dashboard loaded',
        timestamp: new Date('2024-01-15T14:28:45Z'),
      },
    ],
    networkRequests: [
      {
        id: 'network-1',
        type: 'request',
        method: 'POST',
        url: 'https://api.example.com/auth/login',
        headers: { 'Content-Type': 'application/json' },
        postData: '{"username":"test@example.com","password":"***"}',
        timestamp: new Date('2024-01-15T14:26:30Z'),
      },
      {
        id: 'network-2',
        type: 'response',
        url: 'https://api.example.com/auth/login',
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        responseBody: '{"token":"jwt-token","user":{"id":"12345","email":"test@example.com"}}',
        timestamp: new Date('2024-01-15T14:26:35Z'),
        duration: 150,
      },
    ],
    tags: ['authentication', 'success'],
  },
  {
    id: 'run-2',
    taskId: 'task-2',
    status: 'running',
    startedAt: new Date('2024-01-15T11:45:00Z'),
    logs: [
      {
        id: 'log-5',
        runId: 'run-2',
        message: 'Starting checkout flow test',
        timestamp: new Date('2024-01-15T11:45:00Z'),
        tags: ['checkout', 'test-start', 'e-commerce'],
      },
      {
        id: 'log-6',
        runId: 'run-2',
        message: 'Payment gateway taking longer than expected',
        timestamp: new Date('2024-01-15T11:50:00Z'),
        tags: ['payment', 'timeout', 'performance'],
        issue: {
          id: 'issue-1',
          title: 'Payment Gateway Timeout',
          description: 'Payment gateway response time exceeded threshold during checkout',
          fullText: 'During the checkout flow test, the payment gateway response time exceeded the expected threshold of 5 seconds. This could indicate network latency, payment provider issues, or insufficient server resources.',
          severity: 'high',
          category: 'performance',
          tags: ['payment', 'timeout', 'performance', 'api'],
          detectedAt: new Date('2024-01-15T11:50:00Z'),
          context: {
            url: 'https://example.com/checkout/payment',
            selector: '#payment-form',
            userAction: 'Submit payment form',
            expectedBehavior: 'Payment should process within 5 seconds',
            actualBehavior: 'Payment processing took 12 seconds',
            browserInfo: 'Chrome 120.0.0.0 on macOS',
          }
        },
        solution: {
          id: 'solution-1',
          issueId: 'issue-1',
          title: 'Implement Payment Retry with Exponential Backoff',
          description: 'Comprehensive solution for payment timeout issues',
          fullText: 'To resolve the payment gateway timeout issue, we implemented a comprehensive solution involving retry logic, user feedback, and timeout handling.',
          solutionType: 'fix',
          tags: ['retry-logic', 'user-feedback', 'error-handling', 'monitoring'],
          appliedAt: new Date('2024-01-15T12:15:00Z'),
          effectiveness: 85,
          steps: [
            {
              id: 'step-1',
              order: 1,
              title: 'Add retry mechanism with exponential backoff',
              description: 'Implement exponential backoff retry logic for payment requests',
              action: 'Update PaymentForm component',
              expected: 'Failed payments retry automatically with increasing delays',
              completed: true,
              timestamp: new Date('2024-01-15T12:00:00Z')
            }
          ],
          codeChanges: [
            {
              id: 'change-1',
              file: 'src/components/PaymentForm.tsx',
              changeType: 'modify',
              description: 'Added exponential backoff retry logic',
              before: 'const processPayment = async (paymentData) => {\n  return await paymentAPI.process(paymentData);\n}',
              after: 'const processPayment = async (paymentData, retryCount = 0) => {\n  try {\n    return await paymentAPI.process(paymentData);\n  } catch (error) {\n    if (retryCount < 3) {\n      await delay(Math.pow(2, retryCount) * 1000);\n      return processPayment(paymentData, retryCount + 1);\n    }\n    throw error;\n  }\n}',
              lineNumbers: { start: 45, end: 47 }
            }
          ],
          verification: {
            method: 'Automated testing',
            criteria: 'Payment success rate > 95% with simulated slow gateway',
            result: 'success'
          }
        }
      },
    ],
    consoleOutputs: [
      {
        id: 'console-3',
        type: 'log',
        text: 'Cart updated with 3 items',
        timestamp: new Date('2024-01-15T11:46:15Z'),
      },
      {
        id: 'console-4',
        type: 'warn',
        text: 'Payment processing timeout warning',
        timestamp: new Date('2024-01-15T11:50:00Z'),
      },
    ],
    networkRequests: [
      {
        id: 'network-3',
        type: 'request',
        method: 'POST',
        url: 'https://api.example.com/cart/add',
        headers: { 'Content-Type': 'application/json' },
        timestamp: new Date('2024-01-15T11:46:00Z'),
      },
    ],
    tags: ['checkout', 'in-progress'],
  },
]

export const mockSolutions: Solution[] = [
  {
    id: 'solution-1',
    title: 'Handle Login Timeout Errors',
    description: 'Solution for handling authentication timeouts gracefully',
    issue: 'Login requests occasionally timeout causing test failures and poor user experience',
    solution: 'Implement retry mechanism with exponential backoff and show loading states to users. Add timeout detection and fallback authentication methods.',
    tags: ['authentication', 'timeout', 'retry', 'ux'],
    createdAt: new Date('2024-01-10T15:30:00Z'),
    updatedAt: new Date('2024-01-12T10:15:00Z'),
    usageCount: 8,
    effectiveness: 92,
    relatedTaskIds: ['task-1'],
  },
  {
    id: 'solution-2',
    title: 'Payment Gateway Integration Fix',
    description: 'Resolve payment processing failures and improve error handling',
    issue: 'Payment gateway integration fails intermittently with unclear error messages, causing checkout abandonment',
    solution: 'Add comprehensive error handling for different payment failure scenarios. Implement proper validation before payment submission and provide clear user feedback. Add fallback payment methods.',
    tags: ['payments', 'error-handling', 'validation', 'ux'],
    createdAt: new Date('2024-01-08T11:20:00Z'),
    updatedAt: new Date('2024-01-14T16:45:00Z'),
    usageCount: 12,
    effectiveness: 88,
    relatedTaskIds: ['task-2'],
  },
]

export const mockDashboardStats: DashboardStats = {
  totalTasks: mockTasks.length,
  activeTasks: mockTasks.filter(t => t.status === 'running').length,
  totalRuns: mockRuns.length,
  successRate: 84,
  averageRunTime: 15875,
  recentActivity: mockRuns.slice(0, 5),
}
