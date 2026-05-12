import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load common environment variables
load_dotenv()

# Import Agent routers
from agents.aptitude import router as aptitude_router
from agents.email import router as email_router
from agents.pdf import router as pdf_router
from agents.comms import router as comms_router
from agents.research import router as research_router
from core.database import create_db_and_tables

import socketio

app = FastAPI(title="EduVerse Unified Backend")

# Initialize Socket.io
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
sio_app = socketio.ASGIApp(sio, app)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Include Routers
app.include_router(aptitude_router)
app.include_router(email_router)
app.include_router(pdf_router)
app.include_router(comms_router)
app.include_router(research_router)

# Standard CORS setup - allow all origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.io Events
@sio.event
async def connect(sid, environ):
    print(f"Socket connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Socket disconnected: {sid}")

@sio.on("ask_ai")
async def handle_ask_ai(sid, data):
    from agents.utils import call_ai
    text = data.get("text", "")
    try:
        response_text = await call_ai(text)
        await sio.emit("ai_response", {"text": response_text}, to=sid)
    except Exception as e:
        await sio.emit("ai_error", {"message": str(e)}, to=sid)

@sio.on("get_init_cfg")
async def handle_get_init_cfg(sid, data=None):
    from agents.comms import list_models, list_backgrounds, list_sounds
    # Mock config for now
    cfg = {
        "PERSONA_NAME": "EduVerse Assistant",
        "PERSONA_ROLE": "Educational AI",
        "PRE_PROMPT": "",
        "AVATAR_MODEL": "shizuku",
        "BACKGROUND_IMAGE": "classroom.jpg",
        "FIXED_LANGUAGE": "en",
        "WAKE_WORD_ENABLED": False,
        "AI_PROVIDER": "gemini",
        "GEMINI_MODEL": "gemini-1.5-flash"
    }
    
    avatar_list = await list_models()
    bg_list = await list_backgrounds()
    sounds_list = await list_sounds()
    
    await sio.emit("init_cfg", {
        "status": "success",
        "data": {
            "config": cfg,
            "avatarList": avatar_list,
            "backgroundList": bg_list,
            "ollamaModelList": [],
            "soundsList": sounds_list
        }
    }, to=sid)

@app.get("/")
async def root():
    return {"message": "EduVerse Unified Backend is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc)},
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(sio_app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
