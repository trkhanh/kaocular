'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface CircuitCubeProps {
  className?: string
}

export function CircuitCube({ className }: CircuitCubeProps) {
  const [mounted, setMounted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Circuit board background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Horizontal circuit lines */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"
            style={{
              top: `${10 + i * 8}%`,
              left: '0%',
              right: '0%',
              animationDelay: `${i * 0.2}s`,
            }}
          >
            <div className="h-full bg-gradient-to-r from-transparent via-orange-500/60 to-transparent animate-pulse" />
          </div>
        ))}
        
        {/* Vertical circuit lines */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-gradient-to-b from-transparent via-orange-500/20 to-transparent"
            style={{
              left: `${15 + i * 10}%`,
              top: '0%',
              bottom: '0%',
              animationDelay: `${i * 0.3}s`,
            }}
          >
            <div className="w-full bg-gradient-to-b from-transparent via-orange-500/40 to-transparent animate-pulse" />
          </div>
        ))}

        {/* Circuit nodes */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`node-${i}`}
            className="absolute w-2 h-2 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50 animate-pulse"
            style={{
              top: `${20 + i * 12}%`,
              left: `${25 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Main 3D Cube */}
      <div 
        className={cn(
          'relative w-64 h-64 transition-transform duration-700 transform-gpu',
          isHovered ? 'scale-110 rotate-y-12 rotate-x-6' : 'rotate-y-3 rotate-x-3'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        }}
      >
        {/* Cube faces */}
        <div className="absolute inset-0 transform-gpu" style={{ transformStyle: 'preserve-3d' }}>
          {/* Front face */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-orange-600/30 border border-orange-500/40 backdrop-blur-sm flex items-center justify-center"
            style={{ transform: 'translateZ(128px)' }}
          >
            <div className="w-16 h-16 border-2 border-orange-400 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                <path d="M2 17L12 22L22 17"/>
                <path d="M2 12L12 17L22 12"/>
              </svg>
            </div>
          </div>

          {/* Back face */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-orange-700/20 border border-orange-500/20"
            style={{ transform: 'translateZ(-128px) rotateY(180deg)' }}
          />

          {/* Right face */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-orange-500/15 to-orange-600/25 border border-orange-500/30"
            style={{ transform: 'rotateY(90deg) translateZ(128px)' }}
          />

          {/* Left face */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-orange-700/20 border border-orange-500/20"
            style={{ transform: 'rotateY(-90deg) translateZ(128px)' }}
          />

          {/* Top face */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-orange-400/25 to-orange-500/35 border border-orange-400/40"
            style={{ transform: 'rotateX(90deg) translateZ(128px)' }}
          >
            {/* Glowing top pattern */}
            <div className="absolute inset-4 border border-orange-400/60 rounded">
              <div className="absolute inset-2 bg-orange-500/20 rounded animate-pulse" />
            </div>
          </div>

          {/* Bottom face */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-orange-700/10 to-orange-800/15 border border-orange-600/20"
            style={{ transform: 'rotateX(-90deg) translateZ(128px)' }}
          />
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 bg-orange-500/10 rounded-lg blur-2xl animate-pulse" />
      </div>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-orange-400 rounded-full animate-float shadow-lg shadow-orange-400/50"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  )
}
