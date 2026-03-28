// Cloudflare Worker — API proxy + static assets for Nithi AI
// Secrets are stored as Worker environment variables, never exposed to the client

const ALLOWED_ORIGIN = 'https://nithi-ai.dataeselva7.workers.dev';

function getCorsOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  // Allow same-site requests (no Origin header) and the deployed site
  return (!origin || origin === ALLOWED_ORIGIN) ? ALLOWED_ORIGIN : ALLOWED_ORIGIN;
}

function makeCorsHeaders(request) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(request),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

function makeStreamCorsHeaders(request) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(request),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  };
}

// Allowed providers and model pattern validation
const VALID_PROVIDERS = new Set(['openrouter', 'gemini', 'openai']);
const MODEL_PATTERN = /^[a-zA-Z0-9_.\-\/: ]+$/;

// ===== Web Search Proxy =====
async function handleSearch(request) {
  const corsHeaders = makeCorsHeaders(request);
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    if (!query || query.length > 200) {
      return new Response(JSON.stringify({ error: 'Invalid query' }), { status: 400, headers: corsHeaders });
    }

    const results = [];

    // 1. Google News RSS — returns current news articles
    try {
      const encoded = encodeURIComponent(query);
      const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en-IN&gl=IN&ceid=IN:en`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(rssUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NithiAI/1.0)' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        const xml = await res.text();
        // Parse RSS items with regex (lightweight, no XML parser needed)
        const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
        for (const item of items.slice(0, 6)) {
          const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
          const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
          const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/);
          if (titleMatch) {
            // Title format: "Article title - Source"
            let title = titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
            const source = sourceMatch ? sourceMatch[1].trim() : '';
            // Remove " - Source" from end of title if present
            if (source && title.endsWith(' - ' + source)) {
              title = title.slice(0, -(source.length + 3));
            }
            const date = pubDateMatch ? pubDateMatch[1].trim() : '';
            results.push({
              title: title.trim(),
              snippet: date ? `[${new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}] ${title.trim()}` : title.trim(),
              source: source,
              date: date,
              type: 'news'
            });
          }
        }
      }
    } catch (e) {
      // Google News failed, continue with other sources
    }

    // 2. DuckDuckGo Instant Answer API — encyclopedic/reference info
    try {
      const encoded = encodeURIComponent(query);
      const ddgUrl = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(ddgUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data.AbstractText) {
          results.push({
            title: data.AbstractSource || 'Summary',
            snippet: data.AbstractText,
            url: data.AbstractURL,
            type: 'reference'
          });
        }
        if (data.RelatedTopics) {
          for (const t of data.RelatedTopics.slice(0, 4)) {
            if (t.Text) {
              results.push({
                title: (t.FirstURL || '').split('/').pop()?.replace(/_/g, ' ') || 'Related',
                snippet: t.Text,
                url: t.FirstURL,
                type: 'reference'
              });
            }
          }
        }
      }
    } catch (e) {
      // DDG failed, continue
    }

    return new Response(JSON.stringify({ results, query }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Search failed' }), { status: 500, headers: corsHeaders });
  }
}

async function handleChat(request, env) {
  const corsHeaders = makeCorsHeaders(request);
  const streamCorsHeaders = makeStreamCorsHeaders(request);
  try {
    const body = await request.json();
    const { messages, provider, model, stream } = body;

    if (!provider) {
      return new Response(JSON.stringify({ error: 'Missing provider' }), { status: 400, headers: corsHeaders });
    }

    if (!VALID_PROVIDERS.has(provider)) {
      return new Response(JSON.stringify({ error: 'Invalid provider' }), { status: 400, headers: corsHeaders });
    }

    if (model && !MODEL_PATTERN.test(model)) {
      return new Response(JSON.stringify({ error: 'Invalid model name' }), { status: 400, headers: corsHeaders });
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

    return new Response(JSON.stringify({ error: 'Unknown error' }), { status: 500, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: makeCorsHeaders(request) });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight for API routes
    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': getCorsOrigin(request),
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // API routes
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }

    if (url.pathname === '/api/search' && request.method === 'GET') {
      return handleSearch(request);
    }

    // Everything else — serve static assets from public/
    return env.ASSETS.fetch(request);
  }
};
