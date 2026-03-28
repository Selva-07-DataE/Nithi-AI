// ===== NITHI AI WEB SEARCH (Auto-Grounding) =====
let webSearchEnabled = true; // Always ON by default

function toggleWebSearch() {
  webSearchEnabled = !webSearchEnabled;
  const btn = document.getElementById('webSearchBtn');
  btn.classList.toggle('active', webSearchEnabled);
  btn.title = webSearchEnabled ? 'Web search ON (auto) — click to disable' : 'Web search OFF — click to enable';
  showToast(webSearchEnabled ? '🌐 Web search enabled (auto)' : '🔒 Web search disabled');
}

async function searchWeb(query) {
  if (!webSearchEnabled) return null;

  // Try multiple sources for better grounding
  const results = await Promise.allSettled([
    searchDuckDuckGo(query),
    searchWikipedia(query)
  ]);

  let allResults = [];
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value) allResults.push(...r.value);
  });

  if (allResults.length === 0) return null;

  // Deduplicate by snippet similarity
  const seen = new Set();
  allResults = allResults.filter(r => {
    const key = r.snippet.substring(0, 80).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let context = 'WEB SEARCH RESULTS for "' + query + '" (auto-grounded):\n\n';
  allResults.slice(0, 8).forEach((r, i) => {
    context += `${i+1}. **${r.title}**: ${r.snippet}`;
    if (r.url) context += ` (Source: ${r.url})`;
    context += '\n\n';
  });

  return context;
}

async function searchDuckDuckGo(query) {
  try {
    const encoded = encodeURIComponent(query);
    // DDG Instant Answer API supports CORS natively for JSON format
    const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();

    let results = [];

    if (data.AbstractText) {
      results.push({ title: data.AbstractSource || 'Summary', snippet: data.AbstractText, url: data.AbstractURL });
    }

    if (data.RelatedTopics) {
      data.RelatedTopics.slice(0, 5).forEach(t => {
        if (t.Text) results.push({ title: t.FirstURL?.split('/').pop()?.replace(/_/g,' ') || 'Related', snippet: t.Text, url: t.FirstURL });
        if (t.Topics) t.Topics.slice(0, 2).forEach(st => {
          if (st.Text) results.push({ title: st.FirstURL?.split('/').pop()?.replace(/_/g,' ') || 'Related', snippet: st.Text, url: st.FirstURL });
        });
      });
    }

    if (data.Infobox?.content) {
      data.Infobox.content.slice(0, 3).forEach(i => {
        results.push({ title: i.label, snippet: String(i.value) });
      });
    }

    return results;
  } catch(e) {
    console.log('DuckDuckGo search failed:', e.message);
    return [];
  }
}

async function searchWikipedia(query) {
  // Try both: page summary (fast, specific) + search API (broader results)
  const results = [];

  // 1. Direct page summary for exact topic
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.extract && data.extract.length > 50) {
        results.push({ title: data.title || query, snippet: data.extract, url: data.content_urls?.desktop?.page });
      }
    }
  } catch(e) {
    console.log('Wikipedia summary failed:', e.message);
  }

  // 2. Search API for broader results
  try {
    const encoded = encodeURIComponent(query + ' India finance');
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&srlimit=5&format=json&origin=*`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const searchResults = data?.query?.search || [];
      searchResults.forEach(sr => {
        const snippet = sr.snippet.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        if (snippet.length > 30) {
          results.push({ title: sr.title, snippet: snippet, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(sr.title)}` });
        }
      });
    }
  } catch(e) {
    console.log('Wikipedia search failed:', e.message);
  }

  return results;
}

function getSearchPromptAddition(searchResults) {
  if (!searchResults) return '';
  return `\n\nIMPORTANT: The following web search results have been automatically retrieved to help you answer with the latest information. Use this data as reference and cite sources when applicable. If the information is relevant, incorporate it. If the web results conflict with your knowledge, prefer the more recent web data and note the discrepancy. Begin your response with "🌐 " when using web data.\n\n${searchResults}`;
}
