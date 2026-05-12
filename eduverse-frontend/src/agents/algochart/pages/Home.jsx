import { NavLink } from 'react-router-dom';
import { Sparkles, Code, BookOpen, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export default function Home() {
    const { user } = useAuth();

    return (
        <div className="home-container">
            <nav className="home-nav">
                <div className="brand-logo-container">
                   <div className="brand-logo">
                       <Bot size={24} color="white" />
                   </div>
                   <span className="brand-title">Algo Chat</span>
                </div>
                <div className="nav-actions">
                    <NavLink to="/chat" className="nav-btn-primary">
                        Start Learning
                    </NavLink>
                </div>
            </nav>

            <main className="hero-section">
                <div className="hero-badge">
                   <Sparkles size={14} color="var(--accent-primary)"/>
                   <span>AI-Powered DSA Tutor</span>
                </div>
                
                <h1 className="hero-title">
                    Master <span className="highlight-orange">Algorithms</span> with<br/>
                    Your AI Tutor
                </h1>
                
                <p className="hero-subtitle">
                    Learn data structures and algorithms through interactive conversations, 
                    practice problems, and step-by-step explanations.
                </p>
                
                <div className="hero-cta-group">
                   <NavLink to="/chat" className="hero-btn-primary">
                      Start Learning →
                   </NavLink>
                </div>

                {/* Example feature cards at the bottom mimicking Image 5 */}
                <div className="features-grid">
                    <div className="feature-card">
                       <Code size={24} color="var(--accent-primary)" className="mb-2"/>
                       <h3>Practice Canvas</h3>
                    </div>
                    <div className="feature-card">
                       <BookOpen size={24} color="var(--accent-primary)" className="mb-2"/>
                       <h3>Curated Topics</h3>
                    </div>
                </div>
            </main>
        </div>
    );
}
