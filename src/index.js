// Cloudflare Worker — API proxy + static assets for Nithi AI
// Secrets are stored as Worker environment variables, never exposed to the client

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const streamCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
};

async function handleChat(request, env) {
  try {
    const body = await request.json();
    const { messages, provider, model, stream } = body;

    if (!provider) {
      return new Response(JSON.stringify({ error: 'Missing provider' }), { status: 400, headers: corsHeaders });
    }

    if (provider === 'openrouter') {
      const apiKey = env.OPENROUTER_API_KEY;
      if (!apiKey) return new Response(JSON.stringify({ error: 'OpenRouter key not configured' }), { status: 500, headers: corsHeaders });

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://nithi-ai.dataeselva7.workers.dev',
          'X-Title': 'Nithi AI'
        },
        body: JSON.stringify({
          model: model || 'meta-llama/llama-3.3-70b-instruct:free',
          messages,
          max_tokens: 800,
          temperature: 0.4,
          stream: !!stream
        })
      });

      if (stream) {
        return new Response(res.body, { status: res.status, headers: streamCorsHeaders });
      }
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: res.status, headers: corsHeaders });
    }

    if (provider === 'gemini') {
      const apiKey = env.GEMINI_API_KEY;
      const geminiModel = model || 'gemini-2.0-flash';
      if (!apiKey) return new Response(JSON.stringify({ error: 'Gemini key not configured' }), { status: 500, headers: corsHeaders });

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: body.prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 800 }
        })
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: res.status, headers: corsHeaders });
    }

    if (provider === 'openai') {
      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) return new Response(JSON.stringify({ error: 'OpenAI key not configured' }), { status: 500, headers: corsHeaders });

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages,
          max_completion_tokens: 800,
          temperature: 0.4,
          stream: !!stream
        })
      });

      if (stream) {
        return new Response(res.body, { status: res.status, headers: streamCorsHeaders });
      }
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: res.status, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Invalid provider' }), { status: 400, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: corsHeaders });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle API proxy route
    if (url.pathname === '/api/chat') {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      }
      if (request.method === 'POST') {
        return handleChat(request, env);
      }
    }

    // Everything else — serve static assets from public/
    return env.ASSETS.fetch(request);
  }
};
