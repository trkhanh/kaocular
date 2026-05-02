'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CircuitCube } from '@/components/CircuitCube'
import { HERO_CONTENT, FEATURES, BENEFITS } from '@/lib/const'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    setMounted(true)
    
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-orange-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                  <path d="M2 17L12 22L22 17"/>
                  <path d="M2 12L12 17L22 12"/>
                </svg>
              </div>
              <span className="text-xl font-bold tracking-wider font-orbitron">CIRCULAR</span>
            </a>
            
                <div className="hidden md:flex items-center space-x-8 text-sm tracking-wide font-orbitron">
                </div>
            
            <a href="/dashboard">
              <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold tracking-wide text-sm px-6 font-orbitron">
                GET STARTED
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background circuit pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-black to-red-900/20" />
          {/* Animated grid */}
          <div className="absolute inset-0" 
               style={{
                 backgroundImage: `
                   linear-gradient(90deg, rgba(251, 146, 60, 0.1) 1px, transparent 1px),
                   linear-gradient(rgba(251, 146, 60, 0.1) 1px, transparent 1px)
                 `,
                 backgroundSize: '100px 100px',
                 transform: `translate(${scrollY * 0.5}px, ${scrollY * 0.3}px)`,
               }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Text content */}
          <div className="space-y-8 animate-slide-up">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-black tracking-wider leading-none font-orbitron">
                <span className="block text-white">{HERO_CONTENT.headline}</span>
                <span className="block bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text text-transparent">
                  {HERO_CONTENT.subheadline}
                </span>
                <span className="block text-2xl md:text-3xl font-light text-white mt-4 tracking-widest font-inter">
                  {HERO_CONTENT.tagline}
                </span>
              </h1>
            </div>

            <div className="max-w-md">
              <h2 className="text-lg font-semibold text-white mb-4 tracking-wide font-orbitron">WE ARE CIRCULAR</h2>
              <p className="text-white leading-relaxed">
                {HERO_CONTENT.description}
              </p>
              <div className="mt-6 text-sm text-gray-400 tracking-widest">
                SCROLL TO LEARN MORE...
              </div>
            </div>
          </div>

          {/* Right side - 3D Cube */}
          <div className="flex justify-center lg:justify-end">
            <CircuitCube className="w-full max-w-lg" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-orange-500/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-orange-500 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black tracking-wider text-white mb-6 font-orbitron">
              CORE CAPABILITIES
            </h2>
            <p className="text-xl text-white max-w-3xl mx-auto">
              Three powerful technologies that revolutionize browser testing for AI-native development.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.id}
                className="group relative p-8 bg-gradient-to-br from-gray-900/50 to-black border border-orange-500/20 hover:border-orange-500/50 transition-all duration-500 hover:scale-105"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="relative z-10">
                  <div className={cn(
                    'w-16 h-16 rounded-lg bg-gradient-to-r mb-6 flex items-center justify-center group-hover:scale-110 transition-transform',
                    feature.gradient
                  )}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {feature.icon === 'MessageSquare' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      )}
                      {feature.icon === 'Monitor' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      )}
                      {feature.icon === 'Code' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      )}
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-4 tracking-wide">
                    {feature.title}
                  </h3>
                  
                  <p className="text-white leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-orange-900/5 to-red-900/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-wider text-white mb-8 font-orbitron">
                TRANSFORM YOUR TESTING
              </h2>
              <div className="space-y-4">
                {BENEFITS.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-4 group">
                    <div className="w-2 h-2 bg-orange-500 rounded-full group-hover:scale-150 transition-transform" />
                    <span className="text-white transition-colors">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <a href="/dashboard">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold px-8 py-3 tracking-wide font-orbitron">
                    {HERO_CONTENT.primaryCTA}
                  </Button>
                </a>
                <Button variant="outline" className="border-white text-white hover:bg-white/10 font-semibold px-8 py-3 tracking-wide font-orbitron">
                  {HERO_CONTENT.secondaryCTA}
                </Button>
              </div>
            </div>
            
                <div className="relative">
                  <div className="bg-gray-900/50 border border-orange-500/20 rounded-lg p-8 backdrop-blur-sm">
                    <div className="text-sm text-orange-400 mb-4 font-jetbrains tracking-wide">// Start Agent Server</div>
                    <div className="bg-black/50 rounded p-4 font-jetbrains text-sm">
                      <div className="text-green-400">$ ./agent.sh --run</div>
                      <div className="text-gray-400 mt-1">🚀 Starting agent server...</div>
                      <div className="text-gray-400">🖥️  Browser will open and stay visible</div>
                      <div className="text-orange-400 mt-3">✓ Agent server ready</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/50 border border-orange-500/20 rounded-lg p-8 backdrop-blur-sm mt-4">
                    <div className="text-sm text-orange-400 mb-4 font-jetbrains tracking-wide">// Send Test Commands</div>
                    <div className="bg-black/50 rounded p-4 font-jetbrains text-sm">
                      <div className="text-green-400">$ ./agent.sh --test "Click the login button"</div>
                      <div className="text-green-400 mt-2">$ ./agent.sh --test "Fill form and submit"</div>
                      <div className="text-green-400 mt-2">$ ./agent.sh --store --issue "Login fails" --solve "Fixed auth token"</div>
                      <div className="text-orange-400 mt-3">✓ Tests completed, logs stored</div>
                    </div>
                  </div>
                </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-black border-t border-orange-500/20 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                  <path d="M2 17L12 22L22 17"/>
                  <path d="M2 12L12 17L22 12"/>
                </svg>
              </div>
              <span className="text-xl font-bold tracking-wider font-orbitron">CIRCULAR</span>
            </div>
            
                <div className="flex items-center space-x-8 text-sm font-orbitron">
                  <span className="text-white tracking-wide">
                    © 2025 CIRCULAR. ALL RIGHTS RESERVED.
                  </span>
                </div>
          </div>
        </div>
      </footer>
    </div>
  )
}