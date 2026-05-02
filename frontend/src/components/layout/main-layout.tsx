import React from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'

interface MainLayoutProps {
  children?: React.ReactNode
  title?: string
}

export function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {title && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
