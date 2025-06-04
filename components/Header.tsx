'use client'

interface HeaderProps {
  isConnected?: boolean
}

export function Header({ isConnected = false }: HeaderProps) {
  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 relative z-20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">💼</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Invoice Manager
              </h1>
              <p className="text-purple-200 text-sm">
                AI-Powered QuickBooks Integration
              </p>
            </div>
          </div>

          {/* Status Indicators Only */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-emerald-400/30">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-emerald-100 font-medium text-sm">QuickBooks Connected</span>
                </div>
                <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-green-400/30">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-green-100 font-medium text-sm">AI Assistant Online</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-amber-400/30">
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-amber-100 font-medium text-sm">Setup Required</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Display (when connected) - Real values from mock invoices */}
        {isConnected && (
          <div className="mt-6 flex items-center justify-center bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">4</div>
                <div className="text-white/60 text-sm">Total Invoices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">$8,450.75</div>
                <div className="text-white/60 text-sm">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">2</div>
                <div className="text-white/60 text-sm">Paid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">1</div>
                <div className="text-white/60 text-sm">Unpaid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">1</div>
                <div className="text-white/60 text-sm">Overdue</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 