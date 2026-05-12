import React, { useState } from 'react';
import { Book, GraduationCap, FileText, CheckCircle, Search, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import CONFIG from '../../../config.js';

const ResearchAgent = () => {
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('outline');

  const handleGenerate = async (action) => {
    if (!topic && action !== 'tone_check') return;
    setLoading(true);
    setActiveTab(action);
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/research/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, action, context: result }),
      });
      const data = await response.json();
      setResult(data.content);
    } catch (error) {
      console.error('Research error:', error);
      setResult('Error generating research content. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#facc15]/20 flex items-center justify-center">
              <Book className="text-[#facc15]" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-headline">Research <span className="text-[#facc15]">Paper Agent</span></h1>
              <p className="text-sm opacity-60">Academic Excellence & Analysis</p>
            </div>
          </div>
          <button onClick={() => window.location.href = 'features.html'} className="px-5 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all text-sm uppercase tracking-widest">
            Back to Portal
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass p-6 rounded-3xl border border-white/5">
              <label className="block text-xs uppercase tracking-widest text-[#facc15] font-bold mb-3">Topic / Subject</label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#facc15]/50 outline-none transition-all h-32"
                placeholder="Enter your research topic or abstract..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              
              <div className="grid grid-cols-1 gap-3 mt-6">
                <button 
                  onClick={() => handleGenerate('outline')}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'outline' ? 'bg-[#facc15] text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <FileText size={18} />
                  <span className="text-sm font-bold">Structured Outline</span>
                </button>
                <button 
                  onClick={() => handleGenerate('bibliography')}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'bibliography' ? 'bg-[#facc15] text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <Search size={18} />
                  <span className="text-sm font-bold">Bibliography Generator</span>
                </button>
                <button 
                  onClick={() => handleGenerate('lit_review')}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'lit_review' ? 'bg-[#facc15] text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <GraduationCap size={18} />
                  <span className="text-sm font-bold">Literature Review</span>
                </button>
                <button 
                  onClick={() => handleGenerate('tone_check')}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'tone_check' ? 'bg-[#facc15] text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <CheckCircle size={18} />
                  <span className="text-sm font-bold">Academic Tone Check</span>
                </button>
              </div>
            </div>
          </div>

          {/* Result Area */}
          <div className="lg:col-span-8">
            <div className="glass h-[700px] flex flex-col rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <span className="text-xs uppercase tracking-widest opacity-60 font-bold">Research Workspace</span>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <Download size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 prose prose-invert max-w-none">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-60">
                    <div className="w-12 h-12 border-4 border-t-[#facc15] border-[#facc15]/20 rounded-full animate-spin mb-4"></div>
                    <p className="animate-pulse">Analyzing academic databases...</p>
                  </div>
                ) : result ? (
                  <ReactMarkdown>{result}</ReactMarkdown>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <Book size={64} className="mb-6" />
                    <h3 className="text-2xl font-bold mb-2">Ready to Conduct Research</h3>
                    <p className="max-w-md mx-auto">Enter a topic and select a research assistant mode to generate academic structure and frameworks.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(10px); }
        .font-headline { font-family: 'Orbitron', sans-serif; }
        .prose h1, .prose h2, .prose h3 { color: #facc15; font-family: 'Orbitron', sans-serif; letter-spacing: 0.05em; }
        .prose li { list-style-type: decimal; }
      `}</style>
    </div>
  );
};

export default ResearchAgent;
