import { NavLink } from 'react-router-dom';
import { 
    Plus, Search, Code2, Clock, Settings, 
    PanelLeftClose, BookOpen, PenTool, LayoutDashboard,
    User, LogOut, Bot, Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar({ isOpen, toggleSidebar, conversations, currentSessionId, onSelectConversation, onNewConversation }) {
    const { user, logout } = useAuth();

    if (!isOpen) {
        return (
            <div className="sidebar-collapsed">
                 <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
                     <LayoutDashboard size={20} />
                 </button>
            </div>
        );
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="brand" onClick={toggleSidebar} style={{cursor: 'pointer'}}>
                    <div className="brand-logo">
                        <Bot size={24} color="white" />
                    </div>
                    <div className="brand-text">
                        <h2>Algo Chat</h2>
                        <span>Learn • Practice • Master</span>
                    </div>
                </div>
                <button className="collapse-btn" onClick={toggleSidebar} title="Close sidebar">
                    <PanelLeftClose size={18} />
                </button>
            </div>

            <div className="sidebar-actions">
                <button className="new-chat-btn" onClick={onNewConversation}>
                    <Plus size={18} />
                    New Conversation
                </button>
                
                <div className="search-bar">
                    <Search size={16} />
                    <input type="text" placeholder="Search topics..." />
                </div>
            </div>

            <div className="sidebar-content">
                <div className="menu-group">
                   <div className="menu-item active">
                       <Code2 size={16} color="var(--accent-primary)" style={{marginRight: '8px'}} />
                       <span>Dynamic Programming</span>
                   </div>
                </div>

                <div className="menu-section">
                    <h3>RECENT CHATS</h3>
                    <div className="menu-list">
                        {conversations && conversations.length > 0 ? (
                            conversations.map(conv => (
                                <div 
                                   key={conv.id} 
                                   className={`history-item ${conv.id === currentSessionId ? 'active' : ''}`}
                                   onClick={() => onSelectConversation(conv.id)}
                                >
                                    <Clock size={16} />
                                    <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{conv.title}</span>
                                </div>
                            ))
                        ) : (
                            <div className="history-item" style={{opacity: 0.5}}>
                                <span>No recent chats</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="sidebar-footer">
                <NavLink to="/practice" className={({isActive}) => `footer-item practice-link ${isActive ? 'active' : ''}`}>
                    <PenTool size={18} color="var(--accent-primary)"/>
                    <span>Practice Canvas</span>
                </NavLink>

                <NavLink to="/video-tutor" className={({isActive}) => `footer-item video-link ${isActive ? 'active' : ''}`}>
                    <Play size={18} color="#ff0000"/>
                    <span>Video Tutor</span>
                </NavLink>

                <div className="footer-item">
                    <Settings size={18} />
                    <span>Settings</span>
                </div>
                
                <div className="footer-item user-identity">
                    <User size={18} />
                    <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>Learner</span>
                </div>
            </div>
        </aside>
    );
}
