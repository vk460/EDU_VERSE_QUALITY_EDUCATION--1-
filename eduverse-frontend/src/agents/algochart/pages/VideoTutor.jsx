import { useState, useRef, useEffect } from 'react';
import { Youtube, Send, ChevronRight, ChevronLeft, Map, MessageSquare, History, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Sidebar from '../components/Sidebar';
import './VideoTutor.css';

export default function VideoTutor() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoId, setVideoId] = useState('');
    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Phase 5 State
    const [activePane, setActivePane] = useState('roadmap'); // 'roadmap' | 'chat'
    const [chatQuery, setChatQuery] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [playerStartTime, setPlayerStartTime] = useState(0);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isChatLoading]);

    const handleProcessVideo = async () => {
        setIsLoading(true);
        setError('');
        setSteps([]);
        setCurrentStep(0);
        setVideoId('');
        setChatHistory([]);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/video/process/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: videoUrl })
            });

            if (response.ok) {
                const data = await response.json();
                setVideoId(data.video_id);
                setSteps(data.steps);
                // Initial greeting for chat
                setChatHistory([{
                    role: 'assistant',
                    content: `I've indexed this video! You can ask me anything about it, like "How does the recursion work here?" or "What's the main idea at 5:00?"`
                }]);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to process video');
            }
        } catch (err) {
            setError('Connection failed. Is the backend running?');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendQuery = async () => {
        if (!chatQuery.trim() || isChatLoading) return;

        const userMsg = { role: 'user', content: chatQuery };
        setChatHistory(prev => [...prev, userMsg]);
        setChatQuery('');
        setIsChatLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/video/chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ video_id: videoId, query: chatQuery })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            // Add placeholder assistant message
            setChatHistory(prev => [...prev, { role: 'assistant', content: '' }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantText += chunk;

                setChatHistory(prev => {
                    const next = [...prev];
                    if (next.length > 0) {
                        next[next.length - 1] = { ...next[next.length - 1], content: assistantText };
                    }
                    return next;
                });
            }
        } catch (err) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: `Connection error: ${err.message}.` }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleSeek = (timeStr) => {
        // timeStr format "[M:SS]" or "M:SS"
        const clean = timeStr.replace('[', '').replace(']', '');
        const parts = clean.split(':');
        if (parts.length === 2) {
            const seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
            setPlayerStartTime(seconds);
        }
    };

    // Helper to render markdown with clickable timestamps
    const MarkdownWithTimestamps = ({ content }) => {
        const timestampRegex = /\[(\d{1,2}:\d{2})\]/g;
        
        // Function to parse text and inject timestamp links
        const renderTextWithTimestamps = (text) => {
            if (typeof text !== 'string') return text;
            
            const parts = [];
            let lastIndex = 0;
            let match;
            
            while ((match = timestampRegex.exec(text)) !== null) {
                // Add text before the match
                if (match.index > lastIndex) {
                    parts.push(text.substring(lastIndex, match.index));
                }
                
                // Add the timestamp link
                const ts = match[0];
                parts.push(
                    <span 
                        key={match.index} 
                        className="timestamp-link" 
                        onClick={() => handleSeek(ts)}
                    >
                        {ts}
                    </span>
                );
                
                lastIndex = timestampRegex.lastIndex;
            }
            
            // Add remaining text
            if (lastIndex < text.length) {
                parts.push(text.substring(lastIndex));
            }
            
            return parts.length > 0 ? parts : text;
        };

        return (
            <ReactMarkdown
                components={{
                    // Override text rendering to inject timestamp links
                    text: ({ value }) => renderTextWithTimestamps(value)
                }}
            >
                {content}
            </ReactMarkdown>
        );
    };

    return (
        <div className="page-container video-tutor-container">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            
            <main className="video-main">
                <header className="video-header">
                    <div className="url-input-group">
                        <Youtube className="yt-icon" />
                        <input 
                            type="text" 
                            placeholder="Paste YouTube Tutorial URL"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleProcessVideo()}
                        />
                        <button onClick={handleProcessVideo} disabled={isLoading || !videoUrl}>
                            {isLoading ? 'Processing...' : 'Start Learning'}
                        </button>
                    </div>
                </header>

                <div className="video-content">
                    {error && <div className="video-error">{error}</div>}
                    
                    {!videoId && !isLoading && !error && (
                        <div className="video-welcome">
                            <div className="welcome-card">
                                <Sparkles className="sparkle-icon" size={32} />
                                <h3>AI-Powered Video Tutor</h3>
                                <p>Deeply understand complex coding tutorials through Socratic dialogue and instant Q&A.</p>
                                <div className="welcome-features">
                                    <div className="feature">
                                        <Map size={18} />
                                        <span>Roadmap Generation</span>
                                    </div>
                                    <div className="feature">
                                        <MessageSquare size={18} />
                                        <span>Chat with Video</span>
                                    </div>
                                    <div className="feature">
                                        <History size={18} />
                                        <span>Timestamped Search</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {videoId && (
                        <div className="video-workspace">
                            <div className="video-player-pane">
                                <div className="iframe-container">
                                    <iframe 
                                        key={playerStartTime}
                                        src={`https://www.youtube.com/embed/${videoId}?start=${playerStartTime}&autoplay=1`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                                
                                {activePane === 'chat' && (
                                    <div className="timestamp-hint">
                                        Tip: Ask "What happens at 2:30?" to jump to specific parts.
                                    </div>
                                )}
                            </div>

                            <div className="tutor-right-pane">
                                <div className="pane-tabs">
                                    <button 
                                        className={`tab-btn ${activePane === 'roadmap' ? 'active' : ''}`}
                                        onClick={() => setActivePane('roadmap')}
                                    >
                                        <Map size={16} /> Roadmap
                                    </button>
                                    <button 
                                        className={`tab-btn ${activePane === 'chat' ? 'active' : ''}`}
                                        onClick={() => setActivePane('chat')}
                                    >
                                        <MessageSquare size={16} /> Chat
                                    </button>
                                </div>

                                {activePane === 'roadmap' ? (
                                    <div className="tutor-steps-pane">
                                        {steps.length > 0 && (
                                            <div className="steps-container">
                                                <div className="step-card active">
                                                    <div className="step-badge">Step {steps[currentStep].step} of {steps.length}</div>
                                                    <h4>{steps[currentStep].title}</h4>
                                                    <p className="step-explanation">{steps[currentStep].explanation}</p>
                                                    
                                                    <div className="socratic-box">
                                                        <div className="socratic-label">
                                                            <Sparkles size={14} />
                                                            <span>Critical Thinking Question:</span>
                                                        </div>
                                                        <p className="step-question">{steps[currentStep].question}</p>
                                                    </div>
                                                </div>

                                                <div className="steps-navigation">
                                                    <button 
                                                        disabled={currentStep === 0}
                                                        onClick={() => setCurrentStep(prev => prev - 1)}
                                                    >
                                                        <ChevronLeft size={18} /> Previous
                                                    </button>
                                                    <button 
                                                        disabled={currentStep === steps.length - 1}
                                                        onClick={() => setCurrentStep(prev => prev + 1)}
                                                    >
                                                        Next <ChevronRight size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="tutor-chat-pane">
                                        <div className="chat-history">
                                            {chatHistory.map((msg, i) => (
                                                <div key={i} className={`message ${msg.role}`}>
                                                    <div className="message-label">
                                                        {msg.role === 'assistant' ? <Sparkles size={12} /> : null}
                                                        {msg.role === 'assistant' ? 'AI Tutor' : 'You'}
                                                    </div>
                                                    <div className="message-bubble">
                                                        <MarkdownWithTimestamps content={msg.content} />
                                                    </div>
                                                </div>
                                            ))}
                                            {isChatLoading && (
                                                <div className="chat-loading">
                                                    <div className="dot-flashing"></div>
                                                </div>
                                            )}
                                            <div ref={chatEndRef} />
                                        </div>
                                        
                                        <div className="chat-input-area">
                                            <div className="input-container">
                                                <input 
                                                    type="text" 
                                                    placeholder="Ask about this video..."
                                                    value={chatQuery}
                                                    onChange={(e) => setChatQuery(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSendQuery()}
                                                />
                                                <button className="send-btn" onClick={handleSendQuery} disabled={!chatQuery.trim() || isChatLoading}>
                                                    <Send size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
