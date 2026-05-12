import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Chat from './pages/Chat';
import Home from './pages/Home';
import Login from './pages/Login';
import Practice from './pages/Practice';
import VideoTutor from './pages/VideoTutor';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          
          <Route path="/chat" element={<Chat />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/video-tutor" element={<VideoTutor />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
