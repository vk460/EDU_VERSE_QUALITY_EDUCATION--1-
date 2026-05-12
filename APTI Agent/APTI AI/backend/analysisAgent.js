/**
 * The Analysis Agent exclusively handles deep diagnostic evaluation of a completed streak session.
 * It strictly outputs a JSON object modeling calculation mistaking patterns, subtopic proficiencies, and personalized learning trajectories.
 */
async function analyzePerformance(performanceData) {
  const prompt = `Act as an expert Aptitude Assessor and Intelligent Recommendation Agent.
Analyze the following user performance data from a completed practice session:
${JSON.stringify(performanceData)}

Determine the user's proficiency based on the time spent per question and their correct/incorrect ratio.
Are they making conceptual mistakes (consistently getting a specific subtopic wrong or taking way too long) or calculation/silly mistakes (mostly correct but a few outliers)?

Return ONLY a valid JSON object matching this exact schema (no markdown, no backticks, no code blocks):
{
  "accuracy": "e.g., 85% - Excellent",
  "average_time_per_question": "45s",
  "strong_areas": ["List strong concepts here"],
  "weak_areas": ["List general weak areas/topics here"],
  "weak_subtopics": ["List specific granular subtopics they are failing consistently"],
  "mistake_patterns": "Explain if their errors lean conceptual or computational.",
  "recommendations": ["Actionable step 1", "Actionable step 2"]
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (!data.candidates) throw new Error("API Quota or format error");
    let output = data.candidates[0].content.parts[0].text;
    output = output.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(output);
  } catch (err) {
    console.error("Analysis Agent generation failed, calculating heuristics locally:", err.message);
    
    // Fallback: Perform offline heuristic analytics without LLM
    const total = performanceData.total_questions || 1;
    const correct = performanceData.total_correct || 0;
    const avgTime = performanceData.average_time_seconds || 0;
    const accPercent = Math.round((correct / total) * 100);
    
    let accuracyRating = "Average";
    if (accPercent >= 80) accuracyRating = "Excellent";
    else if (accPercent <= 40) accuracyRating = "Needs Practice";
    
    let mistakeType = "Consistent Performance";
    if (accPercent < 50 && avgTime > 40) mistakeType = "Procedural / Conceptual Misunderstanding (High time, low accuracy).";
    else if (accPercent < 70 && avgTime < 15) mistakeType = "Computational / Silly Mistakes (Low time, hasty errors).";
    else if (accPercent >= 80) mistakeType = "High conceptual clarity with minimal computational errors.";

    const subtopic = performanceData.subtopic || "General";
    const subtopicList = [subtopic];
    
    return {
      accuracy: `${accPercent}% - ${accuracyRating}`,
      average_time_per_question: `${avgTime}s`,
      strong_areas: accPercent >= 70 ? subtopicList : ["N/A"],
      weak_areas: accPercent < 70 ? [performanceData.topic] : ["N/A"],
      weak_subtopics: accPercent < 70 ? subtopicList : [],
      mistake_patterns: mistakeType,
      recommendations: [
        accPercent < 50 ? `Re-read core concepts for ${subtopic}.` : `Increase difficulty setting for ${subtopic}.`,
        avgTime > 45 ? "Practice with a timer to improve processing speed." : "Pacing is good, focus on edge-case problem accuracy."
      ]
    };
  }
}

module.exports = { analyzePerformance };
