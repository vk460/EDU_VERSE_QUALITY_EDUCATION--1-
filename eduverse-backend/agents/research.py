import os
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai

router = APIRouter(prefix="/api/research", tags=["Research"])

import httpx
from .utils import call_ai

router = APIRouter(prefix="/api/research", tags=["Research"])

class ResearchRequest(BaseModel):
    topic: str
    action: str  # "outline", "bibliography", "tone_check", "lit_review", "full_paper"
    context: Optional[str] = ""

SCHOLAR_FLOW_URL = "https://scholar-flow-ai-alpha.vercel.app"

@router.post("/generate")
async def generate_research_content(req: ResearchRequest):
    topic = req.topic
    action = req.action
    context = req.context

    # If action is 'full_paper', try to use ScholarFlow
    if action == "full_paper":
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                # ScholarFlow uses multipart/form-data for /generate
                files = {'topic': (None, topic), 'level': (None, 'Academic'), 'format': (None, 'APA')}
                resp = await client.post(f"{SCHOLAR_FLOW_URL}/generate", files=files)
                # Since it returns SSE, this simple post might not get the full paper
                # but we can return the status or a snippet if available.
                return {"message": "Full paper generation initiated via ScholarFlow.", "status_code": resp.status_code}
        except Exception as e:
            return {"error": f"ScholarFlow integration failed: {str(e)}"}

    prompts = {
        "outline": f"Create a highly structured academic research outline for the topic: {topic}. Include introduction, literature review, methodology, and expected results.",
        "bibliography": f"Generate a list of 10 credible, peer-reviewed source suggestions for a research paper on: {topic}. Provide them in APA format.",
        "tone_check": f"Review the following text for academic tone and professional consistency. Suggest improvements if it's too casual:\n\n{context}",
        "lit_review": f"Summarize the key historical and current research landscape for the topic: {topic}. Focus on major theories and gaps in literature."
    }

    if action not in prompts:
        raise HTTPException(status_code=400, detail="Invalid research action")

    try:
        answer = await call_ai(prompts[action])
        return {"content": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
