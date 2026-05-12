const db = require('./db');
const { generateGeminiQuestion } = require('./geminiGenerator');
const { generateLocalQuestion } = require('./localModelGen');
const { generateTemplateQuestion } = require('./templateGenerator');
const { validateQuestion } = require('./validator');

// Internal function to save question to DB. Returns inserted ID.
function saveQuestionToDb(topic, subtopic, difficulty, qData, source) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO questions (topic, subtopic, difficulty, question, options, correct_answer, solution, hint, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const optionsStr = JSON.stringify(qData.options);
    db.run(query, [topic, subtopic, difficulty, qData.question, optionsStr, qData.correct_answer, qData.solution, qData.hint || '', source], function(err) {
      if (err) {
        if(err.message.includes('UNIQUE constraint failed')) {
          console.log(`Duplicate question detected, skipped saving (${source})`);
          resolve(false);
        } else {
          console.error(`Failed to save ${source} question to DB:`, err.message);
          resolve(false);
        }
      } else {
        console.log(`Successfully saved new ${source} question to DB (ID: ${this.lastID})`);
        resolve(this.lastID);
      }
    });
  });
}

function recordUserHistory(userId, questionIds) {
  if (!userId || !questionIds || questionIds.length === 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const placeholders = questionIds.map(() => '(?, ?)').join(',');
    const query = `INSERT INTO user_history (user_id, question_id) VALUES ${placeholders}`;
    const params = [];
    questionIds.forEach(id => params.push(userId, id));
    db.run(query, params, (err) => {
      if (err) console.error("Error recording user history:", err.message);
      resolve();
    });
  });
}

function fetchBatchFromDb(topic, subtopic, difficulty, count, userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM questions 
      WHERE topic = ? AND subtopic = ? AND difficulty = ? 
      AND id NOT IN (SELECT question_id FROM user_history WHERE user_id = ?)
      ORDER BY RANDOM() LIMIT ?
    `;
    db.all(query, [topic, subtopic, difficulty, userId || 'anonymous', count], (err, rows) => {
      if (err) {
        console.error('Error batch fetching from DB:', err.message);
        resolve([]);
      } else {
        rows.forEach(r => r.options = JSON.parse(r.options));
        resolve(rows);
      }
    });
  });
}

async function getQuestion(topic, subtopic, difficulty, userId = 'anonymous') {
  // Graceful fallback single fetcher
  const batch = await getBatchQuestions(topic, subtopic, difficulty, 1, userId);
  return batch.length > 0 ? batch[0] : null;
}

async function getBatchQuestions(topic, subtopic, difficulty, count, userId) {
  const questions = [];
  const activeUserId = userId || 'anonymous';
  
  // 1. Dataset First Priority Rule
  const dbBatch = await fetchBatchFromDb(topic, subtopic, difficulty, count, activeUserId);
  questions.push(...dbBatch);
  
  const deficit = count - questions.length;
  
  // 2. AI Generator for the Deficit 
  if (deficit > 0) {
    const excludeTexts = questions.map(q => q.question);
    for (let i = 0; i < deficit; i++) {
      let source = Math.random() < 0.6 ? 'gemini' : 'template';
      let qData = null;
      let retries = 0;
      let valid = false;

      while (retries < 5 && !valid) {
        if (source === 'gemini') {
            qData = await generateGeminiQuestion(topic, subtopic, difficulty);
            // Catch hard API exhaustion or invalid API keys 
            if (!qData || qData.errorType === 'quota_exceeded') {
                console.warn(`[Bridge] API Error or Quota Empty. Offloading constraint "${subtopic}" to local apti-llm engine.`);
                source = 'local';
                qData = await generateLocalQuestion(topic, subtopic, difficulty);
            }
        } else if (source === 'local') {
            qData = await generateLocalQuestion(topic, subtopic, difficulty);
        } else {
            qData = generateTemplateQuestion(topic, subtopic, difficulty);
        }

        if (qData && validateQuestion(qData, topic, subtopic) && !excludeTexts.includes(qData.question)) {
            valid = true;
        } else {
            retries++;
            // If Local is the active anchor, keep local. Else force AI.
            if (source !== 'local') source = 'gemini'; 
            console.warn(`[Fail-Safe] Validation failed or duplicate detected for ${subtopic} via ${source}. Retrying... (${retries}/5)`);
        }
      }

      if (!valid) {
          console.error(`[Fail-Safe] Critical validation failure after max retries. Overriding with strict template fallback.`);
          qData = { ...generateTemplateQuestion(topic, subtopic, difficulty), source: 'template' };
          source = 'template';
      }

      qData.source = source;
      const insertedId = await saveQuestionToDb(topic, subtopic, difficulty, qData, source);
      if (insertedId) {
         qData.id = insertedId;
      }
      questions.push(qData);
      excludeTexts.push(qData.question);
    }
  }

  // 3. Mark all fetched / newly generated questions in the persistent user history
  const validIds = questions.filter(q => q.id).map(q => q.id);
  await recordUserHistory(activeUserId, validIds);
  
  return questions;
}

module.exports = { getQuestion, getBatchQuestions };
