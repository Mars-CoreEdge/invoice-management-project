'use client'

import { useEffect } from 'react'
import { useChat } from 'ai/react'
import { Button } from './ui/button'

interface Invoice {
  id: string
  docNumber: string
  txnDate: string
  dueDate: string
  totalAmount: number
  balance: number
  customer: string
  status: 'paid' | 'unpaid' | 'overdue'
}

interface ChatPanelProps {
  selectedInvoice: Invoice | null
  onInvoiceSelect: (invoice: Invoice) => void
}

export function ChatPanel({ selectedInvoice, onInvoiceSelect }: ChatPanelProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
    {
        id: 'welcome',
      role: 'assistant',
        content: '👋 Hello! I\'m your AI Business Assistant ready to help!\n\n🎯 **What I can help you with:**\n\n• **Invoice Management** - View and analyze your 4 sample invoices\n• **Business Calculations** - Percentages, profit margins, ROI calculations\n• **Business Advice** - Cash flow, payment terms, collection strategies\n• **General Questions** - Business concepts and best practices\n\n💬 **Try asking me:**\n- "Show me my invoices"\n- "Calculate 15% of 5000"\n- "How can I improve cash flow?"\n- "What are good payment terms?"\n\nI understand natural language - just type your question below! 👇'
        }
    ],
    onFinish: (message) => {
      console.log('Message finished:', message);
    },
    onError: (error) => {
      console.error('Chat error:', error);
    }
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const messagesContainer = document.querySelector('#messages-container')
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  }, [messages, isLoading])

  const setQuickInput = async (text: string) => {
    // Don't set quick input if already loading
    if (isLoading) return;
    
    // First, clear any existing input
    handleInputChange({ target: { value: '' } } as any)
    
    // Then set the new input
    handleInputChange({ target: { value: text } } as any)
    
    // Wait a bit for the input to be set, then submit
    setTimeout(() => {
      // Create a synthetic form event
      const syntheticEvent = {
        preventDefault: () => {},
        currentTarget: {},
        target: { value: text },
        nativeEvent: {}
      } as any
      
      handleSubmit(syntheticEvent)
    }, 100)
  }

  const formatMessage = (content: string) => {
    // Split by double newlines to create paragraphs
    const paragraphs = content.split('\n\n')
    
    return paragraphs.map((paragraph, index) => {
      // Check if this is a list item
      if (paragraph.includes('•') || paragraph.includes('-')) {
        const lines = paragraph.split('\n')
        return (
          <div key={index} className="mb-3">
            {lines.map((line, lineIndex) => (
              <div key={lineIndex} className="mb-1">
                {line.startsWith('•') || line.startsWith('-') ? (
                  <div className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{line.replace(/^[•-]\s*/, '')}</span>
                  </div>
                ) : (
                  <div className="font-medium text-white mb-2">{line}</div>
                )}
              </div>
            ))}
          </div>
        )
      }
      
      return (
        <p key={index} className="mb-3 last:mb-0">
          {paragraph}
        </p>
      )
    })
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl h-full flex flex-col border border-white/20 relative overflow-hidden max-h-[calc(100vh-8rem)]">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
      
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-white/10 relative z-10 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-0 gap-3 sm:gap-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-xs sm:text-sm">🤖</span>
            </div>
            AI Assistant
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs sm:text-sm font-medium">Online</span>
          </div>
        </div>
        
        {selectedInvoice && (
          <div className="mt-3 sm:mt-4 bg-purple-500/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-purple-400/30">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">
                  {selectedInvoice.docNumber?.slice(-2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-purple-100 font-medium text-sm sm:text-base">
                  📋 Selected: {selectedInvoice.docNumber}
                </p>
                <p className="text-purple-200 text-xs sm:text-sm truncate">
                  {selectedInvoice.customer} • ${selectedInvoice.totalAmount}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div 
        id="messages-container" 
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 relative z-10 min-h-0 scroll-smooth
                   scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-purple-500/50 
                   hover:scrollbar-thumb-purple-500/70 scrollbar-track-rounded-full scrollbar-thumb-rounded-full"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(147, 51, 234, 0.5) rgba(255, 255, 255, 0.05)'
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 select-text ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
              }`}
              style={{ pointerEvents: 'auto', userSelect: 'text' }}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-xs">🤖</span>
                  </div>
                  <span className="text-purple-300 text-xs sm:text-sm font-medium">AI Assistant</span>
                </div>
              )}
              
              <div className={`text-sm sm:text-base ${message.role === 'assistant' ? 'text-white/90' : 'text-white'}`}>
                {message.role === 'assistant' ? formatMessage(message.content) : message.content}
              </div>
              
              {message.role === 'user' && (
                <div className="flex items-center gap-2 mt-2 justify-end">
                  <span className="text-white/70 text-xs">You</span>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-xs">👤</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-xs">🤖</span>
                </div>
                <span className="text-purple-300 text-xs sm:text-sm font-medium">AI Assistant</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                </div>
                <span className="text-xs sm:text-sm">Processing your request...</span>
              </div>
            </div>
          </div>
        )}
        
        {messages.length === 1 && !isLoading && (
          <div className="text-center text-white/60 py-6 sm:py-8">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">💬</div>
            <p className="text-base sm:text-lg mb-2">Ready to help with your business!</p>
            <p className="text-xs sm:text-sm">Ask about invoices, calculations, or try the quick buttons below.</p>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 sm:p-4 lg:p-6 border-t border-white/10 relative z-10 flex-shrink-0">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="relative">
            <textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me about invoices or calculations..."
              className="w-full p-3 sm:p-4 pr-11 sm:pr-14 lg:pr-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl text-sm sm:text-base text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none min-h-[45px] sm:min-h-[55px] lg:min-h-[60px] max-h-24 sm:max-h-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e as any)
                }
              }}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 rounded-lg sm:rounded-xl w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 p-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-lg"
            >
              {isLoading ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="text-sm sm:text-base lg:text-lg">🚀</span>
              )}
            </Button>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="space-y-2">
            {/* First Row - Invoice & Analytics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setQuickInput('Show me all my invoices')}
                disabled={isLoading}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-md sm:rounded-lg text-xs sm:text-sm transition-all duration-200 border border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-center"
              >
                📋 Invoices
              </button>
              <button
                type="button"
                onClick={() => setQuickInput('Show me my invoice analytics for this month')}
                disabled={isLoading}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-md sm:rounded-lg text-xs sm:text-sm transition-all duration-200 border border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-center"
              >
                📊 Analytics
              </button>
              <button
                type="button"
                onClick={() => setQuickInput('Show me all overdue invoices')}
                disabled={isLoading}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-md sm:rounded-lg text-xs sm:text-sm transition-all duration-200 border border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-center"
              >
                ⚠️ Overdue
              </button>
              <button
                type="button"
                onClick={() => setQuickInput('Get a list of my customers')}
                disabled={isLoading}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-md sm:rounded-lg text-xs sm:text-sm transition-all duration-200 border border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-center"
              >
                👥 Customers
              </button>
            </div>
            
            {/* Second Row - Business & Finance */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setQuickInput('Calculate 15% of 5000')}
                disabled={isLoading}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-md sm:rounded-lg text-xs sm:text-sm transition-all duration-200 border border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-center"
              >
                🧮 Calculate
              </button>
              <button
                type="button"
                onClick={() => setQuickInput('How can I improve my cash flow?')}
                disabled={isLoading}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-md sm:rounded-lg text-xs sm:text-sm transition-all duration-200 border border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-center"
              >
                💰 Cash Flow
              </button>
              <button
                type="button"
                onClick={() => setQuickInput('What is profit margin and how do I calculate it?')}
                disabled={isLoading}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-md sm:rounded-lg text-xs sm:text-sm transition-all duration-200 border border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-center"
              >
                📈 Margins
              </button>
              <button
                type="button"
                onClick={() => setQuickInput('What are the best payment terms for small businesses?')}
                disabled={isLoading}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-md sm:rounded-lg text-xs sm:text-sm transition-all duration-200 border border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-center"
              >
                💡 Advice
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 