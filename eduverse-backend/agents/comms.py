import os
import random
from typing import Optional, Dict
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
import google.generativeai as genai
import httpx

# Path to assets in frontend - resolve relative to this file
_BASE = os.path.dirname(os.path.abspath(__file__))
FRONTEND_COMMS_PATH = os.path.join(_BASE, "..", "..", "eduverse-frontend", "public", "comms")

router = APIRouter(prefix="/api/comms", tags=["Communications"])

from .utils import call_ai

class ChatRequest(BaseModel):
    username: str = "User"
    text: str
    mode: str = "chat"  # "chat" or "interview"

# In-memory interview sessions
interview_sessions: Dict[str, dict] = {}

@router.post("/ask")
async def ask_ai(req: ChatRequest):
    username = req.username
    text = req.text
    mode = req.mode

    if mode == "interview":
        return await handle_interview(username, text)

    try:
        persona = os.getenv("PERSONA_NAME", "EduVerse Assistant")
        role = os.getenv("PERSONA_ROLE", "an educational AI tutor")
        prompt = f"You are {persona}, {role}. Respond helpfully and concisely to: {text}"
        answer = await call_ai(prompt)
        return {"text": answer}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def handle_interview(username: str, text: str):
    session = interview_sessions.get(username)

    if not session:
        session = {
            "questions_asked": 1,
            "total_questions": 10,
            "history": [],
            "role": text
        }
        interview_sessions[username] = session
        prompt = f"Start a job interview for the role: {text}. Ask the first question."
    else:
        session["questions_asked"] += 1
        if session["questions_asked"] > session["total_questions"]:
            prompt = f"The interview is over. Provide a final score (out of 10) and feedback based on these answers: {session['history']}"
            interview_sessions.pop(username)
        else:
            prompt = f"The candidate answered: {text}. Ask the next interview question ({session['questions_asked']}/{session['total_questions']})."

    try:
        answer = await call_ai(prompt)
        if username in interview_sessions:
            interview_sessions[username]["history"].append({"q": prompt, "a": text})
        return {"text": answer, "session": session}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Asset Listing Functions
async def list_models():
    models_dir = os.path.join(FRONTEND_COMMS_PATH, "models")
    if not os.path.exists(models_dir):
        return []
    return [d for d in os.listdir(models_dir) if os.path.isdir(os.path.join(models_dir, d))]

async def list_model_files(model_name: str):
    model_dir = os.path.join(FRONTEND_COMMS_PATH, "models", model_name)
    if not os.path.exists(model_dir):
        return []
    return [f for f in os.listdir(model_dir) if f.endswith(".json") and "model" in f]

async def list_backgrounds():
    bg_dir = os.path.join(FRONTEND_COMMS_PATH, "images", "background")
    if not os.path.exists(bg_dir):
        return []
    return [f for f in os.listdir(bg_dir) if os.path.isfile(os.path.join(bg_dir, f))]

async def list_sounds():
    sounds_dir = os.path.join(FRONTEND_COMMS_PATH, "mp3")
    if not os.path.exists(sounds_dir):
        return []
    return [f for f in os.listdir(sounds_dir) if f.endswith(".mp3")]

# Asset Listing Endpoints
@router.get("/models")
async def get_models():
    return {"models": await list_models()}

@router.get("/models/{model_name}")
async def get_model_files(model_name: str):
    return {"files": await list_model_files(model_name)}

@router.get("/backgrounds")
async def get_backgrounds():
    return {"images": await list_backgrounds()}

@router.get("/sounds")
async def get_sounds():
    return {"sounds": await list_sounds()}
