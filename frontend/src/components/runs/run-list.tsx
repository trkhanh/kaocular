import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { TagList } from '@/components/ui/tag-list'
import { formatDate, formatDuration } from '@/lib/utils'

interface RunListProps {
  runs: any[] // Using any[] since we're getting API data with different structure
}

export function RunList({ runs }: RunListProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {runs.map((run) => (
          <Card key={run.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-lg">
                    <span className="text-black dark:text-black">
                      Run {run.id.substring(0, 8)}
                    </span>
                  </CardTitle>
                  <StatusBadge status={run.status} />
                </div>
                <div className="text-sm text-black dark:text-black">
                  {formatDate(run.startedAt)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Task Info */}
                <div>
                  <span className="text-sm text-black dark:text-black">Task: </span>
                  <span className="text-sm font-medium text-black dark:text-black">
                    {run.taskId}
                  </span>
                </div>

                {/* Duration */}
                {run.duration && (
                  <div>
                    <span className="text-sm text-black dark:text-black">Duration: </span>
                    <span className="text-sm font-medium text-black dark:text-black">
                      {formatDuration(run.duration)}
                    </span>
                  </div>
                )}

                {/* Error */}
                {run.metadata?.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                      Error
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">
                      {run.metadata.error}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-black dark:text-black">Logs</div>
                    <div className="font-semibold text-black dark:text-black">{run.logs?.length || 0}</div>
                  </div>
                  <div>
                    <div className="text-black dark:text-black">Console</div>
                    <div className="font-semibold text-black dark:text-black">{run.metadata?.consoleLogs || 0}</div>
                  </div>
                  <div>
                    <div className="text-black dark:text-black">Network</div>
                    <div className="font-semibold text-black dark:text-black">{run.metadata?.networkRequests || 0}</div>
                  </div>
                  <div>
                    <div className="text-black dark:text-black">Status</div>
                    <div className="font-semibold text-black dark:text-black">{run.metadata?.result ? 'Success' : 'Failed'}</div>
                  </div>
                </div>

                {/* Tags */}
                {run.metadata?.tags && run.metadata.tags.length > 0 && (
                  <TagList tags={run.metadata.tags} limit={5} />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {runs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No test runs found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
