import React from 'react'
import { Button } from '@/components/ui/button'
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline'

export function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - only show on mobile since sidebar has logo on desktop */}
          <div className="flex items-center md:hidden">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                Circular
              </span>
            </div>
          </div>
          
          {/* Center - Search or breadcrumb could go here */}
          <div className="flex-1 flex justify-center md:justify-start md:ml-0">
            {/* This space can be used for search or breadcrumbs */}
          </div>

          {/* Right side - User actions */}
          <div className="flex items-center space-x-3">
            {/* Environment indicator */}
            <div className="hidden sm:flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Development
              </span>
            </div>
            
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="p-2">
              <BellIcon className="h-5 w-5" />
            </Button>
            
            {/* User menu */}
            <Button variant="ghost" size="sm" className="p-2">
              <UserCircleIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
