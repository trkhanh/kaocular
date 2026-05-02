'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { SolutionList } from '@/components/solutions/solution-list'
import { apiService } from '@/lib/api-service'

export default function SolutionsPage() {
  const [solutions, setSolutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSolutions() {
      try {
        setLoading(true)
        const realSolutions = await apiService.fetchSolutions()
        setSolutions(realSolutions)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch solutions:', err)
        setError('Failed to load solutions from database')
      } finally {
        setLoading(false)
      }
    }

    fetchSolutions()
  }, [])

  if (loading) {
    return (
      <MainLayout title="Solutions">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading solutions from database...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout title="Solutions">
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
    <MainLayout title="Solutions">
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {solutions.length} resolved solutions from database
        </p>
      </div>
      <SolutionList solutions={solutions} />
    </MainLayout>
  )
}