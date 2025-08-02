'use client'

import { Github, Chrome } from 'lucide-react'
import { useAuth } from './AuthContext'

interface OAuthButtonsProps {
  mode: 'login' | 'signup'
}

export default function OAuthButtons({ mode }: OAuthButtonsProps) {
  const { signInWithOAuth } = useAuth()

  const handleGitHubSignIn = async () => {
    try {
      const { error } = await signInWithOAuth('github')
      if (error) throw error
    } catch (error: any) {
      console.error('GitHub sign in error:', error.message)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithOAuth('google')
      if (error) throw error
    } catch (error: any) {
      console.error('Google sign in error:', error.message)
    }
  }

  return (
    <div className="space-y-4">
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-transparent text-purple-300">
            Or continue with
          </span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-3">
        {/* GitHub Button */}
        <button
          onClick={handleGitHubSignIn}
          className="w-full flex items-center justify-center px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
        >
          <Github className="w-5 h-5 mr-3 text-white group-hover:scale-110 transition-transform" />
          <span className="font-medium">
            Continue with GitHub
          </span>
        </button>

        {/* Google Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
        >
          <Chrome className="w-5 h-5 mr-3 text-white group-hover:scale-110 transition-transform" />
          <span className="font-medium">
            Continue with Google
          </span>
        </button>
      </div>
    </div>
  )
} 