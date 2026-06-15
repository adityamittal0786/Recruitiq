import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app  = express();
const PORT = process.env.PORT || 3001;

// Model routing:
// - Bulk candidate analysis → llama-3.1-8b-instant  (131,072 TPM limit on free tier)
// - JD analysis / Copilot  → llama-3.3-70b-versatile (smarter, used sparingly)
const MODEL_BULK  = 'llama-3.1-8b-instant';
const MODEL_SMART = 'llama-3.3-70b-versatile';

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173', 'https://recruitiq-rho.vercel.app'] }));
app.use(express.json({ limit: '10mb' }));

async function callGroq(body, attempt = 1) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set in .env file');

  // Choose model based on request flag, fallback to smart model
  const useBulk = body._bulk === true;
  const model   = useBulk ? MODEL_BULK : MODEL_SMART;
  const { _bulk, ...cleanBody } = body;  // strip internal flag

  const groqMessages = [];
  if (cleanBody.system) groqMessages.push({ role: 'system', content: cleanBody.system });
  groqMessages.push(...(cleanBody.messages || []));

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages:   groqMessages,
      max_tokens: cleanBody.max_tokens || 1500,
    })
  });

  // Auto-retry on rate limit
  if (res.status === 429) {
    const err  = await res.json().catch(() => ({}));
    const msg  = err?.error?.message || '';
    const wait = (() => {
      const m = msg.match(/try again in ([\d.]+)s/);
      return m ? Math.ceil(parseFloat(m[1]) * 1000) + 800 : 15000;
    })();

    if (attempt <= 4) {
      console.log(`[Rate limit] waiting ${(wait/1000).toFixed(1)}s then retrying (attempt ${attempt}/4)…`);
      await new Promise(r => setTimeout(r, wait));
      return callGroq({ ...body, _bulk: useBulk }, attempt + 1);
    }
    throw new Error(`Rate limit persisted after 4 retries: ${msg}`);
  }

  if (!res.ok) {
    const e = await res.text();
    throw new Error(`Groq ${res.status}: ${e}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  // Return in Anthropic-compatible format so api.js needs no changes
  return { content: [{ type: 'text', text }] };
}

app.post('/api/claude', async (req, res) => {
  try {
    const result = await callGroq(req.body);
    res.json(result);
  } catch (err) {
    console.error('[Server Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 RecruitIQ server → http://localhost:${PORT}`);
  console.log(`   Bulk model : ${MODEL_BULK}`);
  console.log(`   Smart model: ${MODEL_SMART}`);
  if (!process.env.GROQ_API_KEY) console.warn('\n⚠️  GROQ_API_KEY not set!\n');
  else console.log('✅  API key loaded\n');
});
