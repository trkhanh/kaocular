import React from 'react'
import { Badge } from './badge'

interface TagListProps {
  tags: string[]
  limit?: number
  className?: string
}

export function TagList({ tags, limit, className }: TagListProps) {
  const displayTags = limit ? tags.slice(0, limit) : tags
  const remainingCount = limit && tags.length > limit ? tags.length - limit : 0

  return (
    <div className={`flex flex-wrap gap-1 ${className || ''}`}>
      {displayTags.map((tag, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  )
}
