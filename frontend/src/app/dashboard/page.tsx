'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatDuration } from '@/lib/utils'
import { apiService } from '@/lib/api-service'
import { LogEntry } from '@/types'
import { CheckCircleIcon, ExclamationTriangleIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function DashboardPage() {
  const [runs, setRuns] = useState<any[]>([])
  const [runsLoading, setRunsLoading] = useState(true)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch logs
        setLogsLoading(true)
        const realLogs = await apiService.fetchLogs()
        setLogs(realLogs)

        // Fetch runs
        setRunsLoading(true)
        const realRuns = await apiService.fetchRuns()
        setRuns(realRuns)
      } catch (err) {
        console.error('Failed to fetch data for dashboard:', err)
      } finally {
        setLogsLoading(false)
        setRunsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate statistics from real data
  const totalLogs = logs.length
  const logsWithIssues = logs.filter(log => log.issue).length
  const logsWithSolutions = logs.filter(log => log.solution).length
  const recentLogs = logs.slice(0, 5)
  const recentRuns = runs.slice(0, 3)

  // Calculate real stats from runs data
  const uniqueTaskIds = Array.from(new Set(runs.map(run => run.taskId)))
  const runningRuns = runs.filter(r => r.status === 'running')
  const activeTaskIds = Array.from(new Set(runningRuns.map(run => run.taskId)))

  const realStats = {
    totalTasks: uniqueTaskIds.length,
    activeTasks: activeTaskIds.length,
    totalRuns: runs.length,
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Monitor your automated tests and browser automation tasks
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Badge variant="secondary">{realStats.totalTasks}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realStats.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {realStats.activeTasks} currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
              <Badge variant="secondary">{realStats.totalRuns}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realStats.totalRuns}</div>
              <p className="text-xs text-muted-foreground">
                Across all tasks
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Log Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Log Entries</CardTitle>
              <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {logsLoading ? '...' : totalLogs}
              </div>
              <p className="text-xs text-muted-foreground">
                Stored problem reports
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues Detected</CardTitle>
              <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {logsLoading ? '...' : logsWithIssues}
              </div>
              <p className="text-xs text-muted-foreground">
                Problems requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solutions Available</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {logsLoading ? '...' : logsWithSolutions}
              </div>
              <p className="text-xs text-muted-foreground">
                Resolved with solutions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-black dark:text-black">Recent Test Runs</CardTitle>
              <Button variant="outline" size="sm">
                <Link href="/runs">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {runsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading runs...</p>
                </div>
              ) : recentRuns.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No runs available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRuns.map((run) => (
                    <div key={run.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <StatusBadge status={run.status} />
                        <div>
                          <div className="font-medium">
                            <span className="text-black dark:text-black">
                              Run {run.id.substring(0, 8)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Task: {run.taskId}
                          </div>
                          {run.metadata?.tags && run.metadata.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {run.metadata.tags.slice(0, 2).map((tag: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {run.metadata.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{run.metadata.tags.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(run.startedAt)}
                        </div>
                        {run.duration && (
                          <div className="text-sm font-medium">
                            {formatDuration(run.duration)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Problem Logs</CardTitle>
              <Button variant="outline" size="sm">
                <Link href="/logs">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading logs...</p>
                </div>
              ) : recentLogs.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No logs available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {log.solution ? (
                          <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        ) : log.issue ? (
                          <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        ) : (
                          <DocumentTextIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-black dark:text-black truncate">
                            {log.message.length > 50 ? log.message.substring(0, 50) + '...' : log.message}
                          </div>
                          {log.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {log.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {log.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{log.tags.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-right flex-shrink-0 ml-2">
                        {formatDate(log.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
