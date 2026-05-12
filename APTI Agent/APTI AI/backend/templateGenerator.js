// A simple template engine for math/logic/verbal/di questions ensuring strict tagging
function generateTemplateQuestion(topic, subtopic, difficulty) {
  const t = topic.toLowerCase();
  
  if (t.includes('quant') || t === 'quantitative') {
    return generateMathTemplate(subtopic, difficulty);
  } else if (t.includes('verbal')) {
    return generateVerbalTemplate(subtopic, difficulty);
  } else if (t.includes('di') || t.includes('data')) {
    return generateDITemplate(subtopic, difficulty);
  } else {
    // Default to logic for anything LR/Logic related
    return generateLogicTemplate(subtopic, difficulty);
  }
}

function generateMathTemplate(subtopic, difficulty) {
  // Strict matching
  let isTrain = false, isProfit = false;
  if (subtopic) {
    if (subtopic.toLowerCase().includes("time") || subtopic.toLowerCase().includes("speed") || subtopic.toLowerCase().includes("distance")) {
      isTrain = true;
    } else if (subtopic.toLowerCase().includes("profit") || subtopic.toLowerCase().includes("loss")) {
      isProfit = true;
    }
  }
  
  if (isTrain) {
    let distance, time;
    if (difficulty === "Easy") {
      distance = (Math.floor(Math.random() * 5) + 2) * 100; // 200 to 600
      time = Math.floor(Math.random() * 4) + 2; // 2 to 5
    } else if (difficulty === "Medium") {
      distance = (Math.floor(Math.random() * 10) + 5) * 50; // 250 to 700
      time = (Math.floor(Math.random() * 5) + 2) + 0.5; // 2.5 to 6.5
    } else {
      distance = (Math.floor(Math.random() * 20) + 10) * 15; // 150 to 450
      time = (Math.floor(Math.random() * 5) + 1) * 0.25; // 0.25 to 1.5
    }
    
    const speed = distance / time;
    const correct = `${speed} km/h`;
    const options = [
      correct,
      `${speed + 10} km/h`,
      `${speed - 10} km/h`,
      `${Math.round(speed * 1.2)} km/h`
    ].sort(() => Math.random() - 0.5);

    return {
      topic: "Quantitative Aptitude",
      subtopic: subtopic || "Time, Speed & Distance",
      difficulty,
      question: `A train travels ${distance} km in ${time} hours. What is its average speed?`,
      options,
      correct_answer: correct,
      solution: `Speed = Distance / Time. Therefore, Speed = ${distance} / ${time} = ${speed} km/h.`,
      hint: "Recall the basic kinematics formula: Speed equates to Distance divided by Time."
    };
  } else if (isProfit) {
    // Template: Profit & Loss
    const cp = (Math.floor(Math.random() * 20) + 10) * 100;
    const profitPercent = Math.floor(Math.random() * 5 + 1) * 10; // 10% to 50%
    const isLoss = Math.random() > 0.5;
    
    const amount = (cp * profitPercent) / 100;
    const sp = isLoss ? cp - amount : cp + amount;
    
    const options = [
      `Rs. ${sp}`,
      `Rs. ${sp + 100}`,
      `Rs. ${sp - 100}`,
      `Rs. ${cp + cp * 0.1}`
    ].sort(() => Math.random() - 0.5);

    return {
      topic: "Quantitative Aptitude",
      subtopic: subtopic || "Profit & Loss",
      difficulty,
      question: `A retailer bought an item for Rs. ${cp}. He sold it at a ${isLoss ? 'loss' : 'profit'} of ${profitPercent}%. Find the selling price.`,
      options,
      correct_answer: `Rs. ${sp}`,
      solution: `${isLoss ? 'Loss' : 'Profit'} = ${profitPercent}% of ${cp} = Rs. ${amount}. Selling Price = Cost Price ${isLoss ? '-' : '+'} ${isLoss ? 'Loss' : 'Profit'} = ${cp} ${isLoss ? '-' : '+'} ${amount} = Rs. ${sp}.`,
      hint: "Calculate the exact percentage of the cost price first, then either add or subtract it from the initial value based on profit or loss."
    };
  } else {
    // Template: Percentage
    const base = (Math.floor(Math.random() * 10) + 2) * 100;
    const percent = Math.floor(Math.random() * 9 + 1) * 5; // 5% to 45%
    const answer = (base * percent) / 100;
    
    const options = [
      `${answer}`,
      `${answer + base * 0.05}`,
      `${answer - base * 0.05}`,
      `${answer + base * 0.1}`
    ].sort(() => Math.random() - 0.5);

    return {
      topic: "Quantitative Aptitude",
      subtopic: subtopic || "Percentage",
      difficulty,
      question: `What is ${percent}% of ${base}?`,
      options,
      correct_answer: `${answer}`,
      solution: `${percent}% of ${base} = (${percent} / 100) * ${base} = ${answer}.`,
      hint: "Remember that 'percent' means 'per 100', so dividing the percentage by 100 and multiplying by the base yields the correct proportion."
    };
  }
}

