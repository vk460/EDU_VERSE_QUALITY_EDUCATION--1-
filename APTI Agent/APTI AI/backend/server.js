require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const { getQuestion, getBatchQuestions } = require('./questionEngine'); // Keep getQuestion for now, as the instruction only modifies geminiGenerator
const { analyzePerformance } = require('./analysisAgent'); // Added analysisAgent import

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main endpoint
app.get('/api/question', async (req, res) => {
  try {
    const { topic = 'quant', subtopic = 'General', difficulty = 'Medium' } = req.query;
    const question = await getQuestion(topic, subtopic, difficulty);
    res.json(question);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Batch generation streak endpoint
app.post('/api/streak', async (req, res) => {
  try {
    const { topic, subtopic, difficulty, count, userId } = req.body;
    const size = parseInt(count) || 15;
    const questions = await getBatchQuestions(topic, subtopic, difficulty, size, userId);
    res.json({ 
      questions, 
      total_questions: size,
      topic,
      difficulty
    });
  } catch (err) {
    if (err.message === 'API_QUOTA_EXCEEDED') {
      console.error('Gemini API Quota Exceeded! Informing client.');
      return res.status(429).json({ error: 'API_QUOTA_EXCEEDED' });
    }
    console.error('Streak gen error:', err);
    res.status(500).json({ error: 'Failed to generate streak batch' });
  }
});

// Deep AI Performance Analysis via Analysis Agent
app.post('/api/analyze-streak', async (req, res) => {
  try {
    const { topic, subtopic, difficulty, streak, sessionRecord } = req.body;
    
    const correctCount = sessionRecord.filter(r => r.isCorrect).length;
    let avgTime = sessionRecord.reduce((sum, r) => sum + r.timeSpent, 0) / (sessionRecord.length || 1);
    
    // Construct standardized performance record for the Analysis Agent
    const telemetry = {
      topic,
      subtopic,
      difficulty,
      total_questions: streak,
      total_correct: correctCount,
      average_time_seconds: Math.round(avgTime),
      question_breakdown: sessionRecord.map((r, i) => ({
        id: i + 1,
        question_preview: r.q.substring(0, 50),
        time_spent: r.timeSpent,
        is_correct: r.isCorrect
      }))
    };

    const analysisObj = await analyzePerformance(telemetry);
    res.json({ analysis: analysisObj });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze streak' });
  }
});

app.post('/api/generate-custom', async (req, res) => {
  try {
    const { prompt } = req.body;
    const { generateFromPrompt } = require('./geminiGenerator');
    const result = await generateFromPrompt(prompt);
    res.json(result);
  } catch (err) {
    console.error('Custom Gen Error:', err);
    res.status(500).json({ error: 'Failed to generate' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const { chatWithGemini } = require('./geminiGenerator');
    const responseText = await chatWithGemini(messages);
    res.json({ text: responseText });
  } catch (err) {
    console.error('Chat Route Error:', err);
    res.status(500).json({ error: 'Chat setup failed' });
  }
});

/* ═════════════════════════════════════════════════════
   GAMIFICATION ENDPOINTS
   ═════════════════════════════════════════════════════ */

app.post('/api/user/sync', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  db.get('SELECT * FROM users WHERE user_id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      res.json({ user: row });
    } else {
      const adjectives = ['Quantum', 'Astro', 'Cyber', 'Neon', 'Stealth', 'Hyper', 'Nova'];
      const nouns = ['Coder', 'Ninja', 'Master', 'Spectre', 'Rider', 'Pulse', 'Spark'];
      const randomName = adjectives[Math.floor(Math.random() * adjectives.length)] + 
                         nouns[Math.floor(Math.random() * nouns.length)] + 
                         Math.floor(Math.random() * 999);
      
      db.run('INSERT INTO users (user_id, username, xp) VALUES (?, ?, 0)', [userId, randomName], function(err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ user: { id: this.lastID, user_id: userId, username: randomName, xp: 0 } });
      });
    }
  });
});

app.post('/api/user/add-xp', (req, res) => {
  const { userId, xp } = req.body;
  if (!userId || !xp) return res.status(400).json({ error: 'Missing parameters' });

  db.run('UPDATE users SET xp = xp + ? WHERE user_id = ?', [xp, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT xp FROM users WHERE user_id = ?', [userId], (err2, row) => {
      res.json({ new_xp: row ? row.xp : 0 });
    });
  });
});

app.get('/api/leaderboard', (req, res) => {
  const query = 'SELECT username, xp FROM users ORDER BY xp DESC LIMIT 10';
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ leaderboard: rows });
  });
});

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
