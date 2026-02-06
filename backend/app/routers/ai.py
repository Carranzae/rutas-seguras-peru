"""
Ruta Segura Perú - AI Services Router
Provides AI capabilities: Translation, Speech-to-Text, Safety Analysis
"""
import os
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import anthropic
from app.config import settings

router = APIRouter(prefix="/ai", tags=["AI Services"])

# In-memory session storage (use Redis in production)
translation_sessions: Dict[str, Dict[str, Any]] = {}


class TranslationRequest(BaseModel):
    text: str
    source_language: Optional[str] = None  # Auto-detect if None
    target_language: str


class TranslationResponse(BaseModel):
    translated_text: str
    detected_source_language: Optional[str] = None
    confidence: float
    provider: str


class SpeechToTextResponse(BaseModel):
    text: str
    language: str
    confidence: float
    duration_seconds: float


class TranslationSessionCreate(BaseModel):
    tour_id: Optional[str] = None
    guide_id: str
    guide_language: str
    tourist_language: str


class TranslationSessionResponse(BaseModel):
    session_id: str
    tour_id: Optional[str]
    guide_id: str
    guide_language: str
    tourist_language: str
    is_active: bool
    created_at: str
    participants: List[Dict[str, Any]]


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


@router.post("/speech-to-text", response_model=SpeechToTextResponse)
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str = Form("es")
):
    """
    Convert speech audio to text.
    Uses Whisper API in production, mock for development.
    """
    try:
        # Read audio file
        audio_data = await audio.read()
        file_size = len(audio_data)
        
        # Estimate duration (rough estimate based on file size)
        duration = file_size / 32000  # Assuming ~32kbps audio
        
        # Check for OpenAI API key for Whisper
        openai_key = os.getenv("OPENAI_API_KEY")
        
        if not openai_key:
            # Mock response for development
            mock_texts = {
                "es": "¡Bienvenidos a Machu Picchu! Esta es una de las maravillas del mundo.",
                "en": "Welcome to Machu Picchu! This is one of the wonders of the world.",
                "fr": "Bienvenue à Machu Picchu! C'est l'une des merveilles du monde.",
                "de": "Willkommen in Machu Picchu! Dies ist eines der Weltwunder.",
            }
            return SpeechToTextResponse(
                text=mock_texts.get(language, mock_texts["es"]),
                language=language,
                confidence=0.85,
                duration_seconds=duration
            )
        
        # Production: Use OpenAI Whisper API
        import openai
        openai.api_key = openai_key
        
        # Save temp file for Whisper
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name
        
        try:
            with open(tmp_path, "rb") as audio_file:
                transcript = openai.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language[:2]  # Whisper uses 2-letter codes
                )
            
            return SpeechToTextResponse(
                text=transcript.text,
                language=language,
                confidence=0.95,
                duration_seconds=duration
            )
        finally:
            os.unlink(tmp_path)
            
    except Exception as e:
        print(f"Speech-to-Text Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/translation-session", response_model=TranslationSessionResponse)
async def create_translation_session(request: TranslationSessionCreate):
    """
    Create a real-time translation session between guide and tourists.
    Returns session_id for WebSocket connection.
    """
    session_id = f"ts_{uuid.uuid4().hex[:12]}"
    
    session = {
        "session_id": session_id,
        "tour_id": request.tour_id,
        "guide_id": request.guide_id,
        "guide_language": request.guide_language,
        "tourist_language": request.tourist_language,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "participants": [
            {
                "user_id": request.guide_id,
                "user_type": "guide",
                "language": request.guide_language,
                "is_connected": False
            }
        ]
    }
    
    translation_sessions[session_id] = session
    
    return TranslationSessionResponse(**session)


@router.get("/translation-session/{session_id}", response_model=TranslationSessionResponse)
async def get_translation_session(session_id: str):
    """
    Get translation session details.
    """
    session = translation_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return TranslationSessionResponse(**session)


@router.post("/translation-session/{session_id}/join")
async def join_translation_session(
    session_id: str,
    user_id: str,
    user_type: str = "tourist",
    language: str = "en"
):
    """
    Join an existing translation session.
    """
    session = translation_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session["is_active"]:
        raise HTTPException(status_code=400, detail="Session is no longer active")
    
    # Add participant
    participant = {
        "user_id": user_id,
        "user_type": user_type,
        "language": language,
        "is_connected": True,
        "joined_at": datetime.utcnow().isoformat()
    }
    
    # Check if already in session
    existing = next((p for p in session["participants"] if p["user_id"] == user_id), None)
    if existing:
        existing.update(participant)
    else:
        session["participants"].append(participant)
    
    return {"status": "joined", "session_id": session_id, "participants_count": len(session["participants"])}


@router.delete("/translation-session/{session_id}")
async def end_translation_session(session_id: str):
    """
    End a translation session.
    """
    session = translation_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session["is_active"] = False
    
    return {"status": "ended", "session_id": session_id}

