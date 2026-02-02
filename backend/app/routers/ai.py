"""
Ruta Segura Perú - AI Services Router
Provides AI capabilities: Translation, Safety Analysis, etc.
"""
import os
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import anthropic
from app.config import settings

router = APIRouter(prefix="/ai", tags=["AI Services"])

class TranslationRequest(BaseModel):
    text: str # Fixed 'string' to 'str'
    source_language: Optional[str] = None # Auto-detect if None
    target_language: str

class TranslationResponse(BaseModel):
    translated_text: str
    detected_source_language: Optional[str] = None
    confidence: float
    provider: str

@router.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    """
    Translate text using Anthropic Claude 3 Haiku for speed and accuracy.
    """
    if not request.text:
        raise HTTPException(status_code=400, detail="Text is required")

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        # Fallback to mock if no key provided (for dev safety)
        return TranslationResponse(
            translated_text=f"[MOCK] {request.text}",
            confidence=0.0,
            provider="Mock-NoKey"
        )

    try:
        client = anthropic.AsyncAnthropic(api_key=api_key)
        
        system_prompt = f"You are a professional translator for a tourism safety app. Translate the following text into {request.target_language} (ISO code). Output ONLY the translated text, no javascript or explanations."
        
        if request.source_language:
            system_prompt += f" The source language is {request.source_language}."

        message = await client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1024,
            temperature=0.0,
            system=system_prompt,
            messages=[
                {"role": "user", "content": request.text}
            ]
        )

        translated = message.content[0].text.strip()

        return TranslationResponse(
            translated_text=translated,
            confidence=0.99,
            provider="Claude-3-Haiku"
        )

    except Exception as e:
        print(f"Translation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
