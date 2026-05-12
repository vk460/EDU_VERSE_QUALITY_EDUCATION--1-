function validateQuestion(q, expectedTopic = null, expectedSubtopic = null) {
  if (!q || typeof q !== 'object') return false;
  if (typeof q.question !== 'string' || q.question.trim() === '') return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  
  const uniqueOptions = new Set(q.options);
  if (uniqueOptions.size !== 4) return false; 
  if (typeof q.correct_answer !== 'string' || !q.options.includes(q.correct_answer)) return false;
  if (typeof q.solution !== 'string' || q.solution.trim() === '') return false;
  if (typeof q.hint !== 'string' || q.hint.trim() === '') return false;

  const contentStr = (q.question + ' ' + q.options.join(' ') + ' ' + q.solution).toLowerCase();

  // Strict Category Semantics Filtering
  if (expectedTopic) {
    if (!q.topic) return false;
    const t1 = q.topic.toLowerCase();
    const t2 = expectedTopic.toLowerCase();

    // Cross-contamination block
    if (!t1.includes(t2) && !t2.includes(t1)) {
      if (t2 === 'quant' && !t1.includes('quant')) return false;
      if (t2 === 'verbal' && !t1.includes('verbal')) return false;
      if ((t2 === 'logic' || t2 === 'lr') && !(t1.includes('logic') || t1.includes('reasoning') || t1.includes('lr'))) return false;
      if ((t2 === 'di' || t2 === 'data') && !(t1.includes('data') || t1.includes('di') || t1.includes('interpretation'))) return false;
    }

    // Hard Rule-Based Semantic Constraints
    if (t2 === 'verbal' || t2.includes('verbal')) {
        // Verbal questions MUST NOT have mathematical symbols or pure math digits in the question string.
        // E.g., no +, -, =, % or excessive numeric isolation.
        if (q.question.match(/([+\-=%]|\b\d{3,}\b)/)) {
           return false;
        }
    }
  }

  // Strict Subtopic Enforcement & Lexical Anchoring
  if (expectedSubtopic) {
    if (!q.subtopic) return false;
    const stExpected = expectedSubtopic.toLowerCase();
    const stActual = q.subtopic.toLowerCase();
    
    // 1. Tag string matching
    const strippedExpected = stExpected.replace(/[^a-z0-9]/g, '');
    const strippedActual = stActual.replace(/[^a-z0-9]/g, '');
    if (!strippedActual.includes(strippedExpected) && !strippedExpected.includes(strippedActual)) return false;

    // 2. Vocabulary/Concept Lock based on the explicit Subtopic
    if (stExpected.includes('profit')) {
      if (!contentStr.includes('profit') && !contentStr.includes('loss') && !contentStr.includes('sell') && !contentStr.includes('cost')) return false;
      // Also reject cross-pollinated time/work concepts
      if (contentStr.includes('days') && contentStr.includes('work') && !contentStr.includes('salary')) return false;
    }
    if (stExpected.includes('work') || stExpected.includes('time')) {
       // Only if it's explicitly time & work
       if (stExpected.includes('work') && !contentStr.includes('work') && !contentStr.includes('days') && !contentStr.includes('hours') && !contentStr.includes('efficiency')) return false;
    }
    if (stExpected.includes('ratio')) {
       if (!contentStr.includes('ratio') && !contentStr.includes(':')) return false;
    }
    if (stExpected.includes('blood')) {
       if (!contentStr.includes('father') && !contentStr.includes('mother') && !contentStr.includes('brother') && !contentStr.includes('sister') && !contentStr.includes('son') && !contentStr.includes('daughter')) return false;
    }
    if (stExpected.includes('direction')) {
       if (!contentStr.includes('north') && !contentStr.includes('south') && !contentStr.includes('east') && !contentStr.includes('west') && !contentStr.includes('left') && !contentStr.includes('right')) return false;
    }
    if (stExpected.includes('chart') || stExpected.includes('graph') || stExpected.includes('pie') || stExpected.includes('table')) {
       if (q.question.length < 50) return false; // DI questions must inherently contain data exposition
    }
  }
  
  return true;
}

module.exports = { validateQuestion };
