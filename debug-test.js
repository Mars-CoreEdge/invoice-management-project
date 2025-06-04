// Simple test to check basic functionality
console.log('Testing basic functionality...');

// Test 1: Check if we can make a simple API call
async function testAPI() {
  try {
    const response = await fetch('http://localhost:3003/api/test-openai');
    const data = await response.json();
    console.log('✅ OpenAI API test:', data);
  } catch (error) {
    console.log('❌ OpenAI API test failed:', error.message);
  }
  
  try {
    const response = await fetch('http://localhost:3003/api/test-oauth');
    const data = await response.json();
    console.log('✅ OAuth test:', data.success ? 'Working' : 'Failed');
  } catch (error) {
    console.log('❌ OAuth test failed:', error.message);
  }
}

// Test 2: Check Chat API with a simple message
async function testChat() {
  try {
    const response = await fetch('http://localhost:3003/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello, can you help me with invoices?' }
        ]
      }),
    });
    
    if (response.ok) {
      console.log('✅ Chat API responds successfully');
      const text = await response.text();
      if (text && text.length > 0) {
        console.log('✅ Chat API returns response:', text.substring(0, 100) + '...');
      }
    } else {
      console.log('❌ Chat API failed with status:', response.status);
    }
  } catch (error) {
    console.log('❌ Chat API test failed:', error.message);
  }
}

// Run tests
if (typeof window === 'undefined') {
  // Node.js environment
  import('node-fetch').then(({ default: fetch }) => {
    global.fetch = fetch;
    testAPI().then(() => testChat());
  });
} else {
  // Browser environment
  testAPI().then(() => testChat());
} 