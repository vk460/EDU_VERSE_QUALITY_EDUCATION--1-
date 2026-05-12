# EduVerse

## 🎥 YouTube Demo
(Add YouTube video link here after upload)

## Project Description
EduVerse is a futuristic, AI-driven holistic educational platform designed to provide a comprehensive suite of intelligent tools for students and professionals. Featuring a premium 3D interface and immersive "Quantum Cinema" aesthetics, the platform leverages multiple Large Language Models (LLMs) to power specialized agents for real-time interaction, research, and skill development.

Key features include:
- **AI-VTuber Communication Agent**: Interactive interview and speech coaching with real-time lip-sync and 3D avatars.
- **PDF/RAG Assistant**: Advanced document analysis and contextual questioning.
- **Research Agent**: Automated deep-web research and report synthesis.
- **Aptitude & Skill Evaluator**: Adaptive testing and performance analytics.
- **Professional Email Assistant**: AI-powered drafting and management of academic correspondence.

## Tech Stack
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Spline, Three.js, Framer Motion, Recharts, Mermaid.js.
- **Backend**: FastAPI, Python 3.10+, Socket.io (for real-time streaming).
- **AI/LLM**: Google Gemini SDK, Ollama, OpenRouter.
- **Database**: PostgreSQL with SQLModel ORM.
- **Utilities**: PyMuPDF, Axios, D3.js.

## How to Run

### Backend
1. Navigate to the `eduverse-backend` directory.
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Set up environment variables in a `.env` file (API keys for Gemini, Database URL, etc.).
4. Start the server:
   ```bash
   uvicorn main:sio_app --host 0.0.0.0 --port 8000
   ```

### Frontend
1. Navigate to the `eduverse-frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Local Server (Optional)
For testing specific agent components or the Python bridge:
```bash
python eduverse-frontend/fix_ui.py
```
