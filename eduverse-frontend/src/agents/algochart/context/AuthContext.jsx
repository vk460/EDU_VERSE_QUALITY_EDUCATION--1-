import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState({
        id: '1',
        name: 'Learner',
        email: 'learner@algochat.ai',
        role: 'student'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // No longer need to check localStorage for mock flow
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('dsa_mentor_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('dsa_mentor_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
