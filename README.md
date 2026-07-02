# RecruitIQ

AI-powered recruitment platform that ranks candidates by understanding career trajectory, skill depth, and behavioral signals rather than just keyword matching.

## Features

- Multi-dimensional scoring: technical depth, leadership, growth potential, communication
- Hidden transferable skill detection
- Explainable AI with strengths, weaknesses, and risks per candidate
- Drag & drop resume upload (PDF, DOCX, TXT)
- Edit, delete, and recalculate candidate scores
- AI Recruiter Copilot chat assistant
- Radar charts, skill comparison, and interview question generator
- Analytics dashboard with KPIs and hiring insights
- Head-to-head candidate comparison with AI verdicts

## Setup

1. Install dependencies
```bash
npm install
```

2. Get a free API key from https://console.groq.com

3. Create your environment file
```bash
cp .env.example .env
```

4. Add your API key to `.env`
```
GROQ_API_KEY=gsk_your_key_here
```

5. Run the application
```bash
npm run dev
```

Open http://localhost:5173

## Usage

1. Click "Start Recruiting" on the landing page
2. Paste your job description in the Setup page
3. Review the candidate list and click "Run AI Analysis"
4. Browse ranked results on the Candidates page
5. View analytics, chat with Copilot, or compare candidates

## Adding Candidates

On the Candidates page, click "+ Add Candidate", fill in the form, paste the resume text, and click Add. The AI will automatically score the candidate.

## Architecture

- Frontend: React with Vite
- Backend: Express.js server
- AI: Groq API with Llama models
- Resume parsing: pdf-parse and mammoth for PDF/DOCX files
- Data persistence: localStorage for candidate and analysis data

## Tech Stack

- React 18
- Vite
- Express.js
- Groq API (Llama models)
- Recharts (data visualization)
- Tailwind CSS (styling)

## License

MIT
