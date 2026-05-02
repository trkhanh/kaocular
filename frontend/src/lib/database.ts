import { prisma } from './prisma'
import { LogLevel } from '@prisma/client'

export { LogLevel }

export interface CreateLogEntryData {
  level: LogLevel
  message: string
  tags?: string[]
  solution?: {
    issueText: string
    solutionText: string
    tags?: string[]
  }
}

export interface LogEntryWithSolution {
  id: string
  level: LogLevel
  message: string
  timestamp: Date
  tags: { name: string }[]
  solution: {
    id: string
    issueText: string
    solutionText: string
    createdAt: Date
    tags: { name: string }[]
  } | null
}

export class DatabaseService {
  // Create a new log entry with optional solution
  async createLogEntry(data: CreateLogEntryData): Promise<LogEntryWithSolution> {
    const logEntry = await prisma.logEntry.create({
      data: {
        level: data.level,
        message: data.message,
        tags: data.tags ? {
          create: data.tags.map(tag => ({ name: tag }))
        } : undefined,
        solution: data.solution ? {
          create: {
            issueText: data.solution.issueText,
            solutionText: data.solution.solutionText,
            tags: data.solution.tags ? {
              create: data.solution.tags.map(tag => ({ name: tag }))
            } : undefined,
          }
        } : undefined,
      },
      include: {
        tags: { select: { name: true } },
        solution: {
          include: {
            tags: { select: { name: true } }
          }
        }
      }
    })

    return logEntry
  }

  // Get all log entries with their solutions and tags
  async getLogEntries(): Promise<LogEntryWithSolution[]> {
    const logEntries = await prisma.logEntry.findMany({
      include: {
        tags: { select: { name: true } },
        solution: {
          include: {
            tags: { select: { name: true } }
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    })

    return logEntries
  }

  // Get a specific log entry by ID
  async getLogEntry(id: string): Promise<LogEntryWithSolution | null> {
    const logEntry = await prisma.logEntry.findUnique({
      where: { id },
      include: {
        tags: { select: { name: true } },
        solution: {
          include: {
            tags: { select: { name: true } }
          }
        }
      }
    })

    return logEntry
  }

  // Add a solution to an existing log entry
  async addSolutionToLog(logId: string, issueText: string, solutionText: string, tags?: string[]): Promise<LogEntryWithSolution | null> {
    const updatedLog = await prisma.logEntry.update({
      where: { id: logId },
      data: {
        solution: {
          create: {
            issueText,
            solutionText,
            tags: tags ? {
              create: tags.map(tag => ({ name: tag }))
            } : undefined,
          }
        }
      },
      include: {
        tags: { select: { name: true } },
        solution: {
          include: {
            tags: { select: { name: true } }
          }
        }
      }
    })

    return updatedLog
  }

  // Get all solutions with their tags
  async getSolutions() {
    const solutions = await prisma.solution.findMany({
      include: {
        tags: { select: { name: true } },
        logEntry: { select: { id: true, message: true, level: true, timestamp: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return solutions
  }

  // Search logs and solutions by text or tags
  async searchLogs(query: string): Promise<LogEntryWithSolution[]> {
    const logEntries = await prisma.logEntry.findMany({
      where: {
        OR: [
          { message: { contains: query, mode: 'insensitive' } },
          { tags: { some: { name: { contains: query, mode: 'insensitive' } } } },
          { solution: { issueText: { contains: query, mode: 'insensitive' } } },
          { solution: { solutionText: { contains: query, mode: 'insensitive' } } },
          { solution: { tags: { some: { name: { contains: query, mode: 'insensitive' } } } } },
        ]
      },
      include: {
        tags: { select: { name: true } },
        solution: {
          include: {
            tags: { select: { name: true } }
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    })

    return logEntries
  }

  // Get logs by level
  async getLogsByLevel(level: LogLevel): Promise<LogEntryWithSolution[]> {
    const logEntries = await prisma.logEntry.findMany({
      where: { level },
      include: {
        tags: { select: { name: true } },
        solution: {
          include: {
            tags: { select: { name: true } }
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    })

    return logEntries
  }

  // Get logs with solutions only
  async getLogsWithSolutions(): Promise<LogEntryWithSolution[]> {
    const logEntries = await prisma.logEntry.findMany({
      where: {
        solution: { isNot: null }
      },
      include: {
        tags: { select: { name: true } },
        solution: {
          include: {
            tags: { select: { name: true } }
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    })

    return logEntries
  }
}

// Export a singleton instance
export const db = new DatabaseService()
