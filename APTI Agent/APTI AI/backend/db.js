const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'apti.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

function initDb() {
  const query = `
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      subtopic TEXT DEFAULT 'General',
      difficulty TEXT NOT NULL,
      question TEXT NOT NULL UNIQUE,
      options TEXT NOT NULL, -- JSON string array
      correct_answer TEXT NOT NULL,
      solution TEXT NOT NULL,
      hint TEXT DEFAULT '', -- Short hint string
      source TEXT NOT NULL, -- 'database', 'gemini', 'template'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.run(query, (err) => {
    if (err) console.error('Error creating questions table:', err.message);
    else {
      db.run("ALTER TABLE questions ADD COLUMN subtopic TEXT DEFAULT 'General'", () => {});
      db.run("ALTER TABLE questions ADD COLUMN hint TEXT DEFAULT ''", () => {});
    }
  });

  const historyQuery = `
    CREATE TABLE IF NOT EXISTS user_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.run(historyQuery, (err) => {
    if (err) console.error('Error creating user_history table:', err.message);
  });

  const usersQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.run(usersQuery, (err) => {
    if (err) console.error('Error creating users table:', err.message);
  });
}

initDb();

module.exports = db;
