import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Eye, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (user) {
            navigate('/chat');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (name.trim() === '' || email.trim() === '') {
            alert('Please enter your name and email');
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                login(data);
                navigate('/chat');
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            alert('Could not connect to the backend server.');
        }
    };

    return (
        <div className="login-container">
            {/* Left Split - Branding */}
            <div className="login-branding">
                 <div className="branding-content">
                     <div className="brand-logo-large">
                         <div className="brand-logo">
                             <Bot size={30} color="white" />
                         </div>
                         <span className="brand-title">Algo Chat</span>
                     </div>
                     <p className="branding-text">
                         Join thousands of developers mastering algorithms
                     </p>
                 </div>
                 
                 {/* Decorative code faint text in background */}
                 <div className="bg-code-decor">
                    {'class TreeNode {\\n  constructor(val) {\\n    this.val = val;\\n  }\\n}\\n// DFS Traversal'}
                 </div>
            </div>

            {/* Right Split - Form */}
            <div className="login-form-side">
                <div className="form-wrapper">
                    <h1 className="form-title">Create your account</h1>
                    <p className="form-subtitle">Start your DSA journey today</p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="input-field">
                            <label>Full Name</label>
                            <input 
                                type="text" 
                                placeholder="John Doe" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required 
                            />
                        </div>
                        <div className="input-field">
                            <label>Email</label>
                            <input 
                                type="email" 
                                placeholder="you@example.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>
                        <div className="input-field">
                            <label>Password (Mock)</label>
                            <div className="password-input-wrapper">
                                <input type="password" placeholder="••••••••" required />
                                <button type="button" className="eye-btn"><Eye size={16}/></button>
                            </div>
                        </div>

                        <button type="submit" className="submit-auth-btn">
                            Create Account →
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Already have an account? <span style={{color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600}} onClick={handleSubmit}>Sign in</span></p> 
                    </div>
                </div>
            </div>
        </div>
    );
}
