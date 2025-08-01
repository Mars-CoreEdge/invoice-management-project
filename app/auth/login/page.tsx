import AuthForm from '@/components/AuthForm'

export default function LoginPage() {
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
          <AuthForm mode="login" />
        </div>
      </div>
    </div>
  )
} 