'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  DocumentTextIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Logs', href: '/logs', icon: DocumentTextIcon },
  { name: 'Runs', href: '/runs', icon: PlayIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow bg-gray-50 dark:bg-gray-900 overflow-y-auto border-r border-gray-200 dark:border-gray-800">
        {/* Logo/Brand Section */}
        <div className="flex items-center px-4 py-6">
          <Link href="/" className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                <path d="M2 17L12 22L22 17"/>
                <path d="M2 12L12 17L22 12"/>
              </svg>
            </div>
            <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white font-orbitron">
              Circular
            </span>
          </Link>
        </div>
        
        {/* Navigation */}
        <div className="flex flex-col flex-grow px-3">
          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const IconComponent = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <IconComponent className={`mr-3 h-5 w-5 ${
                    isActive 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  }`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
