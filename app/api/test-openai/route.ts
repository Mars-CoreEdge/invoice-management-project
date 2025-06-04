import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    console.log('=== OpenAI API Test ===');
    
    // Test if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('OpenAI API Key available:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    console.log('API Key starts with sk-:', apiKey?.startsWith('sk-') || false);
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not found in environment variables'
      });
    }
    
    // Test actual API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const isValid = response.ok;
    console.log('OpenAI API Response Status:', response.status);
    
    if (!isValid) {
      const errorText = await response.text();
      console.log('OpenAI API Error:', errorText);
      return NextResponse.json({
        success: false,
        error: `OpenAI API Error: ${response.status} - ${errorText}`,
        status: response.status
      });
    }
    
    const models = await response.json();
    console.log('OpenAI API working, found models:', models.data?.length || 0);
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI API is working correctly',
      modelCount: models.data?.length || 0,
      hasGPT4: models.data?.some((m: any) => m.id.includes('gpt-4')) || false
    });
    
  } catch (error: any) {
    console.error('OpenAI test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
} 