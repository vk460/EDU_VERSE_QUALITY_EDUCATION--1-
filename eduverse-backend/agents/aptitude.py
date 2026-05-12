import os
import random
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import google.generativeai as genai
from sqlmodel import SQLModel, Field, select, Session
from core.database import engine

# --- Models ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, unique=True)
    username: str
    xp: int = 0

class QuestionResponse(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

# --- Database usage via engine from core.database ---

from .utils import call_ai
import json

router = APIRouter(prefix="/api/aptitude", tags=["Aptitude"])

@router.get("/question", response_model=QuestionResponse)
async def get_question(
    topic: str = "quant", 
    subtopic: str = "General", 
    difficulty: str = "Medium"
):
    prompt = f"""
    Generate a high-quality aptitude question.
    Topic: {topic}
    Subtopic: {subtopic}
    Difficulty: {difficulty}

    Return ONLY raw JSON format:
    {{
        "question": "...",
        "options": ["...", "...", "...", "..."],
        "correct_answer": "...",
        "explanation": "..."
    }}
    """
    try:
        text = await call_ai(prompt)
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        data = json.loads(text)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/user/sync")
async def sync_user(user_id: str, username: Optional[str] = None):
    with Session(engine) as session:
        statement = select(User).where(User.user_id == user_id)
        user = session.exec(statement).first()
        if not user:
            if not username:
                adjectives = ['Quantum', 'Astro', 'Cyber', 'Neon', 'Stealth']
                nouns = ['Coder', 'Ninja', 'Master', 'Spectre', 'Rider']
                username = f"{random.choice(adjectives)}{random.choice(nouns)}{random.choice(range(100, 999))}"
            user = User(user_id=user_id, username=username, xp=0)
            session.add(user)
            session.commit()
            session.refresh(user)
        return user

@router.get("/leaderboard")
async def get_leaderboard():
    with Session(engine) as session:
        statement = select(User).order_by(User.xp.desc()).limit(10)
        results = session.exec(statement).all()
        return {"leaderboard": results}

# Tables are initialized by main.py
