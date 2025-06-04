// Simple test for chat functionality from browser console
console.log('Testing chat API from browser...');

fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello! Can you help me with my invoices?' }
    ]
  }),
})
.then(response => {
  console.log('Response status:', response.status);
  return response.text();
})
.then(data => {
  console.log('✅ Chat API Response:', data.substring(0, 500));
})
.catch(error => {
  console.error('❌ Error:', error);
}); 