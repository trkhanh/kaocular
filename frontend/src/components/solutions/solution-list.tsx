import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TagList } from '@/components/ui/tag-list'
import { Solution } from '@/types'
import { formatDate } from '@/lib/utils'

interface SolutionListProps {
  solutions: Solution[]
}

export function SolutionList({ solutions }: SolutionListProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {solutions.map((solution) => (
          <Card key={solution.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {solution.title}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-green-700 bg-green-50 border-green-300">
                    {solution.effectiveness}% effective
                  </Badge>
                  <Badge variant="secondary">
                    Used {solution.usageCount} times
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {solution.description}
                </p>

                {/* Issue */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Issue</h4>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      {solution.issue}
                    </p>
                  </div>
                </div>

                {/* Solution */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Solution</h4>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {solution.solution}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {solution.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tags</h4>
                    <TagList tags={solution.tags} />
                  </div>
                )}

                {/* Related Tasks */}
                {solution.relatedTaskIds.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Related Tasks</h4>
                    <div className="flex flex-wrap gap-2">
                      {solution.relatedTaskIds.map((taskId) => (
                        <Badge key={taskId} variant="outline">
                          {taskId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Created: {formatDate(solution.createdAt)}</span>
                  <span>Updated: {formatDate(solution.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {solutions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No solutions found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
