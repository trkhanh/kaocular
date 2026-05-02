'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { RunList } from '@/components/runs/run-list'
import { apiService } from '@/lib/api-service'

export default function RunsPage() {
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRuns() {
      try {
        setLoading(true)
        const realRuns = await apiService.fetchRuns()
        setRuns(realRuns)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch runs:', err)
        setError('Failed to load runs from database')
      } finally {
        setLoading(false)
      }
    }

    fetchRuns()
  }, [])

  if (loading) {
    return (
      <MainLayout title="Test Runs">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading runs from database...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout title="Test Runs">
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
    <MainLayout title="Test Runs">
      <div className="mb-4">
        <p className="text-sm text-black dark:text-black">
          Showing {runs.length} test runs from database
        </p>
      </div>
      <RunList runs={runs} />
    </MainLayout>
  )
}
