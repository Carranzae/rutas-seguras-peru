"""
Ruta Segura Perú - Translation Router
Audio transcription and translation using OpenAI Whisper
"""
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from loguru import logger

from app.services.whisper_service import whisper_service

router = APIRouter(prefix="/translation", tags=["Translation"])


class TranslationResponse(BaseModel):
    """Response from audio translation"""
    original_text: str
    source_language: str
    translated_text: str
    target_language: str


class TranscriptionResponse(BaseModel):
    """Response from audio transcription"""
    text: str
    detected_language: Optional[str] = None


@router.post(
    "/transcribe",
    response_model=TranscriptionResponse,
    summary="Transcribe audio to text",
    description="Use OpenAI Whisper to transcribe audio. Supports webm, mp3, m4a, wav.",
)
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
):
    """
    Transcribe audio to text.
    Returns the transcribed text and detected language.
    """
    if not whisper_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="Servicio de traducción no configurado. Configure OPENAI_API_KEY."
        )
    
    # Validate file type
    valid_types = ["audio/webm", "audio/mp3", "audio/mpeg", "audio/m4a", "audio/wav", "audio/x-wav"]
    if audio.content_type and audio.content_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Formato no soportado. Use: webm, mp3, m4a, wav"
        )
    
    # Max 25MB (Whisper limit)
    contents = await audio.read()
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio muy grande (máx 25MB)")
    
    # Determine format from filename or content type
    audio_format = "webm"
    if audio.filename:
        audio_format = audio.filename.split(".")[-1].lower()
    
    try:
        text, detected_lang = await whisper_service.transcribe_audio(
            audio_data=contents,
            audio_format=audio_format,
            language=language,
        )
        
        logger.info(f"Transcription complete | Lang: {detected_lang} | Length: {len(text)}")
        
        return TranscriptionResponse(
            text=text,
            detected_language=detected_lang,
        )
        
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise HTTPException(status_code=500, detail="Error en la transcripción")


@router.post(
    "/translate",
    response_model=TranslationResponse,
    summary="Transcribe and translate audio",
    description="Transcribe audio and translate to target language. Default target: Spanish.",
)
async def translate_audio(
    audio: UploadFile = File(...),
    target_language: str = Form("es"),
):
    """
    Full translation pipeline:
    1. Transcribe audio (detect source language)
    2. Translate to target language if different
    
    Response time target: <2 seconds for short audio.
    """
    if not whisper_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="Servicio de traducción no configurado. Configure OPENAI_API_KEY."
        )
    
    # Validate file
    contents = await audio.read()
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio muy grande (máx 25MB)")
    
    audio_format = "webm"
    if audio.filename:
        audio_format = audio.filename.split(".")[-1].lower()
    
    try:
        result = await whisper_service.transcribe_and_translate(
            audio_data=contents,
            audio_format=audio_format,
            target_language=target_language,
        )
        
        logger.info(
            f"Translation complete | {result['source_language']} -> {target_language}"
        )
        
        return TranslationResponse(**result)
        
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        raise HTTPException(status_code=500, detail="Error en la traducción")


@router.post(
    "/to-english",
    response_model=TranscriptionResponse,
    summary="Translate audio to English",
    description="Translate any audio directly to English text using Whisper's native translation.",
)
async def translate_to_english(
    audio: UploadFile = File(...),
):
    """
    Direct translation to English using Whisper's built-in translation.
    Faster than transcribe + translate for English target.
    """
    if not whisper_service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no configurado")
    
    contents = await audio.read()
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio muy grande (máx 25MB)")
    
    audio_format = audio.filename.split(".")[-1].lower() if audio.filename else "webm"
    
    try:
        text = await whisper_service.translate_audio_to_english(
            audio_data=contents,
            audio_format=audio_format,
        )
        
        return TranscriptionResponse(text=text, detected_language="en")
        
    except Exception as e:
        logger.error(f"Translation to English failed: {e}")
        raise HTTPException(status_code=500, detail="Error en la traducción")
