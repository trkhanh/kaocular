import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Since we don't have a runs table yet, let's use logs to simulate runs
    // We'll treat each log entry as representing a "run" or test execution
    const logs = await prisma.log.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: 20 // Get recent 20 entries
    })

    // Transform logs into run-like data
    const transformedRuns = logs.map(log => ({
      id: log.id,
      taskId: log.tags.length > 0 ? log.tags[0] : 'unknown-task',
      status: log.solutionText ? 'completed' : (log.issueText ? 'failed' : 'running'),
      startedAt: log.timestamp,
      completedAt: log.solutionText ? log.createdAt : null,
      duration: log.solutionText ? 
        Math.floor((new Date(log.createdAt).getTime() - new Date(log.timestamp).getTime())) : 
        null,
      logs: [{
        id: log.id,
        message: log.issueText || 'Test execution',
        timestamp: log.timestamp,
        tags: log.tags
      }],
      metadata: {
        hasIssue: !!log.issueText,
        hasSolution: !!log.solutionText,
        tags: log.tags
      }
    }))

    return NextResponse.json(transformedRuns)
  } catch (error) {
    console.error('Failed to fetch runs:', error)
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { taskId, status, metadata } = data

    // For now, we'll create a log entry to represent a run
    const newRun = await prisma.log.create({
      data: {
        issueText: metadata?.description || `Task ${taskId} execution`,
        solutionText: status === 'completed' ? 'Task completed successfully' : null,
        tags: [taskId, status, 'agent-run'],
        timestamp: new Date(),
        metadata: {
          source: 'agent-system',
          taskId,
          status,
          ...metadata
        }
      }
    })

    return NextResponse.json(newRun, { status: 201 })
  } catch (error) {
    console.error('Failed to create run:', error)
    return NextResponse.json({ error: 'Failed to create run' }, { status: 500 })
  }
}
