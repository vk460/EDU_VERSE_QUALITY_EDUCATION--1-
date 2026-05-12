async function generateGeminiQuestion(topic, subtopic, difficulty) {
  let categoryContext = "";
  if (topic.toLowerCase().includes("quant")) {
    categoryContext = "You MUST ONLY generate a Quantitative Aptitude math problem (e.g., Arithmetic, Algebra, Geometry, Time/Speed/Distance). Do NOT generate language or logic puzzles.";
  } else if (topic.toLowerCase().includes("verbal")) {
    categoryContext = "You MUST ONLY generate a Verbal Ability English question (e.g., Grammar, Vocabulary, Synonyms/Antonyms, Error Spotting). Do NOT generate math or number logic problems.";
  } else if (topic.toLowerCase().includes("logic") || topic.toLowerCase().includes("lr")) {
    categoryContext = "You MUST ONLY generate a Logical Reasoning puzzle (e.g., Blood relations, Syllogism, Number Series, Seating Arrangement). Do NOT generate pure math equations or english grammar tasks.";
  } else if (topic.toLowerCase().includes("di") || topic.toLowerCase().includes("data")) {
    categoryContext = "You MUST ONLY generate a Data Interpretation question based on statistics, charts, or tabular data analysis.";
  }

const prompt = `Act as an expert Aptitude Question setter following the renowned "RS Aggarwal Book of Aptitude" standard.
Generate a unique, high-quality test question for the specific category: "${topic}" and subtopic: "${subtopic}", at a "${difficulty}" difficulty level.

CRITICAL RULE: ${categoryContext}
STRICT SUBTOPIC LOCK: You are generating a question for the subtopic "${subtopic}". 
- You MUST ONLY use concepts related strictly to "${subtopic}".
- DO NOT generate questions that combine multiple distinct subtopics (e.g., do not mix Time & Work into a Profit & Loss problem).
- ZERO TOLERANCE for cross-topic leakage. The question must purely test "${subtopic}".

Follow the RS Aggarwal style: realistic difficulty, clear phrasing, and a logical step-by-step solution.
Return ONLY a raw, valid JSON object with NO markdown, NO code fences, and NO backticks.

Format strictly as:
{
  "topic": "${topic}",
  "subtopic": "${subtopic}",
  "difficulty": "${difficulty}",
  "question": "The RS Aggarwal style question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": "Option C (Exact text match from options)",
  "solution": "Clear, step-by-step explanation of how to solve it.",
  "hint": "A 1-2 line helpful clue or principle that guides the user without revealing the final answer."
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
          return { errorType: 'quota_exceeded' };
      }
      const errText = await response.text();
      console.log("Error from Gemini API:", errText);
      return null;
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean up potential markdown formatting the model might still produce
    text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    const questionData = JSON.parse(text);
    return questionData;
  } catch (error) {
    console.log("Error generating question from Gemini:", error);
    return null;
  }
}

async function generateFromPrompt(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("Custom generate error:", err);
    return null;
  }
}

async function chatWithGemini(messages) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  // Gemini requires the first message to be from the user, so strip any initial model greetings
  const activeMessages = messages.length > 0 && messages[0].role === 'model' 
    ? messages.slice(1) 
    : messages;

  const contents = activeMessages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: { parts: [{ text: "You are APTI AI, a helpful and concise aptitude tutor. Help users clear their concepts, solve math or logic queries, and gently guide them. Format code or formulas neatly if needed." }] },
        generationConfig: { temperature: 0.7 }
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.error("Chat Error:", err);
    return null;
  }
}

module.exports = { generateGeminiQuestion, generateFromPrompt, chatWithGemini };
