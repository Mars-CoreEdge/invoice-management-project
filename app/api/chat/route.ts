import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { invoiceTools } from '@/lib/ai-tools';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log('✅ Chat API called with', messages.length, 'messages');

    // Use AI SDK with proper tools integration
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages,
      tools: invoiceTools,
      maxSteps: 5, // Allow multi-step interactions for complex invoice workflows
      temperature: 0.7,
      system: `You are an intelligent AI assistant for an Invoice Management system integrated with QuickBooks. 

Your capabilities include:
- Invoice management (create, read, update, delete, void, email)
- QuickBooks data retrieval (customers, items, invoice statistics)
- Business calculations and advice
- General knowledge assistance

Key behaviors:
1. Use appropriate tools for invoice-related tasks
2. Provide helpful, actionable business advice
3. Format responses clearly with relevant details
4. Handle errors gracefully and suggest alternatives
5. Be proactive in offering related assistance

Current invoice context:
- 4 invoices totaling $8,450.75
- 2 paid ($3,450.00), 2 unpaid ($5,000.75)
- 1 overdue invoice from Global Dynamics ($3,200.75)

Always strive to be helpful, accurate, and business-focused in your responses.`,
      
      // Handle step completion for UI updates
      onStepFinish({ text, toolCalls, toolResults, finishReason }) {
        console.log('🔧 Step completed:', {
          hasText: !!text,
          toolCallsCount: toolCalls?.length || 0,
          toolResultsCount: toolResults?.length || 0,
          finishReason
        });
        
        // Log tool calls for debugging
        if (toolCalls && toolCalls.length > 0) {
          toolCalls.forEach((call, index) => {
            console.log(`📞 Tool Call ${index + 1}:`, call.toolName, 'with args:', call.args);
          });
        }
        
        // Log tool results for debugging
        if (toolResults && toolResults.length > 0) {
          toolResults.forEach((result, index) => {
            console.log(`📋 Tool Result ${index + 1}:`, result.result ? 'Success' : 'Error');
          });
        }
      },
      
      // Handle individual tool calls
      onToolCall({ toolCall }) {
        console.log(`🛠️ Calling tool: ${toolCall.toolName}`);
      },
      
      // Handle tool results
      onToolResult({ toolCall, result }) {
        console.log(`✅ Tool ${toolCall.toolName} completed:`, result.success ? 'Success' : 'Failed');
      }
    });

    console.log('🤖 AI response generated successfully');

    // Return streaming response compatible with useChat
    return result.toDataStreamResponse({
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error: any) {
    console.error('❌ Chat API error:', error);
    
    // Handle specific AI SDK errors
    if (error.name === 'NoSuchToolError') {
      return new Response(
        JSON.stringify({ 
          error: '🔧 The requested tool is not available. Please try a different approach.',
          details: error.message 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    } else if (error.name === 'InvalidToolArgumentsError') {
      return new Response(
        JSON.stringify({ 
          error: '📝 Invalid parameters provided. Please check your request and try again.',
          details: error.message 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    } else if (error.name === 'ToolExecutionError') {
      return new Response(
        JSON.stringify({ 
          error: '⚠️ QuickBooks operation failed. Please check your connection and try again.',
          details: error.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Generic error handling
    return new Response(
      JSON.stringify({ 
        error: '🤖 I encountered an error processing your request. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
} 