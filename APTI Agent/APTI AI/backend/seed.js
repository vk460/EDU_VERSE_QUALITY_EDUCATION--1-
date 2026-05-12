const db = require('./db');

const initialQuestions = [
  {
    topic: 'quant',
    difficulty: 'Easy',
    question: 'If a triangle has a base of 10cm and height of 5cm, what is its area?',
    options: '["25 cm²", "50 cm²", "15 cm²", "100 cm²"]',
    correct_answer: '25 cm²',
    solution: 'Area = (base * height) / 2 = (10 * 5) / 2 = 50 / 2 = 25 cm².',
    source: 'database'
  },
  {
    topic: 'logical',
    difficulty: 'Medium',
    question: 'Find the odd one out: 2, 3, 5, 7, 9, 11',
    options: '["2", "5", "9", "11"]',
    correct_answer: '9',
    solution: '9 is the only non-prime number in the sequence. The rest are prime numbers.',
    source: 'database'
  }
];

function seed() {
  const query = `
    INSERT INTO questions (topic, difficulty, question, options, correct_answer, solution, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.serialize(() => {
    initialQuestions.forEach((q) => {
      db.run(query, [q.topic, q.difficulty, q.question, q.options, q.correct_answer, q.solution, q.source], function(err) {
        if (err) {
          if (!err.message.includes('UNIQUE constraint')) {
            console.error('Seed error:', err.message);
          }
        } else {
          console.log(`Seeded question ID: ${this.lastID}`);
        }
      });
    });
    console.log('Seeding complete.');
  });
}

// Give table time to be created by db.js
setTimeout(seed, 500);
