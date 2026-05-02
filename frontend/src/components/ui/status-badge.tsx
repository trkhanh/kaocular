import React from 'react'
import { Badge } from './badge'
import { TaskStatus, RunStatus } from '@/types'

interface StatusBadgeProps {
  status: TaskStatus | RunStatus
  className?: string
}

const statusConfig = {
  // Task statuses
  pending: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Pending' },
  running: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Running' },
  completed: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Completed' },
  failed: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Failed' },
  cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Cancelled' },
  
  // Run statuses
  queued: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Queued' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <Badge 
      className={`${config.color} ${className || ''}`}
      variant="outline"
    >
      {config.label}
    </Badge>
  )
}
