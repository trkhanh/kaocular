import { PrismaClient, LogLevel } from '@prisma/client';

// Initialize Prisma client
export const prisma = new PrismaClient();

// Types for QA Agent operations
export interface LogEntryData {
  level: LogLevel;
  message: string;
  tags?: string[];
}

export interface SolutionData {
  logEntryId: string;
  issueText: string;
  solutionText: string;
  tags?: string[];
}

// QA Agent Database operations
export class QADatabaseService {
  // Save a log entry (test result, error, etc.)
  static async saveLogEntry(data: LogEntryData) {
    const logEntry = await prisma.logEntry.create({
      data: {
        level: data.level,
        message: data.message,
        tags: data.tags ? {
          create: data.tags.map(tag => ({ name: tag }))
        } : undefined,
      },
      include: {
        tags: true,
        solution: true,
      },
    });
    return logEntry;
  }

  // Save a solution (fix from Cursor)
  static async saveSolution(data: SolutionData) {
    const solution = await prisma.solution.create({
      data: {
        logEntryId: data.logEntryId,
        issueText: data.issueText,
        solutionText: data.solutionText,
        tags: data.tags ? {
          create: data.tags.map(tag => ({ name: tag }))
        } : undefined,
      },
      include: {
        logEntry: {
          include: {
            tags: true,
          },
        },
        tags: true,
      },
    });
    return solution;
  }

  // Get recent log entries
  static async getRecentLogEntries(limit: number = 50) {
    return await prisma.logEntry.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        tags: true,
        solution: {
          include: {
            tags: true,
          },
        },
      },
    });
  }

  // Get error logs that need solutions
  static async getErrorLogsNeedingSolutions() {
    return await prisma.logEntry.findMany({
      where: {
        level: { in: ['ERROR', 'WARN'] },
        solution: null,
      },
      orderBy: { timestamp: 'desc' },
      include: {
        tags: true,
      },
    });
  }

  // Get solutions by tag
  static async getSolutionsByTag(tagName: string, limit: number = 20) {
    return await prisma.solution.findMany({
      where: {
        tags: {
          some: {
            name: tagName,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        logEntry: {
          include: {
            tags: true,
          },
        },
        tags: true,
      },
    });
  }

  // Search for similar log entries
  static async findSimilarLogEntries(message: string, level?: LogLevel) {
    return await prisma.logEntry.findMany({
      where: {
        message: { contains: message, mode: 'insensitive' },
        ...(level && { level }),
      },
      include: {
        tags: true,
        solution: {
          include: {
            tags: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });
  }

  // Get all unique tags
  static async getAllTags() {
    const logTags = await prisma.logTag.findMany({
      select: { name: true },
      distinct: ['name'],
    });
    
    const solutionTags = await prisma.solutionTag.findMany({
      select: { name: true },
      distinct: ['name'],
    });

    const allTags = [...logTags, ...solutionTags];
    return [...new Set(allTags.map(tag => tag.name))];
  }
}
