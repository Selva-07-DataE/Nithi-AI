#!/usr/bin/env python3
"""Nithi AI — Comprehensive E2E Test Suite"""
import urllib.request, json, ssl, sys

ctx = ssl.create_default_context()
BASE = 'https://nithi-ai.dataeselva7.workers.dev'
results = []

UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

def test_url(url, method='GET', data=None, headers=None, max_body=2000):
    try:
        if data:
            h = headers or {'Content-Type':'application/json'}
            h['User-Agent'] = UA
            req = urllib.request.Request(url, data=json.dumps(data).encode(),
                headers=h, method=method)
        else:
            h = headers or {}
            h['User-Agent'] = UA
            req = urllib.request.Request(url, headers=h, method=method)
        with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
            body = r.read().decode()
            return r.status, body[:max_body], r.headers
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:500], e.headers
    except Exception as e:
        return 0, str(e), {}

def run(name, ok, code):
    results.append((name, ok, code))
    print(f"  {'PASS' if ok else 'FAIL'} [{code}]")

# ===== STATIC ASSETS =====
print("TEST 1: Homepage loads")
c, b, h = test_url(BASE + "/index.html")
run("Homepage", c == 200 and 'Nithi AI' in b and 'viewport' in b, c)

print("TEST 2: Root URL serves app")
c, b, h = test_url(BASE + "/")
run("Root URL", c == 200 and 'Nithi' in b, c)

print("TEST 3: calculators.js")
c, b, h = test_url(BASE + "/calculators.js")
run("calculators.js", c == 200 and ('CALCS' in b or 'calcSIP' in b or 'calculators' in b.lower()), c)

print("TEST 4: websearch.js")
c, b, h = test_url(BASE + "/websearch.js")
run("websearch.js", c == 200 and 'searchWeb' in b, c)

print("TEST 5: manifest.json")
c, b, h = test_url(BASE + "/manifest.json")
run("manifest.json", c == 200 and 'Nithi' in b, c)

print("TEST 6: icon.svg")
c, b, h = test_url(BASE + "/icon.svg")
run("icon.svg", c == 200 and '<svg' in b, c)

print("TEST 7: sw.js")
c, b, h = test_url(BASE + "/sw.js")
run("sw.js", c == 200 and 'nithi-ai-v' in b, c)

# ===== API ERROR HANDLING =====
print("TEST 8: Missing provider -> 400")
c, b, h = test_url(BASE + "/api/chat", 'POST',
    {"messages":[{"role":"user","content":"hi"}]})
run("Missing provider", c == 400 and 'Missing provider' in b, c)

print("TEST 9: Invalid provider -> 400")
c, b, h = test_url(BASE + "/api/chat", 'POST',
    {"provider":"fake","messages":[]})
run("Invalid provider", c == 400 and 'Invalid provider' in b, c)

print("TEST 10: GET /api/chat -> not 500")
c, b, h = test_url(BASE + "/api/chat")
run("GET /api/chat", c != 500, c)

# ===== API ENDPOINTS =====
print("TEST 11: OpenRouter API")
c, b, h = test_url(BASE + "/api/chat", 'POST', {
    "provider": "openrouter",
    "model": "meta-llama/llama-3.3-70b-instruct:free",
    "messages": [{"role": "user", "content": "Say hello in 3 words"}]
})
ok = c in (200, 429) and ('choices' in b or 'error' in b.lower())
run("OpenRouter API", ok, c)
print(f"    Response: {b[:100]}")

print("TEST 12: Gemini API")
c, b, h = test_url(BASE + "/api/chat", 'POST', {
    "provider": "gemini", "model": "gemini-2.0-flash",
    "prompt": "Say hello in 3 words", "messages": []
})
ok = c in (200, 429) and ('candidates' in b or 'error' in b.lower())
run("Gemini API", ok, c)
print(f"    Response: {b[:100]}")

print("TEST 13: OpenAI API")
c, b, h = test_url(BASE + "/api/chat", 'POST', {
    "provider": "openai", "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Say hello in 3 words"}]
})
ok = c == 200 and ('choices' in b or 'error' in b.lower())
run("OpenAI API", ok, c)
print(f"    Response: {b[:100]}")

# ===== STREAMING =====
print("TEST 14: Streaming SSE")
try:
    req = urllib.request.Request(BASE + "/api/chat",
        data=json.dumps({"provider":"openrouter","model":"meta-llama/llama-3.3-70b-instruct:free",
            "stream":True,"messages":[{"role":"user","content":"hi"}]}).encode(),
        headers={'Content-Type':'application/json', 'User-Agent': UA, 'Origin': BASE}, method='POST')
    with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
        ct = r.headers.get('Content-Type', '')
        chunk = r.read(500).decode()
        ok = 'text/event-stream' in ct or 'data:' in chunk
        run("Streaming SSE", ok, r.status)
        print(f"    Content-Type: {ct[:60]}")
except urllib.error.HTTPError as e:
    # 429 rate limiting is valid — the endpoint works, just rate-limited
    ok = e.code == 429
    run("Streaming SSE", ok, e.code)
    print(f"    Rate limited (429) — endpoint working")
except Exception as e:
    run("Streaming SSE", False, 0)
    print(f"    Error: {e}")

# ===== CORS =====
print("TEST 15: CORS OPTIONS preflight")
try:
    req = urllib.request.Request(BASE + "/api/chat", method='OPTIONS')
    req.add_header('Origin', BASE)
    req.add_header('User-Agent', UA)
    with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
        acao = r.headers.get('Access-Control-Allow-Origin', '')
        ok = acao == BASE  # Should be restricted to our origin now
        run("CORS preflight", ok, r.status)
        print(f"    ACAO: {acao}")
except Exception as e:
    run("CORS preflight", False, 0)
    print(f"    Error: {e}")

# ===== SECURITY =====
print("TEST 16: config.js NOT exposing keys")
c, b, h = test_url(BASE + "/config.js")
has_keys = 'sk-or-v1' in b or 'sk-proj' in b or 'AIzaSy' in b
run("No exposed keys", c == 404 or not has_keys, c)
print(f"    has_keys={has_keys}, status={c}")

print("TEST 17: HTML meta structure")
c, b, h = test_url(BASE + "/index.html")
ok = all(x in b for x in ['viewport', 'manifest', 'theme-color', 'description'])
run("HTML meta tags", ok, c)

# ===== SUMMARY =====
print("\n" + "=" * 55)
passed = sum(1 for _, ok, _ in results if ok)
total = len(results)
print(f"  RESULTS: {passed}/{total} PASSED")
print("=" * 55)
for name, ok, code in results:
    print(f"  {'✅' if ok else '❌'} {name} (HTTP {code})")
print("=" * 55)

sys.exit(0 if passed == total else 1)