function generateLogicTemplate(subtopic, difficulty) {
  const st = (subtopic || "").toLowerCase();
  
  if (st.includes("blood")) {
    const templates = [
      () => {
        const chars = ["A", "B", "C", "D", "P", "Q"].sort(() => Math.random() - 0.5);
        const p1 = chars[0], p2 = chars[1], p3 = chars[2], p4 = chars[3];
        return {
          topic: "Logical Reasoning",
          subtopic: subtopic || "Blood Relations",
          difficulty,
          question: `If ${p1} is the brother of ${p2}, ${p2} is the sister of ${p3}, and ${p3} is the father of ${p4}, how is ${p4} related to ${p1}?`,
          options: ["Nephew/Niece", "Son/Daughter", "Cousin", "Brother"].sort(() => Math.random() - 0.5),
          correct_answer: "Nephew/Niece",
          solution: `${p3} is the father of ${p4}, so ${p4} is the child of ${p3}. ${p1} is the brother of ${p3}'s sister (${p2}), meaning ${p1} is ${p3}'s brother. Therefore, ${p1} is the uncle of ${p4}, and ${p4} is the nephew or niece of ${p1}.`,
          hint: "Trace the family tree step-by-step from the final person back to the target."
        };
      },
      () => {
        const chars = ["M", "N", "O", "X", "Y", "Z"].sort(() => Math.random() - 0.5);
        const p1 = chars[0], p2 = chars[1], p3 = chars[2];
        return {
          topic: "Logical Reasoning",
          subtopic: subtopic || "Blood Relations",
          difficulty,
          question: `${p1} is the mother of ${p2}. ${p2} is the sister of ${p3}. How is ${p1} related to ${p3}?`,
          options: ["Mother", "Aunt", "Sister", "Grandmother"].sort(() => Math.random() - 0.5),
          correct_answer: "Mother",
          solution: `Since ${p2} and ${p3} are siblings (${p2} is the sister of ${p3}), the mother of ${p2} (${p1}) is inherently the mother of ${p3} as well.`,
          hint: "Identify the sibling bond first; siblings share the same parents."
        };
      },
      () => {
        const names = ["a man", "a boy", "a gentleman"].sort(() => Math.random() - 0.5);
        const subjects = ["a woman", "a girl", "a lady"].sort(() => Math.random() - 0.5);
        const m = names[0], f = subjects[0];
        return {
          topic: "Logical Reasoning",
          subtopic: subtopic || "Blood Relations",
          difficulty,
          question: `Pointing purely to a photograph of ${m}, ${f} said, "His mother is the only daughter of my mother." How is the ${f.split(' ')[1]} related to the ${m.split(' ')[1]} in the photograph?`,
          options: ["Mother", "Aunt", "Sister", "Wife"].sort(() => Math.random() - 0.5),
          correct_answer: "Mother",
          solution: `The 'only daughter of my mother' is the woman herself. Therefore, the man's mother is the woman herself. The woman is the mother of the man.`,
          hint: "Break down the quoted relationship: who is the 'only daughter of my mother'?"
        };
      }
    ];
    return templates[Math.floor(Math.random() * templates.length)]();
  } else if (st.includes("seating") || st.includes("arrangement")) {
    const arr = ["John", "Mary", "Leo", "Sam", "Paul"].sort(() => Math.random() - 0.5);
    return {
      topic: "Logical Reasoning",
      subtopic: subtopic || "Seating Arrangement",
      difficulty,
      question: `Five friends are sitting in a row facing North. ${arr[0]} is to the immediate right of ${arr[1]}, who is to the immediate right of ${arr[2]}. If ${arr[3]} is at the extreme left end and ${arr[4]} is not adjacent to ${arr[0]}, who is precisely in the middle?`,
      options: [arr[1], arr[2], arr[4], arr[0]].sort(() => Math.random() - 0.5),
      correct_answer: arr[2],
      solution: `By placing ${arr[3]} at the far left and ordering the block [${arr[2]}, ${arr[1]}, ${arr[0]}], we find ${arr[2]} sitting exactly in the middle slot.`,
      hint: "Draw a sequence of 5 slots and map the rigid conditions first, like extreme ends, then fill the immediate adjacencies."
    };
  } else {
    // Sequence: Arithmetic progression
    const start = Math.floor(Math.random() * 10) + 2;
    const diff = Math.floor(Math.random() * 8) + 2;
    
    const seq = [];
    for(let i=0; i<5; i++) {
      seq.push(start + (i*diff));
    }
    const answer = start + (5*diff);
    
    const options = [
      `${answer}`,
      `${answer + diff}`,
      `${answer - diff}`,
      `${answer + 2}`
    ].sort(() => Math.random() - 0.5);

    return {
      topic: "Logical Reasoning",
      subtopic: subtopic || "Number Series",
      difficulty,
      question: `Complete the sequence: ${seq.join(", ")}, ?`,
      options,
      correct_answer: `${answer}`,
      solution: `The pattern is to add ${diff} to the previous number. Thus, ${seq[4]} + ${diff} = ${answer}.`,
      hint: "Examine the common difference between each consecutive term to crack the arithmetic progression."
    };
  }
}

