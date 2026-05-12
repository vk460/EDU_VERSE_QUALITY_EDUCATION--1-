const db = require('./db.js');

console.log("Purging all previously cached generated/template questions to clear corrupted subtopic entries...");

db.run(`DELETE FROM questions WHERE source = 'gemini' OR source = 'template'`, (err) => {
    if (err) {
        console.error("Purge Error:", err.message);
    } else {
        console.log("Successfully wiped dirty cache from SQLite. Next fetches will use the new Failsafe LLM logic.");
    }
});
