import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthContext'
import { TeamProvider } from '@/components/TeamContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Invoice Management Tool',
  description: 'AI-powered Invoice Management with QuickBooks integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <TeamProvider>
            {children}
          </TeamProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 