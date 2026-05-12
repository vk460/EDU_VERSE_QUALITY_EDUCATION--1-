import os
import re
from typing import Optional
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
import google.generativeai as genai

from .utils import call_ai

router = APIRouter(prefix="/api/pdf", tags=["PDF"])

class PDFChatRequest(BaseModel):
    user_query: str
    pdf_context: str
    action: Optional[str] = None

@router.post("/chat")
async def chat_with_pdf(req: PDFChatRequest):
    user_query = req.user_query
    pdf_context = req.pdf_context
    action = req.action

    # Define specialized prompts based on action (ported from original)
    if action == 'summarize':
        user_query = "For EACH provided document, provide a highly structured, point-wise summary labeled with the document name. Use clear headings, bullet points, and AT LEAST TWO NEWLINES between sections."
    elif action == 'flowchart':
        user_query = """For EACH provided document, create a SEPARATE, DETAILED hierarchical flowchart showing the main topic, sub-topics, and key concepts.
        STRICT MERMAID SYNTAX RULES (graph TD, A["Text"], wrap in double quotes, arrows on own row)."""
    elif action == 'key_points':
        user_query = "For EACH provided document, extract 5 critical insights labeled with the document name."
    elif action == 'generate_questions':
        user_query = "For EACH provided document, generate a highly structured set of exam questions (MCQ, Short, Long)."

    system_prompt = f"""
    You are an intelligent AI assistant for RAG (Retrieval-Augmented Generation).
    Use the provided PDF context to answer the user request.
    If information is not in the PDF, explicitly stated "Answer from outside the pdf."
    
    Context:
    {pdf_context[:30000]}
    """

    try:
        answer = await call_ai(user_query, system_prompt=system_prompt)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
