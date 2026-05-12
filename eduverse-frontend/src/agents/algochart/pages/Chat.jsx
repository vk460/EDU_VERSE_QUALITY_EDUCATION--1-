import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, LayoutDashboard, Paperclip } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from '../components/Sidebar';
import MermaidChart from '../components/MermaidChart';
import D3Visualizer from '../components/D3Visualizer';
import { useAuth } from '../context/AuthContext';
import './Chat.css';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessionId, setSessionId] = useState('');
  const [conversations, setConversations] = useState([]);
  const { user } = useAuth();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const fetchConversations = async () => {
    if (!user) return;
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/conversations/?user_id=${user.id}`);
        if(res.ok) {
            const data = await res.json();
            setConversations(data.conversations || []);
        }
    } catch(e) {
        console.error("Failed to fetch conversations", e);
    }
  };

  useEffect(() => {
     fetchConversations();
     setSessionId(uuidv4());
  }, [user]);

  const loadConversation = async (id) => {
    setSessionId(id);
    setIsLoading(true);
    setMessages([]);
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/messages/${id}/`);
        if(res.ok) {
            const data = await res.json();
            setMessages(data.messages || []);
        }
    } catch(e) {
        console.error("Failed to load conversation", e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setSessionId(uuidv4());
    setMessages([]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const isNewConversation = messages.length === 0;

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    if (inputRef.current) {
        inputRef.current.style.height = 'auto';
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/ask/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            query: userMessage.content,
            session_id: sessionId,
            user_id: user?.id
        }) 
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} ${errorText}`);
      }

      // Add a placeholder assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;

        setMessages((prev) => {
          const next = [...prev];
          if (next.length > 0) {
            next[next.length - 1] = { ...next[next.length - 1], content: assistantText };
          }
          return next;
        });
      }

      if (isNewConversation) {
        fetchConversations();
      }

    } catch (error) {
      setMessages((prev) => [
          ...prev, 
          { role: 'assistant', content: `Network error connecting to backend: ${error.message}.` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Sidebar 
          isOpen={isSidebarOpen} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          conversations={conversations}
          currentSessionId={sessionId}
          onSelectConversation={loadConversation}
          onNewConversation={handleNewConversation}
      />

      <main className="chat-main">
        <header className="chat-topbar">
           <div className="topbar-context">
               <Bot size={20} color="var(--accent-primary)" style={{marginRight: '0.5rem'}} />
               <span style={{fontWeight: 600}}>Algo Chat Conversation</span>
           </div>
           <div className="topbar-actions">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-moon" style={{color: 'var(--text-secondary)'}}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
           </div>
        </header>

        <div className="chat-scroll-container">
          {messages.length === 0 ? (
            <div className="chat-welcome-box">
                {/* Empty state resembling Image 1's starting prompt could go here */}
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg, index) => (
                <div key={index} className={`msg-row ${msg.role}`}>
                  
                  {msg.role === 'assistant' && (
                      <div className="msg-avatar assistant-avatar">
                         <Bot size={18} />
                      </div>
                  )}

                  <div className={`msg-bubble ${msg.role}`}>
                    {msg.role === 'assistant' ? (
                        <div className="markdown-content">
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
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                    ) : (
                        <p>{msg.content}</p>
                    )}
                  </div>

                  {msg.role === 'user' && (
                      <div className="msg-avatar user-avatar">
                         <User size={18} />
                      </div>
                  )}

                </div>
              ))}
              
              {isLoading && (
                <div className="msg-row assistant">
                  <div className="msg-avatar assistant-avatar">
                     <Bot size={18} />
                  </div>
                  <div className="msg-bubble assistant typing">
                    <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="input-dock">
          <div className="input-wrapper">
            <button className="attach-btn" title="Attach file">
                <Paperclip size={20} />
            </button>
            <textarea
              ref={inputRef}
              className="chat-textarea"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask me a DSA question..."
              rows={1}
            />
            <button 
              className="send-message-btn" 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="disclaimer-text">
            Algo Chat can make mistakes. Always verify algorithms with test cases.
          </p>
        </div>
      </main>
    </div>
  );
}
