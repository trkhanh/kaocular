import './globals.css'
import { Inter, JetBrains_Mono, Orbitron } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
  weight: ['400', '700', '900'],
})

export const metadata = {
  title: 'Circular - AI-Powered Browser Testing',
  description: 'Agentic browser testing for AI-native IDEs. Natural language commands meet DevTools monitoring depth.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${orbitron.variable}`}>
      <body className="font-inter antialiased">{children}</body>
    </html>
  )
}
