'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TagList } from '@/components/ui/tag-list'
import { LogEntry } from '@/types'
import { formatDate } from '@/lib/utils'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

interface EnhancedLogViewerProps {
  logs: LogEntry[]
}

type IssueFilter = 'all' | 'with-issues' | 'with-solutions' | 'resolved' | 'unresolved'

export function EnhancedLogViewer({ logs }: EnhancedLogViewerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [issueFilter, setIssueFilter] = useState<IssueFilter>('all')
  const [expandedLogs, setExpandedLogs] = useState<{ [key: string]: boolean }>({})

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (log.issue?.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (log.solution?.fullText?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // LogLevel filtering removed
    
    let matchesIssueFilter = true
    switch (issueFilter) {
      case 'with-issues':
        matchesIssueFilter = !!log.issue
        break
      case 'with-solutions':
        matchesIssueFilter = !!log.solution
        break
      case 'resolved':
        matchesIssueFilter = !!(log.issue && log.solution)
        break
      case 'unresolved':
        matchesIssueFilter = !!(log.issue && !log.solution)
        break
    }
    
    return matchesSearch && matchesIssueFilter
  })

  const toggleExpanded = (logId: string) => {
    setExpandedLogs(prev => ({ ...prev, [logId]: !prev[logId] }))
  }

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `enhanced-logs-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const renderContextData = (context: Record<string, any>) => {
    return Object.entries(context).map(([key, value]) => (
      <div key={key} className="mb-2">
        <span className="text-xs text-muted-foreground font-medium">{key}:</span>
        <div className="mt-1">
          {typeof value === 'object' ? (
            <div className="code-block">
              {JSON.stringify(value, null, 2)}
            </div>
          ) : (
            <div className="text-sm">{String(value)}</div>
          )}
        </div>
      </div>
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Problems and Solutions Log
          </h1>
          <p className="text-muted-foreground">
            Comprehensive logs with issue tracking and solution documentation
          </p>
        </div>
        <Button onClick={exportLogs}>
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search logs, issues, solutions..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* LogLevel dropdown removed */}

            <select
              value={issueFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setIssueFilter(e.target.value as IssueFilter)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Logs</option>
              <option value="with-issues">With Issues</option>
              <option value="with-solutions">With Solutions</option>
              <option value="resolved">Resolved</option>
              <option value="unresolved">Unresolved</option>
            </select>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <FunnelIcon className="h-4 w-4" />
              <span>{filteredLogs.length} entries</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Entries */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                No logs match your filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogs[log.id]
            const hasIssue = !!log.issue
            const hasSolution = !!log.solution
            
            return (
              <Card key={log.id} className={`transition-all hover:shadow-md ${hasIssue ? 'border-l-4 border-l-orange-400 dark:border-l-orange-500' : ''} ${hasSolution ? 'border-l-4 border-l-emerald-400 dark:border-l-emerald-500' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Log Header */}
                      <div className="flex items-center space-x-3 mb-2">
                        {/* LogLevel badge removed */}
                        
                        {hasIssue && (
                          <Badge className="text-xs text-orange-800 bg-orange-100 border-orange-300 dark:text-orange-200 dark:bg-orange-900/30 dark:border-orange-700">
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            Issue
                          </Badge>
                        )}
                        
                        {hasSolution && (
                          <Badge className="text-xs text-black bg-emerald-100 border-emerald-300 dark:text-white dark:bg-emerald-900/30 dark:border-emerald-700">
                            <CheckCircleIcon className="h-3 w-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                            Solution
                          </Badge>
                        )}
                        
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>

                      {/* Log Message */}
                      <div className="text-sm mb-3">
                        <p className="break-words">{log.message}</p>
                      </div>

                      {/* Tags */}
                      {log.tags.length > 0 && (
                        <div className="mb-3">
                          <TagList tags={log.tags} limit={5} />
                        </div>
                      )}

                      {/* Issue Summary */}
                      {hasIssue && (
                        <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-md">
                          <div className="flex items-center space-x-2 mb-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
                            <span className="font-medium text-orange-800 dark:text-orange-200">
                              {log.issue!.title}
                            </span>
                          </div>
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            {log.issue!.fullText.substring(0, 200)}...
                          </p>
                        </div>
                      )}

                      {/* Solution Summary */}
                      {hasSolution && (
                        <div className="mb-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-3">
                            <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-semibold text-black">
                              Solution Available
                            </span>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-emerald-100 dark:border-emerald-800/50">
                            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                              {log.solution?.fullText ? 
                                (log.solution.fullText.length > 200 ? 
                                  log.solution.fullText.substring(0, 200) + '...' : 
                                  log.solution.fullText
                                ) : 
                                'No solution details available'
                              }
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 space-y-4 border-t pt-4">
                          {/* Issue Details */}
                          {hasIssue && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Issue Details</h4>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-xs text-muted-foreground">Full Description:</span>
                                  <div className="code-block mt-1">
                                    {log.issue!.fullText}
                                  </div>
                                </div>
                                
                                {log.issue!.context && (
                                  <div>
                                    <span className="text-xs text-muted-foreground">Context:</span>
                                    <div className="mt-1 space-y-2">
                                      {renderContextData(log.issue!.context)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Solution Details */}
                          {hasSolution && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Solution Details</h4>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-xs text-muted-foreground">Full Solution:</span>
                                  <div className="code-block mt-1">
                                    {log.solution?.fullText || 'No solution details available'}
                                  </div>
                                </div>
                                
                                {/* Steps removed - not available in current schema */}
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Metadata</h4>
                              <div className="code-block">
                                {JSON.stringify(log.metadata, null, 2)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(log.id)}
                      className="ml-2 flex-shrink-0"
                    >
                      {isExpanded ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Summary Stats */}
      {filteredLogs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">{filteredLogs.length}</div>
                <div className="text-xs text-muted-foreground">Total Logs</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-600">
                  {filteredLogs.filter(log => log.issue).length}
                </div>
                <div className="text-xs text-muted-foreground">With Issues</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {filteredLogs.filter(log => log.solution).length}
                </div>
                <div className="text-xs text-muted-foreground">With Solutions</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {filteredLogs.filter(log => log.issue && log.solution).length}
                </div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-600">
                  {filteredLogs.filter(log => log.issue && !log.solution).length}
                </div>
                <div className="text-xs text-muted-foreground">Unresolved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