function generateVerbalTemplate(subtopic, difficulty) {
  const st = (subtopic || "").toLowerCase();

  if (st.includes("grammar") || st.includes("error")) {
    const errors = [
      { q: "Choose the correct sentence: ", a: "He doesn't like coffee.", wrong: ["He don't like coffee.", "He not likes coffee.", "He do not likes coffee."], sol: "The pronoun 'He' takes the singular auxiliary 'does not' or 'doesn't'." },
      { q: "Identify the grammatically correct phrase:", a: "The data are clear.", wrong: ["The data is clear.", "The datas are clear.", "The datas is clear."], sol: "'Data' is the plural form of 'datum', hence requires a plural verb in strict formal grammar." },
      { q: "Pick the correct sentence structure:", a: "If I were a bird, I would fly.", wrong: ["If I was a bird, I would fly.", "If I am a bird, I will fly.", "If I were a bird, I will fly."], sol: "Subjunctive mood requires 'were' for hypothetical 'If I' clauses." }
    ];
    const choice = errors[Math.floor(Math.random() * errors.length)];
    const options = [choice.a, ...choice.wrong].sort(() => Math.random() - 0.5);
    return {
      topic: "Verbal Ability",
      subtopic: subtopic || "Grammar Correction",
      difficulty,
      question: choice.q,
      options,
      correct_answer: choice.a,
      solution: choice.sol,
      hint: "Pay attention to subject-verb agreement and conditional tense rules."
    };
  }

  const antonyms = [
    { word: "Benevolent", answer: "Malevolent", wrong: ["Kind", "Generous", "Charitable"] },
    { word: "Ephemeral", answer: "Permanent", wrong: ["Transient", "Brief", "Passing"] },
    { word: "Obfuscate", answer: "Clarify", wrong: ["Confuse", "Complicate", "Conceal"] },
    { word: "Mitigate", answer: "Aggravate", wrong: ["Alleviate", "Reduce", "Lessen"] }
  ];
  
  const choice = antonyms[Math.floor(Math.random() * antonyms.length)];
  const options = [choice.answer, ...choice.wrong].sort(() => Math.random() - 0.5);

  return {
    topic: "Verbal Ability",
    subtopic: subtopic || "Synonyms & Antonyms",
    difficulty,
    question: `Choose the exact antonym for the word: '${choice.word}'`,
    options,
    correct_answer: choice.answer,
    solution: `'${choice.answer}' is the exact opposite meaning of '${choice.word}'.`,
    hint: "Identify the core definition of the target word, then look for the option that represents its direct inverse."
  };
}

function generateDITemplate(subtopic, difficulty) {
  const q1 = Math.floor(Math.random() * 50) + 100;
  const q2 = Math.floor(Math.random() * 50) + 150;
  const percentage = Math.round(((q2 - q1) / q1) * 100);
  
  const correct = `${percentage}%`;
  const options = [
    correct,
    `${percentage + 5}%`,
    `${percentage - 5}%`,
    `${percentage + 10}%`
  ].sort(() => Math.random() - 0.5);

  return {
    topic: "Data Interpretation",
    subtopic: subtopic || "Line Graph",
    difficulty,
    question: `If a company's revenue was ₹${q1}L in Q1 and ₹${q2}L in Q2, what is the approximate percentage growth?`,
    options,
    correct_answer: correct,
    solution: `Growth = Q2 - Q1 = ${q2} - ${q1} = ${q2 - q1}. \nPercentage = (Growth / Q1) * 100 = (${q2 - q1} / ${q1}) * 100 ≈ ${percentage}%.`,
    hint: "Compute the absolute difference between the periods, divide by the original baseline value, and multiply by 100 to find percentage growth."
  };
}

module.exports = { generateTemplateQuestion };
