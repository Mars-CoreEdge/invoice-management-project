import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-60 h-60 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400 opacity-10 animate-bounce delay-500"></div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 text-center border border-white/20 relative overflow-hidden">
            {/* Card Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
            
            {/* Main Icon */}
            <div className="relative z-10 mb-6 sm:mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse shadow-lg">
                <div className="text-3xl sm:text-4xl">⚠️</div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Authentication Error
              </h1>
              <p className="text-purple-200 text-base sm:text-lg flex items-center justify-center gap-2">
                ✨ Something went wrong ✨
              </p>
            </div>
            
            <div className="relative z-10">
              <p className="text-purple-100 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                There was an error processing your authentication request. Please try signing in again.
              </p>
              
              <Link
                href="/auth/login"
                className="inline-block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-2xl text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-0"
              >
                <span className="mr-3">🔐</span>
                Try signing in again
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 