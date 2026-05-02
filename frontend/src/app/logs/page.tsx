'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedLogViewer } from '@/components/logs/enhanced-log-viewer'
import { apiService } from '@/lib/api-service'
import { LogEntry } from '@/types'

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true)
        const realLogs = await apiService.fetchLogs()
        setLogs(realLogs)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch logs:', err)
        setError('Failed to load logs from database')
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  if (loading) {
    return (
      <MainLayout title="Logging Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading logs from database...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout title="Logging Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-4">⚠️ Error</div>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Logging Dashboard">
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {logs.length} log entries from database
        </p>
      </div>
      <EnhancedLogViewer logs={logs} />
    </MainLayout>
  )
}
