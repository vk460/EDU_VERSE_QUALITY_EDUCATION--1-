require('dotenv').config();
const { generateGeminiQuestion } = require('./geminiGenerator');

(async () => {
  console.log('Testing gemini...');
  const res = await generateGeminiQuestion('logical', 'Medium');
  console.log('Result:', res);
})();
