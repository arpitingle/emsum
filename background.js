// Service Worker Setup
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
  console.log('Service Worker activated');
});

const OPENROUTER_API_KEY = 'ADD_YOUR_API_KEY_HERE'; // Replace with your OpenRouter API key
const MODEL = 'deepseek/deepseek-chat-v3-0324:free';

async function getSummary(text) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mail.google.com',
        'X-Title': 'Gmail Summary Assistant'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{
          role: "user",
          content: `Summarize this email into 2-3 short paras focusing on key actions and decisions and make it plain text:\n\n${text}`
        }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Summary error:', error);
    throw new Error(error.message.includes('aborted') ? 
      'Request timed out' : 
      'Failed to generate summary'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSummary') {
    getSummary(request.text)
      .then(data => sendResponse({ summary: data.choices[0].message.content }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});