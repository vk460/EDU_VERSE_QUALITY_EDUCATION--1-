const { exec } = require('child_process');
const path = require('path');

/**
 * Attempts to generate a question using the local fine-tuned LoRA model (apti-llm).
 * Because running inference directly in Node is complex without bindings, 
 * this calls a minimal python script that loads the adapter to generate text.
 */
function generateLocalQuestion(topic, subtopic, difficulty) {
  return new Promise((resolve) => {
    // Determine strict constraints
    let constraint = "";
    if (topic.includes("quant")) constraint = "Quantitative Math only.";
    else if (topic.includes("verbal")) constraint = "Verbal English grammar only.";
    else if (topic.includes("logi") || topic.includes("lr")) constraint = "Logical reasoning puzzle only.";
    else if (topic.includes("di")) constraint = "Data interpretation only.";

    const promptText = `RS Aggarwal style. Topic: ${topic}. Subtopic: ${subtopic}. Difficulty: ${difficulty}. ${constraint} Provide JSON: {"topic":"${topic}", "subtopic":"${subtopic}", "difficulty":"${difficulty}", "question":"", "options":["A","B","C","D"], "correct_answer":"", "solution":"", "hint":""}`;
    
    // Note: To truly run the LoRA safetensors, the user needs PyTorch/Transformers installed.
    // If this fails, we gracefully fallback to Gemini.
    const pyScript = path.join(__dirname, 'run_local_model.py');
    
    exec(`python "${pyScript}" "${promptText}"`, { timeout: 25000 }, (error, stdout, stderr) => {
      if (error) {
        console.log("Local model failed to load or timed out. Falling back to Gemini.");
        return resolve(null);
      }
      
      try {
        // Strip out any non-JSON garbage the model might spit out
        const match = stdout.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.question && parsed.options && parsed.correct_answer) {
             return resolve(parsed);
          }
        }
        resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  });
}

module.exports = { generateLocalQuestion };
