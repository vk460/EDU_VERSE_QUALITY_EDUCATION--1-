import React, { useRef, useEffect, useState } from 'react';
import { Brain, FileText, Sparkles, MessageSquare, Bot, User, Maximize2, Download, X } from 'lucide-react';
import mermaid from 'mermaid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MainContent.css';
import './ChatHistory.css';

// Initialize Mermaid once with dark theme
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true,
    curve: 'basis',
    rankSpacing: 80,
    nodeSpacing: 80,
  },
  themeVariables: {
    fontSize: '16px',
    primaryColor: '#1a1919',
    primaryTextColor: '#81ecff',
    primaryBorderColor: '#81ecff',
    lineColor: '#dd8bfb',
    background: '#0e0e0e',
    mainBkg: '#1a1919',
    nodeBorder: '#81ecff',
    clusterBkg: '#0e0e0e',
    titleColor: '#81ecff',
  }
});

const Mermaid = ({ text }) => {
  const [svg, setSvg] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [renderError, setRenderError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Use a stable unique ID per component instance to prevent DOM conflicts
  const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!text || !text.trim()) return;

    const sanitizeMermaid = (code) => {
      let s = code.trim();
      // Ensure it starts with a valid graph definition
      if (!s.match(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram)/)) {
        s = 'graph TD\n' + s;
      }
      // Remove backtick code fences if any leaked through
      s = s.replace(/^```mermaid\n?/m, '').replace(/```$/m, '').trim();
      // Replace problematic characters INSIDE node labels []
      // Pattern: find [text] and sanitize the inner text
      s = s.replace(/\[([^\]"]*)\]/g, (match, inner) => {
        const clean = inner
          .replace(/[(){}\/\\%@#&]/g, '-')
          .replace(/:/g, '-')
          .replace(/"/g, "'");
        return `["${clean}"]`;
      });
      // Fix unclosed subgraphs
      const subgraphCount = (s.match(/\bsubgraph\b/g) || []).length;
      const endCount = (s.match(/\bend\b/g) || []).length;
      if (subgraphCount > endCount) {
        s += '\n' + 'end\n'.repeat(subgraphCount - endCount);
      }
      return s;
    };

    const renderMermaid = async () => {
      setIsLoading(true);
      setRenderError(false);

      // Clean up any stale SVG elements left from previous renders
      const staleEl = document.getElementById(idRef.current);
      if (staleEl) staleEl.remove();

      const sanitized = sanitizeMermaid(text);

      try {
        const { svg: renderedSvg } = await mermaid.render(idRef.current, sanitized);
        // Scale the SVG to full width
        const cleanSvg = renderedSvg
          .replace(/width="[^"]*"/, 'width="100%"')
          .replace(/height="[^"]*"/, 'height="auto"');
        setSvg(cleanSvg);
        setRenderError(false);
      } catch (primaryErr) {
        console.warn('Primary Mermaid render failed. Attempting simplified fallback.', primaryErr);
        // Fallback: strip subgraphs to simplify diagram
        const fallbackId = idRef.current + '-fb';
        const fallback = sanitized
          .replace(/subgraph[\s\S]*?end/g, '')
          .replace(/\bend\b/g, '')
          .trim();
        try {
          const staleEl2 = document.getElementById(fallbackId);
          if (staleEl2) staleEl2.remove();
          const { svg: fallbackSvg } = await mermaid.render(fallbackId, fallback);
          const cleanFallbackSvg = fallbackSvg
            .replace(/width="[^"]*"/, 'width="100%"')
            .replace(/height="[^"]*"/, 'height="auto"');
          setSvg(cleanFallbackSvg);
          setRenderError(false);
        } catch (fallbackErr) {
          console.error('Mermaid fallback also failed:', fallbackErr);
          setRenderError(true);
          setSvg('');
        }
      } finally {
        setIsLoading(false);
      }
    };

    renderMermaid();
  }, [text]);

  const downloadSVG = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flowchart-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (renderError) {
    return (
      <div className="mermaid-wrapper">
        <div style={{ 
          background: 'rgba(255, 113, 108, 0.1)', 
          border: '1px solid var(--color-error)', 
          borderRadius: '12px', 
          padding: '16px',
          color: 'var(--color-error)',
          fontSize: '0.9rem',
          fontFamily: 'var(--font-body)'
        }}>
          ⚠️ Diagram couldn't render - the AI syntax was too complex. Try clicking Flowchart again for a new attempt.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mermaid-wrapper">
        {isLoading && (
          <div style={{ 
            padding: '24px', 
            textAlign: 'center', 
            color: 'var(--color-primary)',
            fontFamily: 'var(--font-nav)',
            fontSize: '0.85rem',
            letterSpacing: '1px'
          }}>
            ⚡ Generating diagram...
          </div>
        )}
        {!isLoading && svg && (
          <>
            <div className="mermaid-controls">
              <button onClick={() => setIsModalOpen(true)} title="View Larger"><Maximize2 size={16} /></button>
              <button onClick={downloadSVG} title="Download SVG"><Download size={16} /></button>
            </div>
            <div className="mermaid-container" dangerouslySetInnerHTML={{ __html: svg }} />
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="mermaid-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="mermaid-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            <div className="mermaid-modal-scroll">
              <div dangerouslySetInnerHTML={{ __html: svg }} />
            </div>
            <div className="modal-footer">
               <button onClick={downloadSVG} className="download-btn-large">
                 <Download size={18} /> Download Flowchart
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const MainContent = ({ messages, isAiTyping, onChipClick }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiTyping]);

  const renderMessageContent = (content) => {
    // Regex to split by mermaid code blocks: ```mermaid [code] ```
    const parts = content.split(/(```mermaid[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.trim().startsWith('```mermaid')) {
        // Extract the code from the block
        const code = part.replace(/```mermaid\n?/, '').replace(/```$/, '').trim();
        return <Mermaid key={index} text={code} />;
      }
      // Render normal text
      if (!part.trim()) return null;
      return (
        <div key={index} className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {part}
          </ReactMarkdown>
        </div>
      );
    });
  };

  return (
    <div className="main-content">
      <header className="main-header">
        <div className="header-left">
          <h2 className="text-serif header-title">PDF Agent</h2>
          <span className="text-muted header-subtitle">Upload a document to get started</span>
        </div>
        <div className="header-right">
          <div className="status-badge">
            <span className="status-dot"></span>
            Online
          </div>
        </div>
      </header>

      {messages && messages.length > 0 ? (
        <div className="chat-history">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble-wrapper ${msg.role === 'user' ? 'user' : 'ai'}`}>
              <div className="chat-avatar">
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className="chat-bubble">
                {renderMessageContent(msg.content)}
              </div>
            </div>
          ))}
          {isAiTyping && (
             <div className="chat-bubble-wrapper ai">
               <div className="chat-avatar"><Bot size={20} /></div>
               <div className="chat-bubble typing-indicator">
                 <span className="dot">●</span>
                 <span className="dot">●</span>
                 <span className="dot">●</span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="hero-section">
          <div className="hero-icon-container">
            <Brain size={48} className="hero-icon" />
          </div>
          <h1 className="text-serif hero-title">PDF Agent</h1>
          <p className="text-muted hero-description">Upload your study materials and ask anything...</p>

          <div className="feature-grid">
            <div className="feature-card">
              <FileText size={24} className="feature-icon" />
              <h3>Upload Study Material</h3>
              <p>Drop PDFs, docs, or notes...</p>
            </div>
            <div className="feature-card">
              <Brain size={24} className="feature-icon" />
              <h3>Smart RAG Answers</h3>
              <p>Get answers from your docs...</p>
            </div>
            <div className="feature-card">
              <Sparkles size={24} className="feature-icon" />
              <h3>AI-Powered Summaries</h3>
              <p>Summarize chapters, highlight...</p>
            </div>
            <div className="feature-card">
              <MessageSquare size={24} className="feature-icon" />
              <h3>Conversational Learning</h3>
              <p>Have a natural conversation...</p>
            </div>
          </div>

          <div className="suggestion-chips">
            <button className="chip" onClick={() => onChipClick && onChipClick('Summarize this document for me')}>Summarize this document for me</button>
            <button className="chip" onClick={() => onChipClick && onChipClick('What are the key concepts?')}>What are the key concepts?</button>
            <button className="chip" onClick={() => onChipClick && onChipClick('Create a study guide')}>Create a study guide</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainContent;
