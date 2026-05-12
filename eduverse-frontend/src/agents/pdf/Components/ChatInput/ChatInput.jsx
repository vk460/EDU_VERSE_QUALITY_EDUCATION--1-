import React, { useState, useRef } from 'react';
import { Paperclip, Mic, Send } from 'lucide-react';
import './ChatInput.css';

const ChatInput = ({ onSendMessage, onPdfUpload }) => {
  const [text, setText] = useState('');
  const fileInputRef = useRef(null);

  const handleSend = () => {
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length > 0) {
      onPdfUpload(pdfFiles);
    }
  };

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-container">
        
        <input 
          type="file" 
          accept="application/pdf"
          multiple
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        
        <button 
          className="icon-button attach-btn" 
          onClick={() => fileInputRef.current.click()}
        >
          <Paperclip size={20} />
        </button>
        
        <textarea 
          className="chat-textarea" 
          placeholder="Ask about your study material..."
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        
        <div className="chat-actions-right">
          <button className="icon-button mic-btn">
            <Mic size={20} />
          </button>
          <button 
            className="send-btn" 
            onClick={handleSend} 
            disabled={!text.trim()}
            style={{ opacity: text.trim() ? 1 : 0.5, cursor: text.trim() ? 'pointer' : 'default' }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
      <p className="disclaimer">
        PDF Bot may occasionally provide inaccurate information. Please verify important facts.
      </p>
    </div>
  );
};

export default ChatInput;
