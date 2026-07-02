import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const app  = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Model routing:
// - Bulk candidate analysis → llama-3.1-8b-instant  (131,072 TPM limit on free tier)
// - JD analysis / Copilot  → llama-3.3-70b-versatile (smarter, used sparingly)
const MODEL_BULK  = 'llama-3.1-8b-instant';
const MODEL_SMART = 'llama-3.3-70b-versatile';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
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
      temperature: 0, // Set to 0 for deterministic, consistent scoring
      seed: 42,      // Fixed seed for reproducibility
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
  return { content: [{ type: 'text', text }] };
}

app.options('/api/ai');
app.options('/api/extract-resume');

app.post('/api/ai', async (req, res) => {
  try {
    const result = await callGroq(req.body);
    res.json(result);
  } catch (err) {
    console.error('[Server Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Resume text extraction endpoint
app.post('/api/extract-resume', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { mimetype, buffer, originalname } = req.file;
    let text = '';

    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      originalname.match(/\.docx$/i)
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (mimetype === 'text/plain' || originalname.match(/\.(txt|md)$/i)) {
      text = buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.' });
    }

    // Clean up the text
    text = text.replace(/\s+/g, ' ').trim();

    res.json({ text, filename: originalname });
  } catch (err) {
    console.error('[Resume Extraction Error]', err.message);
    res.status(500).json({ error: 'Failed to extract text from resume: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\nRecruitIQ server → http://localhost:${PORT}`);
  console.log(`   Bulk model : ${MODEL_BULK}`);
  console.log(`   Smart model: ${MODEL_SMART}`);
  if (!process.env.GROQ_API_KEY) console.warn('\nWARNING: GROQ_API_KEY not set!\n');
  else console.log('API key loaded\n');
});
