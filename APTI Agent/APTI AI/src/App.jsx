import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Globe3D from "./Globe3D";

/* ───────────────────────── Constants ───────────────────────── */
const TOPICS = [
  {
    id: "quant",
    label: "Quantitative Aptitude",
    sub: "Number System, Time & Work",
    subtopics: [
      "Number System", "Simplification", "Percentage", "Profit & Loss",
      "Time & Work", "Time, Speed & Distance", "Ratio & Proportion",
      "Average", "Simple & Compound Interest", "Permutation & Combination", "Probability"
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8M12 8v8" />
      </svg>
    ),
    color: "#818cf8",
  },
  {
    id: "logical",
    label: "Logical Reasoning",
    sub: "Puzzles, Syllogism",
    subtopics: [
      "Number Series", "Alphabet Series", "Coding-Decoding", "Blood Relations",
      "Direction Sense", "Seating Arrangement", "Puzzles", "Syllogism", "Input-Output"
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    color: "#34d399",
  },
  {
    id: "verbal",
    label: "Verbal Ability",
    sub: "Grammar, Comprehension",
    subtopics: [
      "Grammar Correction", "Sentence Improvement", "Synonyms & Antonyms",
      "Para Jumbles", "Reading Comprehension", "Cloze Test", "Vocabulary"
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    color: "#fbbf24",
  },
  {
    id: "di",
    label: "Data Interpretation",
    sub: "Charts, Tables",
    subtopics: [
      "Tables", "Bar Graph", "Pie Chart", "Line Graph", "Caselet DI"
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M8 16V10M12 16V8M16 16V12" />
      </svg>
    ),
    color: "#f87171",
  },
];

const DIFFICULTIES = [
  { key: "Easy", label: "Beginner", sparks: 1 },
  { key: "Medium", label: "Intermediate", sparks: 2 },
  { key: "Hard", label: "Advanced", sparks: 3 },
];

const TABS = ["Home", "Practice", "DI Mode", "Dashboard"];
const TIMER_MAP = { Easy: 60, Medium: 45, Hard: 30 };
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const TOPIC_COLORS = {
  quant: "#818cf8",
  logical: "#34d399",
  verbal: "#fbbf24",
  di: "#f87171",
};

/* ─────────────────── Fallback question generator ─────────────────── */
function getFallbackQuestion(topic, difficulty) {
  const banks = {
    quant: [
      {
        question: "If 3x + 7 = 22, what is the value of x?",
        options: ["3", "5", "7", "4"],
        correct_answer: "5",
        solution:
          "Subtract 7 from both sides: 3x = 15. Divide both sides by 3: x = 5.",
      },
      {
        question:
          "A train travels 240 km in 4 hours. What is its average speed?",
        options: ["50 km/h", "55 km/h", "60 km/h", "65 km/h"],
        correct_answer: "60 km/h",
        solution:
          "Average Speed = Total Distance ÷ Total Time = 240 ÷ 4 = 60 km/h.",
      },
      {
        question: "What is 15% of 400?",
        options: ["40", "50", "60", "70"],
        correct_answer: "60",
        solution: "15% of 400 = (15/100) × 400 = 0.15 × 400 = 60.",
      },
    ],
    logical: [
      {
        question: "Complete the series: 2, 6, 12, 20, 30, ?",
        options: ["40", "42", "44", "46"],
        correct_answer: "42",
        solution:
          "Differences: 4, 6, 8, 10, 12. Each difference increases by 2. So next: 30 + 12 = 42.",
      },
      {
        question:
          "If all roses are flowers and some flowers are red, which must be true?",
        options: [
          "All roses are red",
          "Some roses may be red",
          "No roses are red",
          "All flowers are roses",
        ],
        correct_answer: "Some roses may be red",
        solution:
          "Since all roses are flowers, and some flowers are red, it is possible (but not certain) that some roses are red.",
      },
      {
        question:
          "Pointing to a man, a woman said 'His mother is the only daughter of my mother.' How is the woman related to the man?",
        options: ["Mother", "Aunt", "Sister", "Grandmother"],
        correct_answer: "Mother",
        solution:
          "The only daughter of my mother = the woman herself. So the woman is the man's mother.",
      },
    ],
    verbal: [
      {
        question: "Choose the synonym of 'Ephemeral':",
        options: ["Eternal", "Transient", "Permanent", "Stable"],
        correct_answer: "Transient",
        solution:
          "'Ephemeral' means lasting for a very short time. 'Transient' is the closest synonym meaning temporary or brief.",
      },
      {
        question: "Choose the antonym of 'Benevolent':",
        options: ["Kind", "Malevolent", "Generous", "Charitable"],
        correct_answer: "Malevolent",
        solution:
          "'Benevolent' means well-meaning and kindly. 'Malevolent' means having or showing a wish to do evil to others — its exact opposite.",
      },
      {
        question:
          "Identify the error: 'Each of the boys have completed their homework.'",
        options: [
          "'Each' should be 'Every'",
          "'have' should be 'has'",
          "'their' should be 'his'",
          "Both B and C",
        ],
        correct_answer: "Both B and C",
        solution:
          "'Each' is singular, so the verb should be 'has' (not 'have'), and the pronoun should be 'his' (singular) to match.",
      },
    ],
    di: [
      {
        question:
          "If a company's revenue was ₹50L in Q1 and ₹75L in Q2, what is the percentage increase?",
        options: ["25%", "50%", "33%", "40%"],
        correct_answer: "50%",
        solution:
          "Increase = 75 - 50 = 25. Percentage increase = (25/50) × 100 = 50%.",
      },
      {
        question:
          "In a pie chart, if sector A is 90°, what percentage of the total does it represent?",
        options: ["20%", "25%", "30%", "15%"],
        correct_answer: "25%",
        solution:
          "A full circle is 360°. Percentage = (90/360) × 100 = 25%.",
      },
      {
        question:
          "The ratio of exports to imports is 3:5. If imports are ₹500 Cr, what are exports?",
        options: ["₹200 Cr", "₹300 Cr", "₹350 Cr", "₹250 Cr"],
        correct_answer: "₹300 Cr",
        solution:
          "Exports/Imports = 3/5. Exports = (3/5) × 500 = 300 Cr.",
      },
    ],
  };

  const pool = banks[topic] || banks.quant;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ─────────────── Gemini API helper ─────────────── */
async function callGemini(prompt) {
  try {
    const res = await fetch("http://localhost:5000/api/generate-custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

/* ──────────────── Spinner component ──────────────── */
function Spinner({ text = "Generating with AI..." }) {
  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1.5rem' }}>
      <div style={{ position: 'relative', width: '64px', height: '64px' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid rgba(0, 229, 255, 0.1)' }}></div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid transparent', borderTopColor: '#00e5ff', borderRightColor: '#8b5cf6', animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite' }}></div>
        <div style={{ position: 'absolute', inset: '8px', borderRadius: '50%', border: '4px solid transparent', borderBottomColor: '#ec4899', borderLeftColor: '#f59e0b', animation: 'spin 0.8s linear infinite reverse' }}></div>
      </div>
      <p className="neon-text" style={{ fontSize: '1rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', letterSpacing: '0.05em' }}>{text}</p>
    </div>
  );
}

/* ──────────────── Spark icon ──────────────── */
function Sparks({ count = 1 }) {
  return (
    <span style={{ color: '#00e5ff', fontSize: '0.7rem', letterSpacing: 2 }}>
      {'✦'.repeat(count)}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════
   HOME TAB
   ════════════════════════════════════════════════════════════════ */
function HomeTab({ onStart, onTutor }) {
  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', textAlign: 'center' }}>
      {/* Glowing Orb */}
      <div className="delay-200" style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 2rem' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #a855f7)', filter: 'blur(25px)', opacity: 0.7, animation: 'pulse 3s infinite alternate' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #4c1d95, #020617)', border: '1px solid rgba(168, 85, 247, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 30px rgba(6, 182, 212, 0.4)' }}>
          <span style={{ fontSize: '3rem', fontWeight: 900, fontFamily: '"Orbitron", sans-serif', color: '#fff' }}>AI</span>
        </div>
      </div>

      <h1 className="heading-hero delay-300" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: '1rem' }}>
        <span className="text-gradient">Your Personal</span><br />
        Aptitude AI Agent
      </h1>
      
      <p className="delay-400" style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: 650, margin: '0 auto 3rem', lineHeight: 1.6 }}>
        Adaptive learning powered by AI. Master Quant, LR, DI & Verbal for placements — with step-by-step AI explanations, smart practice, and gamified progress.
      </p>

      <div className="delay-400" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onStart} className="btn-primary">
          🚀 Start Practice
        </button>
        <button onClick={onTutor} className="btn-secondary">
          🧠 Ask AI Tutor
        </button>
      </div>

      <div className="delay-400" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', width: '100%', marginTop: '5rem' }}>
        {[ { v: '50K+', l: 'Students' }, { v: '98%', l: 'Placement Rate' }, { v: '2M+', l: 'Questions Solved' }, { v: '4.9★', l: 'Rating' } ].map((s, i) => (
          <div key={i} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#06b6d4', marginBottom: '0.25rem' }}>{s.v}</h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PRACTICE TAB
   ════════════════════════════════════════════════════════════════ */
function PracticeTab({ topic, subtopic, difficulty, streak, onAnswer, onHome, userProfile, setUserProfile }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [timer, setTimer] = useState(TIMER_MAP[difficulty] || 45);
  const [timerSpent, setTimerSpent] = useState(0);
  const [timeSpentList, setTimeSpentList] = useState([]);
  const timerRef = useRef(null);

  const [quizFinished, setQuizFinished] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [sessionRecord, setSessionRecord] = useState([]);

  const fetchStreak = useCallback(async () => {
    setLoading(true);
    let userId = localStorage.getItem('apti_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('apti_user_id', userId);
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/streak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, subtopic, difficulty, count: streak, userId })
      });
      if (res.status === 429) {
         throw new Error("API_QUOTA_EXCEEDED");
      }
      if (!res.ok) throw new Error("API error");
      const result = await res.json();
      
      if (result && result.questions && result.questions.length > 0) {
        setQuestions(result.questions);
      } else {
        setQuestions(Array(streak).fill(getFallbackQuestion(topic, difficulty)));
      }
    } catch (e) {
      if (e.message === "API_QUOTA_EXCEEDED") {
          setQuestions([{
             question: "🚨 SYSTEM ALERT: AI QUOTA EXCEEDED 🚨\nThe core Gemini Generative AI engine has exhausted its daily generation quota. The backend has protected your session from falling back to corrupted templates. Please update `GEMINI_API_KEY` in your `.env` to resume generating Aptitude Streaks.",
             options: ["I understand the system protected the DB.", "I will update the .env file.", "I will wait for the API quota to reset.", "Acknowledge Database Purge."],
             correct_answer: "I understand the system protected the DB.",
             solution: "Google Generative AI issues a 429 status code when the free-tier limit is maxed out. To restore API functionality, rotate your AI Platform Key.",
             hint: "System Offline: Update GEMINI_API_KEY."
          }]);
      } else {
          console.error("Failed to fetch streak from backend", e);
          setQuestions(Array(streak).fill(getFallbackQuestion(topic, difficulty)));
      }
    }
    setLoading(false);
  }, [topic, subtopic, difficulty, streak]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  useEffect(() => {
    if (!loading && !submitted && timer > 0) {
      timerRef.current = setTimeout(() => {
        setTimer((t) => t - 1);
        setTimerSpent((ts) => ts + 1);
      }, 1000);
    }
    if (timer === 0 && !submitted) {
      handleSubmit(null, true);
    }
    return () => clearTimeout(timerRef.current);
  }, [timer, loading, submitted]);

  function handleSubmit(opt, timedOut = false) {
    const question = questions[currentIndex];
    const answer = timedOut ? null : opt || selected;
    setSubmitted(true);
    clearTimeout(timerRef.current);
    
    setTimeSpentList(prev => [...prev, timerSpent]);
    
    const isCorrect = answer === question.correct_answer;
    onAnswer({ topic, subtopic, difficulty, isCorrect, question: question.question });
    setSessionRecord(prev => [...prev, { q: question.question, isCorrect, timeSpent: timerSpent }]);
  }

  async function handleNext() {
    if (currentIndex >= streak - 1) {
      setQuizFinished(true);
      setAnalyzing(true);
      
      const correctCount = sessionRecord.filter(r => r.isCorrect).length;
      let diffMult = difficulty === "Hard" ? 30 : difficulty === "Medium" ? 20 : 10;
      let xpEarned = correctCount * diffMult;

      if (userProfile && xpEarned > 0) {
        fetch("http://localhost:5000/api/user/add-xp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userProfile.user_id, xp: xpEarned })
        })
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.new_xp !== "undefined") {
            setUserProfile({ ...userProfile, xp: data.new_xp });
          }
        })
        .catch(err => console.error("XP dispatch failed", err));
      }

      try {
        const res = await fetch("http://localhost:5000/api/analyze-streak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            subtopic,
            difficulty,
            streak,
            sessionRecord
          })
        });
        const data = await res.json();
        setAnalysisResult(data.analysis || null);
      } catch (e) {
        console.error("Analysis failed", e);
      }
      setAnalyzing(false);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelected(null);
      setSubmitted(false);
      setShowHint(false);
      setTimer(TIMER_MAP[difficulty] || 45);
      setTimerSpent(0);
    }
  }

  if (loading) return <Spinner text={`Generating your ${streak}-question streak...`} />;

  const question = questions[currentIndex];

  if (quizFinished) {
    const correctCount = sessionRecord.filter(r => r.isCorrect).length;
    return (
      <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem', alignItems: 'center', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', color: '#00e5ff', fontWeight: 800, fontFamily: '"Orbitron", sans-serif', marginTop: '2rem' }}>Streak Completed! 🎉</h2>
        <div className="bento-card" style={{ padding: '2rem', width: '100%', borderColor: 'rgba(52, 211, 153, 0.5)', background: 'rgba(15, 23, 42, 0.6)' }}>
          <h3 style={{ fontSize: '3.5rem', color: '#34d399', margin: '0 0 1.5rem 0' }}>{correctCount} / {streak}</h3>
          
          {analyzing ? (
            <div style={{ padding: '2rem' }}>
               <Spinner text="AI is performing deep timeline analysis..." />
            </div>
          ) : analysisResult ? (
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(0, 229, 255, 0.08)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,229,255,0.2)' }}>
                  <h4 style={{ color: '#00e5ff', fontSize: '0.9rem', marginBottom: '0.5rem' }}>🎯 Overall Accuracy</h4>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{analysisResult.accuracy}</div>
                </div>
                <div style={{ background: 'rgba(168, 85, 247, 0.08)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.2)' }}>
                  <h4 style={{ color: '#d8b4fe', fontSize: '0.9rem', marginBottom: '0.5rem' }}>⏱️ Average Time</h4>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{analysisResult.avg_time}</div>
                </div>
              </div>
              
              <div style={{ background: 'rgba(52, 211, 153, 0.08)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(52,211,153,0.2)' }}>
                <h4 style={{ color: '#34d399', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>💪 Strong Areas</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#e0f0ff', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {analysisResult.strong_areas?.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>

              <div style={{ background: 'rgba(248, 113, 113, 0.08)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(248,113,113,0.2)' }}>
                <h4 style={{ color: '#f87171', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚠️ Weak Subtopics to Review</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#e0f0ff', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {analysisResult.weak_subtopics?.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>

              {analysisResult.mistake_patterns && (
                <div style={{ background: 'rgba(244, 63, 94, 0.08)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(244,63,94,0.3)' }}>
                  <h4 style={{ color: '#fb7185', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🧠 Mistake Patterns</h4>
                  <p style={{ margin: 0, color: '#e0f0ff', fontSize: '0.95rem', lineHeight: 1.6 }}>{analysisResult.mistake_patterns}</p>
                </div>
              )}
              
              <div style={{ background: 'rgba(251, 191, 36, 0.08)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(251,191,36,0.2)' }}>
                <h4 style={{ color: '#fbbf24', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>💡 Recommendations</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#e0f0ff', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {analysisResult.recommendations?.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            </div>
          ) : (
             <div style={{ textAlign: 'left', lineHeight: 1.7, color: '#e0f0ff', fontSize: '0.95rem', background: 'rgba(0, 229, 255, 0.08)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0,229,255,0.2)' }}>
              <h4 style={{ color: '#00e5ff', marginBottom: '1rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🤖 AI Performance Analysis</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>Analysis failed or returned empty. Please check backend logs.</p>
            </div>
          )}
        </div>
        <button className="btn-primary" style={{ width: '100%', padding: '1.25rem', marginTop: '1rem', fontSize: '1.1rem' }} onClick={onHome}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isCorrect = selected === question.correct_answer;
  const timerPercent = (timer / TIMER_MAP[difficulty]) * 100;
  const timerColor =
    timerPercent > 50 ? "#34d399" : timerPercent > 25 ? "#fbbf24" : "#f87171";

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onHome}
          style={{
            background: 'none',
            border: 'none',
            color: '#4a6fa5',
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          ← Back
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              background: `${TOPIC_COLORS[topic]}20`,
              color: TOPIC_COLORS[topic],
            }}
          >
            {TOPICS.find((t) => t.id === topic)?.label}
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              background: difficulty === "Easy" ? 'rgba(52, 211, 153, 0.15)' : difficulty === "Medium" ? 'rgba(251, 191, 36, 0.15)' : 'rgba(248, 113, 113, 0.15)',
              color: difficulty === "Easy" ? '#34d399' : difficulty === "Medium" ? '#fbbf24' : '#f87171',
            }}
          >
            {difficulty}
          </span>
          {question.subtopic && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#d8b4fe',
              }}
            >
              {question.subtopic}
            </span>
          )}
        </div>
      </div>

      {/* Timer bar */}
      {!submitted && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#4a6fa5', marginBottom: '0.25rem' }}>
            <span>Time Remaining</span>
            <span style={{ color: timerColor, fontWeight: 700 }}>{timer}s</span>
          </div>
          <div style={{ height: 6, background: '#0f1a3a', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                borderRadius: 999,
                transition: 'width 1s linear',
                width: `${timerPercent}%`,
                background: timerColor,
              }}
            />
          </div>
        </div>
      )}

      {/* Question card */}
      <div className="bento-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#e0f0ff', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          {question.question}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {question.options.map((opt, i) => {
            let bg = 'rgba(8, 18, 40, 0.5)';
            let border = 'rgba(30, 48, 96, 0.5)';
            let color = '#8faec8';

            if (submitted) {
              if (opt === question.correct_answer) {
                bg = 'rgba(52, 211, 153, 0.1)';
                border = 'rgba(52, 211, 153, 0.5)';
                color = '#34d399';
              } else if (opt === selected && opt !== question.correct_answer) {
                bg = 'rgba(248, 113, 113, 0.1)';
                border = 'rgba(248, 113, 113, 0.5)';
                color = '#f87171';
              } else {
                color = '#3a5478';
              }
            } else if (opt === selected) {
              bg = 'rgba(0, 229, 255, 0.08)';
              border = 'rgba(0, 229, 255, 0.5)';
              color = '#00e5ff';
            }

            return (
              <button
                key={i}
                onClick={() => !submitted && setSelected(opt)}
                disabled={submitted}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.85rem 1.25rem',
                  borderRadius: 12,
                  border: `1px solid ${border}`,
                  background: bg,
                  color,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: submitted ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ opacity: 0.5, marginRight: '0.75rem', fontWeight: 700, fontSize: '0.75rem' }}>
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {!submitted && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
            <button
              onClick={() => setShowHint(true)}
              disabled={showHint}
              style={{
                width: '30%',
                padding: '0.85rem',
                fontSize: '0.9rem',
                background: showHint ? 'rgba(0,0,0,0.2)' : 'rgba(0, 229, 255, 0.08)',
                color: showHint ? '#4a6fa5' : '#00e5ff',
                border: showHint ? '1px solid transparent' : '1px solid rgba(0,229,255,0.3)',
                borderRadius: '8px',
                cursor: showHint ? 'default' : 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              💡 Hint
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={!selected}
              className="btn-primary"
              style={{
                width: '70%',
                padding: '0.85rem',
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                opacity: !selected ? 0.4 : 1,
                cursor: !selected ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Submit Answer
            </button>
          </div>
        )}

        {showHint && !submitted && question.hint && (
          <div className="animate-fadeIn" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(251, 191, 36, 0.08)', borderRadius: '8px', border: '1px solid rgba(251,191,36,0.2)' }}>
            <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.85rem' }}>💡 Instructor Hint: </span>
            <span style={{ color: '#e0f0ff', fontSize: '0.85rem' }}>{question.hint}</span>
          </div>
        )}
      </div>

      {/* Result */}
      {submitted && (
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              padding: '1rem',
              borderRadius: 12,
              border: `1px solid ${isCorrect ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
              background: isCorrect ? 'rgba(52, 211, 153, 0.08)' : 'rgba(248, 113, 113, 0.08)',
              color: isCorrect ? '#34d399' : '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{isCorrect ? "✅" : "❌"}</span>
            <div>
              <p style={{ fontWeight: 700 }}>{isCorrect ? "Correct!" : "Incorrect"}</p>
              {!isCorrect && (
                <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Correct answer: <span style={{ color: '#34d399', fontWeight: 600 }}>{question.correct_answer}</span>
                </p>
              )}
            </div>
          </div>

          {/* Solution */}
          <div className="bento-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              💡 Step-by-Step Solution
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#8faec8', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {question.solution}
            </p>
          </div>

          <button
            onClick={handleNext}
            className="btn-primary"
            style={{ 
              width: '100%', 
              padding: '1rem', 
              fontSize: '1.05rem', 
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              boxShadow: '0 4px 15px rgba(0, 229, 255, 0.3)'
            }}
          >
            Next Question →
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   DI MODE TAB
   ════════════════════════════════════════════════════════════════ */
function DITab({ onAnswer, onHome }) {
  const [chartData, setChartData] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [statsSummary, setStatsSummary] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const CATEGORIES = ["North", "South", "East", "West", "Central"];
  const BAR_COLORS = ["#818cf8", "#34d399", "#fbbf24", "#f87171", "#22d3ee"];

  useEffect(() => {
    generateDI();
  }, []);

  async function generateDI() {
    setLoading(true);
    const data = CATEGORIES.map((cat) => ({
      name: cat,
      sales: Math.floor(Math.random() * 900) + 100,
    }));
    setChartData(data);

    const dataStr = data.map((d) => `${d.name}: ${d.sales}`).join(", ");
    const prompt = `Given this bar chart data showing sales by region: ${dataStr}. Generate exactly 3 multiple choice questions about this data. Return ONLY valid JSON with no markdown, no code fences. Format: [{"question":"...","options":["A","B","C","D"],"correct_answer":"...","solution":"..."},{"question":"...","options":["A","B","C","D"],"correct_answer":"...","solution":"..."},{"question":"...","options":["A","B","C","D"],"correct_answer":"...","solution":"..."}]`;

    const result = await callGemini(prompt);
    if (Array.isArray(result) && result.length >= 3) {
      setQuestions(result.slice(0, 3));
    } else {
      const total = data.reduce((s, d) => s + d.sales, 0);
      const max = data.reduce((a, b) => (a.sales > b.sales ? a : b));
      const min = data.reduce((a, b) => (a.sales < b.sales ? a : b));
      setQuestions([
        {
          question: "Which region had the highest sales?",
          options: CATEGORIES,
          correct_answer: max.name,
          solution: `${max.name} had the highest sales at ${max.sales}.`,
        },
        {
          question: `What is the total sales across all regions?`,
          options: [
            `${total}`,
            `${total + 100}`,
            `${total - 50}`,
            `${total + 200}`,
          ],
          correct_answer: `${total}`,
          solution: `Total = ${data.map((d) => d.sales).join(" + ")} = ${total}.`,
        },
        {
          question: "Which region had the lowest sales?",
          options: CATEGORIES,
          correct_answer: min.name,
          solution: `${min.name} had the lowest sales at ${min.sales}.`,
        },
      ]);
    }
    setAnswers({});
    setSubmitted({});
    setLoading(false);
  }

  function handleSubmit(idx) {
    setSubmitted((s) => ({ ...s, [idx]: true }));
    const q = questions[idx];
    const isCorrect = answers[idx] === q.correct_answer;
    onAnswer({ topic: "di", difficulty: "Medium", isCorrect, question: q.question });
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#0a1228',
          border: '1px solid rgba(30, 48, 96, 0.5)',
          borderRadius: 8,
          padding: '6px 12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e0f0ff' }}>{label}</p>
          <p style={{ fontSize: '0.7rem', color: '#00e5ff' }}>Sales: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  async function analyzePerformance() {
    setAnalyzing(true);
    let correctCount = 0;
    const sessionRec = questions.map((q, idx) => {
      const isCorrect = answers[idx] === q.correct_answer;
      if (isCorrect) correctCount++;
      return { q: q.question, isCorrect };
    });
    const prompt = `The user completed a Data Interpretation quiz. They scored ${correctCount} out of ${questions.length}. Here are their questions and results: ${JSON.stringify(sessionRec)}. Provide a 2-3 paragraph motivating analysis of their strengths and weaknesses on these specific questions, using encouraging language. Do NOT use markdown code blocks, just plain text. Return JSON format: {"summary": "..."}`;
    const res = await callGemini(prompt);
    if (res && res.summary) {
      setStatsSummary(res.summary);
    } else {
      setStatsSummary(`Great job! You finished the DI practice session. Keep practicing to improve your skills.`);
    }
    setAnalyzing(false);
  }

  if (loading) return <Spinner text="Generating chart & questions..." />;

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e0f0ff', fontFamily: '"Orbitron", sans-serif', letterSpacing: '0.05em' }}>
          📊 Data Interpretation
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#4a6fa5', marginTop: '0.25rem' }}>
          Analyze the chart and answer the questions
        </p>
      </div>

      {/* Chart card */}
      <div className="bento-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#8faec8', marginBottom: '1rem' }}>
          Regional Sales Data (in Units)
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barSize={42}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0f1a3a" />
            <XAxis
              dataKey="name"
              stroke="#1e3060"
              tick={{ fill: "#6b8ab0", fontSize: 12 }}
            />
            <YAxis
              stroke="#1e3060"
              tick={{ fill: "#6b8ab0", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {questions.map((q, idx) => {
          const isCorrect = answers[idx] === q.correct_answer;
          return (
            <div key={idx} className="bento-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e0f0ff', marginBottom: '0.75rem' }}>
                <span style={{ color: '#00e5ff', marginRight: '0.5rem' }}>Q{idx + 1}.</span>
                {q.question}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {q.options.map((opt, oi) => {
                  let bg = 'rgba(8, 18, 40, 0.5)';
                  let border = 'rgba(30, 48, 96, 0.5)';
                  let clr = '#8faec8';

                  if (submitted[idx]) {
                    if (opt === q.correct_answer) {
                      bg = 'rgba(52, 211, 153, 0.1)'; border = 'rgba(52, 211, 153, 0.5)'; clr = '#34d399';
                    } else if (opt === answers[idx]) {
                      bg = 'rgba(248, 113, 113, 0.1)'; border = 'rgba(248, 113, 113, 0.5)'; clr = '#f87171';
                    } else {
                      clr = '#3a5478';
                    }
                  } else if (opt === answers[idx]) {
                    bg = 'rgba(0, 229, 255, 0.08)'; border = 'rgba(0, 229, 255, 0.5)'; clr = '#00e5ff';
                  }

                  return (
                    <button
                      key={oi}
                      onClick={() => !submitted[idx] && setAnswers((a) => ({ ...a, [idx]: opt }))}
                      disabled={submitted[idx]}
                      style={{
                        textAlign: 'left',
                        padding: '0.6rem 1rem',
                        borderRadius: 8,
                        border: `1px solid ${border}`,
                        background: bg,
                        color: clr,
                        fontSize: '0.8rem',
                        cursor: submitted[idx] ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {!submitted[idx] ? (
                <button
                  onClick={() => handleSubmit(idx)}
                  disabled={!answers[idx]}
                  className="btn-primary"
                  style={{
                    padding: '0.5rem 1.5rem',
                    fontSize: '0.8rem',
                    marginTop: '0.75rem',
                    opacity: !answers[idx] ? 0.4 : 1,
                    cursor: !answers[idx] ? 'not-allowed' : 'pointer',
                  }}
                >
                  Submit
                </button>
              ) : (
                <div className="animate-fadeIn" style={{ marginTop: '0.75rem' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: isCorrect ? '#34d399' : '#f87171' }}>
                    {isCorrect ? "✅ Correct!" : "❌ Incorrect"}
                    {!isCorrect && (
                      <span style={{ color: '#34d399', marginLeft: '0.5rem' }}>Answer: {q.correct_answer}</span>
                    )}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b8ab0', marginTop: '0.25rem' }}>{q.solution}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* LLM Analysis Section */}
      {questions.length > 0 && Object.keys(submitted).length === questions.length && (
        <div className="glass-card animate-fadeIn" style={{ padding: '2rem', marginTop: '1rem', borderColor: 'rgba(52, 211, 153, 0.8)', background: 'rgba(15, 23, 42, 0.6)' }}>
          {analyzing ? (
            <Spinner text="AI is analyzing your performance..." />
          ) : statsSummary ? (
            <div style={{ textAlign: 'left', lineHeight: 1.7, color: '#e0f0ff', fontSize: '0.95rem' }}>
              <h4 style={{ color: '#00e5ff', marginBottom: '1rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🤖 AI Performance Analysis</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{statsSummary}</p>
              <button className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1.5rem' }} onClick={onHome}>
                Back to Dashboard
              </button>
            </div>
          ) : (
            <button
              onClick={analyzePerformance}
              className="btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
            >
              ✨ View AI Performance Analysis
            </button>
          )}
        </div>
      )}

      {/* Regenerate */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={generateDI}
          className="bento-card"
          style={{
            padding: '0.7rem 1.5rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#8faec8',
            cursor: 'pointer',
            border: '1px solid rgba(0, 229, 255, 0.15)',
            background: 'rgba(15, 23, 42, 0.4)',
          }}
        >
          🔄 Generate New Chart & Questions
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   DASHBOARD & LEADERBOARD TAB
   ════════════════════════════════════════════════════════════════ */
function DashboardTab({ history, userProfile }) {
  const [recommendation, setRecommendation] = useState("");
  const [loadingRec, setLoadingRec] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/leaderboard")
      .then(res => res.json())
      .then(data => {
        if (data && data.leaderboard) setLeaderboard(data.leaderboard);
      })
      .catch(err => console.error("Leaderboard fetch failed", err));
  }, []);

  const stats = TOPICS.map((t) => {
    const attempts = history[t.id] || [];
    const total = attempts.length;
    const correct = attempts.filter((a) => a.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { ...t, total, correct, accuracy };
  });

  const totalAttempted = stats.reduce((s, st) => s + st.total, 0);
  const totalCorrect = stats.reduce((s, st) => s + st.correct, 0);
  const overallAccuracy =
    totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const weakTopic = stats
    .filter((s) => s.total > 0)
    .sort((a, b) => a.accuracy - b.accuracy)[0];

  const chartData = stats.map((s) => ({
    name: s.label.split(" ")[0],
    accuracy: s.accuracy,
    color: s.color,
  }));

  async function fetchRecommendation() {
    setLoadingRec(true);
    const summary = stats
      .map(
        (s) =>
          `${s.label}: ${s.total} attempted, ${s.accuracy}% accuracy`
      )
      .join("; ");
    const prompt = `Given this aptitude test performance data: ${summary}. Provide a brief, personalized 2-3 sentence study recommendation. Return ONLY valid JSON with no markdown: {"recommendation":"..."}`;
    const result = await callGemini(prompt);
    if (result?.recommendation) {
      setRecommendation(result.recommendation);
    } else {
      if (weakTopic) {
        setRecommendation(
          `Focus on ${weakTopic.label} where your accuracy is ${weakTopic.accuracy}%. Practice daily with increasing difficulty. Review fundamental concepts and attempt timed practice sessions to build confidence.`
        );
      } else {
        setRecommendation(
          "Start practicing to get personalized recommendations! Attempt questions across all topics to identify your strengths and weaknesses."
        );
      }
    }
    setLoadingRec(false);
  }

  useEffect(() => {
    fetchRecommendation();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#0a1228',
          border: '1px solid rgba(30, 48, 96, 0.5)',
          borderRadius: 8,
          padding: '6px 12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e0f0ff' }}>{label}</p>
          <p style={{ fontSize: '0.7rem', color: '#00e5ff' }}>Accuracy: {payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  const summaryCards = [
    { value: totalAttempted, label: 'Total Questions', color: '#00e5ff' },
    { value: totalCorrect, label: 'Correct', color: '#34d399' },
    { value: `${overallAccuracy}%`, label: 'Overall Accuracy', color: '#a78bfa' },
    { value: weakTopic?.label?.split(" ")[0] || "—", label: 'Weak Area', color: '#f87171' },
  ];

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '5rem' }}>
      
      {/* Gamification Profile Header */}
      {userProfile && (
        <div className="bento-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(30, 48, 96, 0.4), rgba(15, 23, 42, 0.6))', border: '1px solid rgba(0, 229, 255, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
             <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 0 20px rgba(0,229,255,0.4)' }}>
                👾
             </div>
             <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>{userProfile.username}</h2>
                <div style={{ fontSize: '0.9rem', color: '#a855f7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   Level {Math.floor(userProfile.xp / 100) + 1}
                </div>
             </div>
          </div>
          <div style={{ textAlign: 'right' }}>
             <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#00e5ff', margin: 0 }}>{userProfile.xp}</h3>
             <span style={{ fontSize: '0.8rem', color: '#6b8ab0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total XP</span>
          </div>
        </div>
      )}

      {/* Global Leaderboard Section */}
      <div className="bento-card" style={{ padding: '1.5rem', borderColor: 'rgba(251, 191, 36, 0.2)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          🏆 Global Leaderboard
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {leaderboard.map((user, idx) => (
             <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: userProfile?.username === user.username ? 'rgba(251, 191, 36, 0.15)' : 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', border: userProfile?.username === user.username ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <span style={{ fontSize: '1.1rem', fontWeight: 800, color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#6b8ab0', width: '24px', textAlign: 'center' }}>
                     #{idx + 1}
                   </span>
                   <span style={{ fontSize: '1rem', fontWeight: userProfile?.username === user.username ? 700 : 500, color: userProfile?.username === user.username ? '#fbbf24' : '#e0f0ff' }}>
                     {user.username} {userProfile?.username === user.username && "(You)"}
                   </span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#00e5ff' }}>
                   {user.xp} XP
                </div>
             </div>
          ))}
          {leaderboard.length === 0 && <p style={{ color: '#6b8ab0', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>No champions yet. Complete a streak to claim the throne!</p>}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e0f0ff', fontFamily: '"Orbitron", sans-serif', letterSpacing: '0.05em' }}>
          📈 Performance Analytics
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#4a6fa5', marginTop: '0.25rem' }}>
          Assess strictly logical capabilities across domains
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        {summaryCards.map((c, i) => (
          <div key={i} className="bento-card" style={{ padding: '1rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: c.color }}>
              {c.value}
            </p>
            <p style={{ fontSize: '0.65rem', color: '#4a6fa5', marginTop: '0.25rem' }}>
              {c.label}
            </p>
          </div>
        ))}
      </div>

      {/* Accuracy chart */}
      <div className="bento-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#8faec8', marginBottom: '1rem' }}>
          Accuracy by Topic (%)
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barSize={42}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0f1a3a" />
            <XAxis
              dataKey="name"
              stroke="#1e3060"
              tick={{ fill: "#6b8ab0", fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#1e3060"
              tick={{ fill: "#6b8ab0", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per topic stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        {stats.map((s) => (
          <div
            key={s.id}
            className="bento-card"
            style={{
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              borderColor: weakTopic?.id === s.id && s.total > 0 ? 'rgba(248, 113, 113, 0.3)' : undefined,
            }}
          >
            <div style={{ color: s.color, flexShrink: 0 }}>{s.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e0f0ff' }}>
                  {s.label}
                </p>
                {weakTopic?.id === s.id && s.total > 0 && (
                  <span style={{
                    fontSize: '0.55rem',
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: 'rgba(248, 113, 113, 0.15)',
                    color: '#f87171',
                    fontWeight: 700,
                  }}>
                    WEAK
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                <div style={{
                  flex: 1,
                  height: 6,
                  background: 'rgba(30, 48, 96, 0.4)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 999,
                      transition: 'width 0.7s ease',
                      width: `${s.accuracy}%`,
                      background: s.color,
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: s.color }}>
                  {s.accuracy}%
                </span>
              </div>
              <p style={{ fontSize: '0.65rem', color: '#4a6fa5', marginTop: '0.2rem' }}>
                {s.correct}/{s.total} correct
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Recommendation */}
      <div
        className="bento-card"
        style={{
          padding: '1.5rem',
          borderColor: 'rgba(0, 229, 255, 0.2)',
          background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
        }}
      >
        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          🤖 AI Study Recommendation
        </h3>
        {loadingRec ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#4a6fa5' }}>
            <div style={{
              width: 14,
              height: 14,
              border: '2px solid #1e3060',
              borderTopColor: '#00e5ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            Analyzing your performance...
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: '#8faec8', lineHeight: 1.7 }}>
            {recommendation}
          </p>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CHAT TAB
   ════════════════════════════════════════════════════════════════ */
function ChatTab() {
  const [messages, setMessages] = useState([
    { role: "model", text: "Hello! I am your APTI AI Tutor. What aptitude concept or problem can I help you with today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", text: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([...newMessages, { role: "model", text: data.text }]);
      } else {
        setMessages([...newMessages, { role: "model", text: "Sorry, I had trouble connecting to my neural net." }]);
      }
    } catch {
      setMessages([...newMessages, { role: "model", text: "Connection error. Please check your network." }]);
    }
    setLoading(false);
  }

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e0f0ff', fontFamily: '"Orbitron", sans-serif', letterSpacing: '0.05em' }}>
          💬 AI Tutor
        </h2>
        <p style={{ fontSize: '0.75rem', color: '#4a6fa5' }}>Clear your concepts instantly</p>
      </div>

      <div className="bento-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "rgba(0, 229, 255, 0.15)" : "rgba(30, 48, 96, 0.4)",
                border: m.role === "user" ? "1px solid rgba(0, 229, 255, 0.3)" : "1px solid rgba(30, 48, 96, 0.6)",
                padding: "0.75rem 1rem",
                borderRadius: "16px",
                borderBottomRightRadius: m.role === "user" ? "4px" : "16px",
                borderBottomLeftRadius: m.role === "model" ? "4px" : "16px",
                maxWidth: "85%",
                color: m.role === "user" ? "#e0f0ff" : "#8faec8",
                fontSize: "0.85rem",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap"
              }}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start", display: 'flex', gap: '0.5rem', alignItems: 'center', padding: "0.5rem 1rem" }}>
              <div style={{ width: 6, height: 6, background: '#00e5ff', borderRadius: '50%', animation: 'orbPulse 1s infinite' }} />
              <div style={{ width: 6, height: 6, background: '#00e5ff', borderRadius: '50%', animation: 'orbPulse 1s infinite 0.2s' }} />
              <div style={{ width: 6, height: 6, background: '#00e5ff', borderRadius: '50%', animation: 'orbPulse 1s infinite 0.4s' }} />
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', borderTop: '1px solid rgba(0, 229, 255, 0.1)' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            style={{
              flex: 1,
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(30, 48, 96, 0.6)',
              borderRadius: '99px',
              padding: '0.75rem 1.25rem',
              color: '#e0f0ff',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-primary"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              opacity: !input.trim() || loading ? 0.5 : 1
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN APP
   ════════════════════════════════════════════════════════════════ */
export default function App() {
  const [activeTab, setActiveTab] = useState("Home");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [selectedStreak, setSelectedStreak] = useState(null);
  const [history, setHistory] = useState({
    quant: [],
    logical: [],
    verbal: [],
    di: [],
  });
  const [suggestion, setSuggestion] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Sync Gamification Profile on Mount
  useEffect(() => {
    async function syncProfile() {
      let userId = localStorage.getItem('apti_user_id');
      if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('apti_user_id', userId);
      }
      try {
        const res = await fetch("http://localhost:5000/api/user/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId })
        });
        const data = await res.json();
        if (data && data.user) setUserProfile(data.user);
      } catch (err) {
        console.error("Failed to sync profile:", err);
      }
    }
    syncProfile();
  }, []);

  const [isLightMode, setIsLightMode] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchEndY, setTouchEndY] = useState(null);

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
  }, [isLightMode]);

  function handleAnswer(record) {
    setHistory((prev) => ({
      ...prev,
      [record.topic]: [...(prev[record.topic] || []), record],
    }));
    const topicHistory = [...(history[record.topic] || []), record];
    const correct = topicHistory.filter((r) => r.isCorrect).length;
    const accuracy =
      topicHistory.length > 0
        ? Math.round((correct / topicHistory.length) * 100)
        : 0;
    if (accuracy > 80) setSuggestion("Hard");
    else if (accuracy >= 50) setSuggestion("Medium");
    else setSuggestion("Easy");
  }

  function handleStart() {
    setActiveTab("Practice");
  }

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchEndY(null);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !touchStartY || !touchEndY) return;
    const distanceX = touchStart - touchEnd;
    const distanceY = touchStartY - touchEndY;
    const isLeftSwipe = distanceX > 50;
    const isRightSwipe = distanceX < -50;

    // Strict threshold: horizontal movement must clearly be larger than vertical scroll
    if (Math.abs(distanceX) > Math.abs(distanceY) * 1.5) {
      const currentIndex = bottomNavItems.findIndex(i => i.id === activeTab);
      if (isLeftSwipe && currentIndex < bottomNavItems.length - 1) {
        setActiveTab(bottomNavItems[currentIndex + 1].id);
      }
      if (isRightSwipe && currentIndex > 0) {
        setActiveTab(bottomNavItems[currentIndex - 1].id);
      }
    }
  };

  const bottomNavItems = [
    {
      id: "Home",
      label: "Explore",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: "Chat AI",
      label: "Chat",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
    {
      id: "Dashboard",
      label: "Stats",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="aurora-bg">
        <div className="aurora-blob blob-cyan" />
        <div className="aurora-blob blob-purple" />
        <div className="aurora-blob blob-pink" />
      </div>
      <div className="grid-overlay" />

      {/* Top Navigation */}
      <nav className="top-nav">
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', color: '#fff' }}>AI</div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: '"Orbitron", sans-serif', letterSpacing: '0.05em', color: '#fff', lineHeight: 1.1 }}>APTI AGENT</div>
              <div style={{ fontSize: '0.65rem', color: '#06b6d4', letterSpacing: '0.1em' }}>AI PLATFORM</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {["Home", "Practice", "AI Tutor", "Dashboard", "Analysis", "Gamify"].map(tab => (
              <button 
                key={tab} 
                className={`nav-link ${activeTab === tab ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === "Home" || tab === "Practice") {
                    setSelectedTopic(null);
                    setSelectedSubtopic(null);
                    setSelectedDifficulty(null);
                    setSelectedStreak(null);
                  }
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 20px 40px', width: '100%', flex: 1, position: 'relative', zIndex: 1 }}>
        {activeTab === "Home" && <HomeTab onStart={() => { setActiveTab("Practice"); setSelectedTopic(null); setSelectedSubtopic(null); setSelectedDifficulty(null); setSelectedStreak(null); }} onTutor={() => setActiveTab("AI Tutor")} />}
        {activeTab === "Practice" && !selectedTopic && (
          <div className="animate-fade-up" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 className="heading-hero" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>Deploy Agent</h2>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '3rem', fontSize: '1.1rem' }}>Select a specialized domain to begin the aptitude drill.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', maxWidth: 640, margin: '0 auto', width: '100%' }}>
              {TOPICS.map(t => (
                <button key={t.id} onClick={() => setSelectedTopic(t.id)} className="glass-panel" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: t.color, background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '50%', boxShadow: `inset 0 0 20px ${t.color}20` }}>{t.icon}</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>{t.label}</div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{t.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {activeTab === "Practice" && selectedTopic && !selectedSubtopic && (
          <div className="animate-fade-up" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <button 
                onClick={() => setSelectedTopic(null)}
                style={{ background: 'none', border: 'none', color: '#4a6fa5', cursor: 'pointer', fontSize: '0.9rem' }}
              >← Back</button>
              <h2 className="heading-hero" style={{ fontSize: '2.5rem', margin: 0 }}>Select Subtopic</h2>
            </div>
            <p style={{ color: '#06b6d4', textAlign: 'center', marginBottom: '3rem', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{TOPICS.find(t => t.id === selectedTopic)?.label} MODULE</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', maxWidth: 800, margin: '0 auto', width: '100%' }}>
              {TOPICS.find(t => t.id === selectedTopic)?.subtopics.map(subt => (
                <button key={subt} onClick={() => setSelectedSubtopic(subt)} className="glass-panel" style={{ padding: '1.25rem 1rem', cursor: 'pointer', textAlign: 'center', fontSize: '0.95rem', fontWeight: 600, color: '#e0f0ff', transition: 'all 0.2s' }}>
                  {subt}
                </button>
              ))}
            </div>
          </div>
        )}
        {activeTab === "Practice" && selectedTopic && selectedSubtopic && (!selectedDifficulty || !selectedStreak) && (
          <div className="animate-fade-up" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <button 
                onClick={() => setSelectedSubtopic(null)}
                style={{ background: 'none', border: 'none', color: '#4a6fa5', cursor: 'pointer', fontSize: '0.9rem' }}
              >← Back</button>
              <h2 className="heading-hero" style={{ fontSize: '2.5rem', margin: 0 }}>Set Parameters</h2>
            </div>
            <p style={{ color: '#06b6d4', textAlign: 'center', marginBottom: '3rem', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{selectedSubtopic}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: 800, margin: '0 auto', width: '100%' }}>
              {/* Difficulty Selection Column */}
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#e0f0ff', marginBottom: '1rem', textAlign: 'center' }}>1. Select Difficulty</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {DIFFICULTIES.map(d => (
                    <button key={d.key} onClick={() => setSelectedDifficulty(d.key)} className="glass-panel" style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: selectedDifficulty === d.key ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.05)', background: selectedDifficulty === d.key ? 'rgba(6,182,212,0.1)' : '' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                         <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{d.label}</div>
                         <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{d.key} Questions</div>
                       </div>
                       <div style={{ display: 'flex', gap: '0.15rem', color: '#06b6d4' }}>
                         {[...Array(d.sparks)].map((_, i) => <span key={i}>✦</span>)}
                       </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Streak Selection Column */}
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#e0f0ff', marginBottom: '1rem', textAlign: 'center' }}>2. Select Streak Size</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[15, 20, 25, 30].map(s => (
                    <button key={s} onClick={() => setSelectedStreak(s)} className="glass-panel" style={{ padding: '1.5rem 1rem', cursor: 'pointer', textAlign: 'center', border: selectedStreak === s ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.05)', background: selectedStreak === s ? 'rgba(168,85,247,0.1)' : '', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{s}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Questions</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "Practice" && selectedTopic && selectedSubtopic && selectedDifficulty && selectedStreak && (
          <div className="animate-fade-up">
            <PracticeTab topic={selectedTopic} subtopic={selectedSubtopic} difficulty={selectedDifficulty} streak={selectedStreak} onAnswer={handleAnswer} userProfile={userProfile} setUserProfile={setUserProfile} onHome={() => { setActiveTab("Home"); setSelectedTopic(null); setSelectedSubtopic(null); setSelectedDifficulty(null); setSelectedStreak(null); }} />
          </div>
        )}
        {activeTab === "AI Tutor" && <ChatTab />}
        {activeTab === "Dashboard" && <DashboardTab history={history} userProfile={userProfile} />}
        {(activeTab === "Analysis" || activeTab === "Gamify") && (
          <div className="glass-panel animate-fade-up" style={{ padding: '4rem', textAlign: 'center', marginTop: '4rem' }}>
            <h2 style={{ fontSize: '2rem', color: '#06b6d4', marginBottom: '1rem', fontFamily: '"Orbitron", sans-serif' }}>{activeTab} Module</h2>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>This advanced feature is currently being powered up by AI...</p>
          </div>
        )}
      </main>
    </div>
  );
}