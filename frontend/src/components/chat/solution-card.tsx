'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle } from 'lucide-react'

interface SolutionCardProps {
  issue: string
  solution: string
  tags?: string[]
  timestamp?: string
}

export function SolutionCard({ issue, solution, tags, timestamp }: SolutionCardProps) {
  return (
    <Card className="my-4 border-l-4 border-l-emerald-500">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          Solution from your database
        </CardTitle>
        {timestamp && (
          <p className="text-xs text-muted-foreground">{timestamp}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Issue:</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 pl-6">{issue}</p>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium">Solution:</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 pl-6">{solution}</p>
        </div>

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
