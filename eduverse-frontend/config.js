const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const CONFIG = {
    // In production (Vercel), we point to the absolute Render URL for WebSockets.
    BACKEND_URL: isLocal ? "http://localhost:8001" : "https://eduverse-backend-940m.onrender.com", 
};

export default CONFIG;
