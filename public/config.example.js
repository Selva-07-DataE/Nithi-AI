// Nithi AI Configuration — LOCAL DEVELOPMENT ONLY
// Copy this file to config.js and fill in your API keys
// config.js is .gitignored and will NOT be pushed to GitHub
//
// For Cloudflare Pages deployment: keys are set as Environment Secrets
// in the Cloudflare dashboard, NOT in this file.

const CONFIG = {
  OPENROUTER_API_KEY: "your-openrouter-key-here",
  MODELS: [
    { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B" },
    { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B" },
    { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "Mistral Small 3.1" }
  ],
  GEMINI_API_KEY: "your-gemini-key-here",
  GEMINI_MODEL: "gemini-2.0-flash",
  OPENAI_API_KEY: "your-openai-key-here",
  OPENAI_MODEL: "gpt-5.4-nano"
};
