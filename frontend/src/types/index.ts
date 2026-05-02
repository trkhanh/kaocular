export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type RunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';


export interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  tags: string[];
  lastRunAt?: Date;
  averageRunTime?: number;
}

export interface TaskRun {
  id: string;
  taskId: string;
  status: RunStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
  logs: LogEntry[];
  consoleOutputs: BrowserLog[];
  networkRequests: NetworkLog[];
  storageData?: StorageData;
  tags: string[];
}

export interface LogEntry {
  id: string;
  runId?: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  tags: string[];
  issue?: ProblemIssue;
  solution?: ProblemSolution;
}

export interface ProblemIssue {
  id: string;
  title: string;
  description: string;
  fullText: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'browser' | 'network' | 'ui' | 'performance' | 'validation' | 'authentication' | 'other';
  tags: string[];
  detectedAt: Date;
  context?: {
    url?: string;
    selector?: string;
    userAction?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    browserInfo?: string;
    screenshots?: string[];
  };
}

export interface ProblemSolution {
  id: string;
  issueId: string;
  title: string;
  description: string;
  fullText: string;
  solutionType: 'fix' | 'workaround' | 'configuration' | 'retry' | 'manual';
  tags: string[];
  appliedAt: Date;
  effectiveness: number; // 0-100
  steps: SolutionStep[];
  codeChanges?: CodeChange[];
  verification?: {
    method: string;
    criteria: string;
    result: 'success' | 'partial' | 'failed';
  };
}

export interface SolutionStep {
  id: string;
  order: number;
  title: string;
  description: string;
  action: string;
  expected: string;
  completed: boolean;
  timestamp?: Date;
}

export interface CodeChange {
  id: string;
  file: string;
  changeType: 'add' | 'modify' | 'delete' | 'rename';
  before?: string;
  after?: string;
  description: string;
  lineNumbers?: {
    start: number;
    end: number;
  };
}

export interface BrowserLog {
  id: string;
  type: string;
  text: string;
  timestamp: Date;
  args?: any[];
}

export interface NetworkLog {
  id: string;
  type: 'request' | 'response';
  method?: string;
  url: string;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  postData?: string;
  responseBody?: string;
  timestamp: Date;
  duration?: number;
}

export interface StorageData {
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  cookies: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
}

export interface Solution {
  id: string;
  title: string;
  description: string;
  issue: string;
  solution: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  effectiveness: number; // 0-100
  relatedTaskIds: string[];
}

export interface DashboardStats {
  totalTasks: number;
  activeTasks: number;
  totalRuns: number;
  successRate: number;
  averageRunTime: number;
  recentActivity: TaskRun[];
}

export interface FilterOptions {
  status?: TaskStatus[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}
