import os
import smtplib
from email.message import EmailMessage
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import google.generativeai as genai

from .utils import call_ai

router = APIRouter(prefix="/api/email", tags=["Email"])

class EmailGenerateRequest(BaseModel):
    sender_name: str = "[Your Name]"
    sender_email: str = "[Your Email]"
    sender_phone: str = "[Your Phone]"
    receiver_email: str = "[Receiver Email]"
    tone: str = "Professional"
    prompt: str = ""

@router.post("/generate")
async def generate_email(req: EmailGenerateRequest):
    system_instruction = f"""
    You are an AI Email Assistant. Generate a structured email.
    Sender: {req.sender_name} ({req.sender_email}, {req.sender_phone})
    Receiver: {req.receiver_email}
    Tone: {req.tone}
    Prompt: {req.prompt}

    Output format:
    Subject: <subject>
    Body:
    <body>
    Signature:
    <signature with details>
    """
    try:
        answer = await call_ai(system_instruction)
        return {"generated_email": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send")
async def send_email(
    receiver: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = os.getenv("EMAIL_HOST_USER")
        msg['To'] = receiver

        if file:
            content = await file.read()
            msg.add_attachment(
                content,
                maintype='application',
                subtype='octet-stream',
                filename=file.filename
            )

        # SMTP Config
        host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
        port = int(os.getenv("EMAIL_PORT", 587))
        user = os.getenv("EMAIL_HOST_USER")
        password = os.getenv("EMAIL_HOST_PASSWORD")

        if not user or not password:
            raise HTTPException(status_code=400, detail="Email credentials not configured")

        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(user, password)
            server.send_message(msg)

        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
