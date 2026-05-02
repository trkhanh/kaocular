import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const logs = await prisma.log.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: 50 // Limit to 50 most recent logs
    })

    // Transform the data to match the frontend interface
    const transformedLogs = logs.map(log => ({
      id: log.id,
      message: log.issueText || 'No message available',
      timestamp: new Date(log.timestamp || log.createdAt), // Ensure valid Date object
      tags: Array.isArray(log.tags) ? log.tags : [], // Match updated string[] type
      issue: log.issueText ? {
        id: log.id + '_issue',
        title: 'Issue',
        description: log.issueText.substring(0, 100) + (log.issueText.length > 100 ? '...' : ''),
        fullText: log.issueText,
        severity: 'medium' as const,
        category: 'other' as const,
        tags: Array.isArray(log.tags) ? log.tags : [],
        detectedAt: new Date(log.timestamp || log.createdAt),
        context: log.metadata as any
      } : undefined,
      solution: log.solutionText ? {
        id: log.id + '_solution',
        issueId: log.id + '_issue',
        title: 'Solution',
        description: log.solutionText.substring(0, 100) + (log.solutionText.length > 100 ? '...' : ''),
        fullText: log.solutionText,
        solutionType: 'fix' as const,
        tags: Array.isArray(log.tags) ? log.tags : [],
        appliedAt: new Date(log.updatedAt || log.createdAt),
        effectiveness: 100,
        steps: [],
        solutionText: log.solutionText // Keep this for backward compatibility
      } : undefined,
      metadata: log.metadata as any
    }))

    return NextResponse.json(transformedLogs)
  } catch (error) {
    console.error('Failed to fetch logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { issueText, solutionText, tags } = data

    if (!issueText) {
      return NextResponse.json({ error: 'Issue text is required' }, { status: 400 })
    }

    const newLog = await prisma.log.create({
      data: {
        issueText,
        solutionText: solutionText || null,
        tags: tags || [],
        timestamp: new Date(),
        metadata: {
          source: 'frontend-api',
          createdAt: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(newLog, { status: 201 })
  } catch (error) {
    console.error('Failed to create log:', error)
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 })
  }
}
