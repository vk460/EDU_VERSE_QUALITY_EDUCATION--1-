import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Play, RefreshCcw, ArrowLeft, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from '../components/Sidebar';
import MermaidChart from '../components/MermaidChart';
import D3Visualizer from '../components/D3Visualizer';
import './Practice.css';

export default function Practice() {
   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
   const [sessionId, setSessionId] = useState('');
   const [learningGoal, setLearningGoal] = useState('Implement a Fibonacci sequence');
   const [code, setCode] = useState(`# Socratic AI Python Practice Canvas\n# Define your goal above, then start coding!\n\ndef main():\n    print("Hello, Python AI Tutor!")\n\nif __name__ == "__main__":\n    main()`);
   const [stdin, setStdin] = useState('');
   const [output, setOutput] = useState('');
   const [isAnalyzing, setIsAnalyzing] = useState(false);

   useEffect(() => {
       // Initialize session ID on mount
       setSessionId(uuidv4());
   }, []);

    const handleRunAndAnalyze = async () => {
        setIsAnalyzing(true);
        setOutput(`*Executing logic on backend...*\n\n*Sending to AI Tutor for Socratic analysis...*`);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/analyze/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    code: code,
                    stdin: stdin,
                    goal: learningGoal,
                    session_id: sessionId
                }) 
            });

            if (response.ok) {
                const data = await response.json();
                const localExecutionResult = data.execution_output || 'No output.';
                setOutput(`**Execution Output:**\n\`\`\`text\n${localExecutionResult}\n\`\`\`\n\n---\n\n**🤖 AI Tutor Remarks:**\n\n${data.hints}`);
            } else {
                setOutput(`⚠️ Failed to get Socratic hints: ${response.statusText}`);
            }
        } catch (error) {
            setOutput(`⚠️ Backend Connection Error: ${error.toString()}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

   const resetCanvas = () => {
       setLearningGoal('Implement a Fibonacci sequence');
       setCode(`# Socratic AI Python Practice Canvas\n# Define your goal above, then start coding!\n\ndef main():\n    print("Hello, Python AI Tutor!")\n\nif __name__ == "__main__":\n    main()`);
       setStdin('');
       setOutput('');
       setSessionId(uuidv4());
   };

   return (
      <div className="page-container" style={{backgroundColor: 'var(--bg-sidebar)'}}>
         <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
         
         <main className="practice-main">
            <header className="practice-header">
               <div className="practice-title">
                  <NavLink to="/chat" className="back-link">
                     <ArrowLeft size={18} />
                  </NavLink>
                  <div className="goal-container">
                    <div className="goal-label">
                        <Target size={14} />
                        <span>Practice Goal:</span>
                    </div>
                    <input 
                        className="goal-input"
                        value={learningGoal}
                        onChange={(e) => setLearningGoal(e.target.value)}
                        placeholder="What are you learning today?"
                    />
                  </div>
               </div>
               <div className="practice-actions">
                  <button className="reset-btn" onClick={resetCanvas}>
                     <RefreshCcw size={16} /> Reset
                  </button>
                  <button className="action-btn run-btn" onClick={handleRunAndAnalyze} disabled={isAnalyzing}>
                     <Play size={16} /> {isAnalyzing ? 'Analyzing...' : 'Run & Analyze'}
                  </button>
               </div>
            </header>

            <div className="practice-workspace">
               {/* Left Editor Pane */}
               <div className="editor-pane">
                   <div className="pane-header">Code Editor (Python)</div>
                   <textarea
                       className="code-editor"
                       value={code}
                       onChange={(e) => setCode(e.target.value)}
                       spellCheck="false"
                   />
                   
                   <div className="pane-header stdin-header">Standard Input (stdin)</div>
                   <textarea
                       className="stdin-editor"
                       value={stdin}
                       onChange={(e) => setStdin(e.target.value)}
                       placeholder="Enter data for your program's input() calls here..."
                       spellCheck="false"
                   />
               </div>

               {/* Right Output Pane */}
               <div className="output-pane">
                  <div className="output-header">
                     Execution & AI Tutor Output
                  </div>
                  <div className="output-content markdown-content" style={{overflowY: 'auto'}}>
                     {output === '' ? (
                        <div className="empty-output">
                            <p>Write your <strong>Python</strong> code on the left and click <strong>"Run & Analyze"</strong>.</p>
                            <p>Our Socratic AI will analyze your work and provide hints without giving away the answer!</p>
                        </div>
                                           ) : (
                         <ReactMarkdown
                             components={{
                                 code({ node, inline, className, children, ...props }) {
                                     const match = /language-(\w+)/.exec(className || '');
                                     if (!inline && match && match[1] === 'mermaid') {
                                         return <MermaidChart chart={String(children).replace(/\n$/, '')} />;
                                     }
                                     if (!inline && match && match[1] === 'd3-json') {
                                         try {
                                             const data = JSON.parse(String(children));
                                             return <D3Visualizer data={data} />;
                                         } catch (e) {
                                             return <pre className={className}>Invalid D3 JSON</pre>;
                                         }
                                     }
                                     return (
                                         <code className={className} {...props}>
                                             {children}
                                         </code>
                                     );
                                 }
                             }}
                         >
                             {output}
                         </ReactMarkdown>
                      )}
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
}
