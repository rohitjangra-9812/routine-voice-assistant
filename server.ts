import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Gemini AI endpoint for smart schedule summary and daily briefing
  app.post('/api/ai/briefing', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const { events } = req.body;
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are a professional daily routine assistant and meeting scheduler.
Analyze the following schedule items for today:
${JSON.stringify(events, null, 2)}

Provide a concise, motivating verbal daily briefing script (2-3 sentences max) that can be spoken aloud by text-to-speech, plus 3 actionable productivity tips for managing these events efficiently.
Return valid JSON with keys:
- "spokenBriefing": string (conversational, natural speech format, no markup or special symbols)
- "summary": string (quick overview of schedule)
- "tips": array of 3 strings (actionable productivity tips)
- "workloadLevel": "Light" | "Moderate" | "Busy" | "Intense"
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '{}';
      res.json(JSON.parse(text));
    } catch (err: any) {
      console.error('AI Briefing API Error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate AI briefing' });
    }
  });

  // Vite dev server middleware in non-production
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : true,
        watch: isHmrDisabled ? null : {},
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await vite.transformIndexHtml(
          url,
          `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VoxRoutine - Daily Routine & Meeting Voice Assistant</title>
    <meta name="description" content="Smart daily routine and meeting voice assistant featuring real-time tracking, Web Speech API alerts, desktop notifications, and interactive timeline." />
    <meta property="og:title" content="VoxRoutine - Daily Routine & Meeting Voice Assistant" />
    <meta property="og:description" content="Smart daily routine and meeting voice assistant featuring real-time tracking, Web Speech API alerts, desktop notifications, and interactive timeline." />
    <meta property="og:type" content="website" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <script type="module" src="/src/main.tsx"></script>
  </head>
  <body class="bg-slate-950 text-slate-100 font-sans">
    <div id="root"></div>
  </body>
</html>`
        );
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
