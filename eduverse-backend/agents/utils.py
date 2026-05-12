import os
import httpx
import google.generativeai as genai
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

# AI Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Check if we should use OpenRouter
USE_OPENROUTER = bool(OPENROUTER_API_KEY and OPENROUTER_API_KEY.startswith("sk-or-"))

# Configure Gemini as fallback
if not USE_OPENROUTER and GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")
    except Exception:
        gemini_model = None
else:
    gemini_model = None

async def call_ai(prompt: str, system_prompt: str = "") -> str:
    """Consolidated AI caller supporting OpenRouter and Gemini."""
    
    if USE_OPENROUTER:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                resp = await client.post(
                    f"{OPENROUTER_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": OPENROUTER_MODEL,
                        "messages": messages,
                        "max_tokens": 1000,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"OpenRouter Error: {e}")
            # Fall back to Gemini if OpenRouter fails
            if gemini_model:
                pass
            else:
                raise HTTPException(status_code=500, detail=f"AI Request failed: {str(e)}")

    if gemini_model:
        try:
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            response = gemini_model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gemini Request failed: {str(e)}")
    
    raise HTTPException(status_code=500, detail="No valid AI provider (OpenRouter or Gemini) configured.")
