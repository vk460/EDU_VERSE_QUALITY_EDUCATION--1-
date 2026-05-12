import React from 'react';
import { Plus, Search, ChevronLeft, UploadCloud, File, Loader } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ pdfFiles, isProcessingPdf }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="text-serif logo">PDF Bot</h1>
        <button className="icon-button"><ChevronLeft size={20} /></button>
      </div>

      <div className="sidebar-actions">
        <button className="new-chat-btn" onClick={() => window.location.reload()}>
          <Plus size={18} />
          New Chat
        </button>
      </div>

      <div className="sidebar-section">
        <h2 className="section-title">Recent Chats</h2>
        <div className="chat-item active">
          <div className="chat-item-content">
            <span className="chat-title">Current Conversation</span>
            <span className="chat-meta">Active Session</span>
          </div>
        </div>
      </div>

      <div className="sidebar-section bottom-section">
        <h2 className="section-title">Uploaded Documents ({pdfFiles ? pdfFiles.length : 0})</h2>
        <div className="document-list">
          {pdfFiles && pdfFiles.map((file, idx) => (
            <div key={idx} className="doc-item">
              <File size={16} className="doc-icon" />
              <span className="doc-name">{file.name}</span>
            </div>
          ))}
          
          {isProcessingPdf && (
            <div className="doc-item processing">
              <Loader size={16} className="animate-spin" />
              <span>Parsing new files...</span>
            </div>
          )}

          {(!pdfFiles || pdfFiles.length === 0) && !isProcessingPdf && (
            <div className="empty-docs">
              <UploadCloud size={24} className="empty-icon" />
              <p>No documents yet</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
