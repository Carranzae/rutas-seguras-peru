"""
Ruta Segura Perú - OpenAI Whisper Translation Service
Real-time audio-to-text and translation processing
"""
import os
import io
import tempfile
from typing import Optional, Tuple
from loguru import logger

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("openai package not installed")


class WhisperService:
    """
    OpenAI Whisper service for speech-to-text and translation.
    Processes audio from mobile app and returns transcribed/translated text.
    """
    
    def __init__(self):
        self._client: Optional[openai.OpenAI] = None
        self._initialize()
    
    def _initialize(self):
        """Initialize OpenAI client"""
        if not OPENAI_AVAILABLE:
            logger.warning("OpenAI not available")
            return
        
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            self._client = openai.OpenAI(api_key=api_key)
            logger.info("OpenAI Whisper service initialized")
        else:
            logger.warning("OPENAI_API_KEY not configured")
    
    def is_available(self) -> bool:
        return self._client is not None
    
    async def transcribe_audio(
        self,
        audio_data: bytes,
        audio_format: str = "webm",
        language: Optional[str] = None,
    ) -> Tuple[str, Optional[str]]:
        """
        Transcribe audio to text using Whisper.
        
        Args:
            audio_data: Raw audio bytes
            audio_format: Format of the audio (webm, mp3, m4a, wav)
            language: ISO language code (auto-detect if None)
        
        Returns:
            Tuple of (transcribed_text, detected_language)
        """
        if not self.is_available():
            raise RuntimeError("Whisper service not configured")
        
        try:
            # Write to temp file (Whisper API requires file-like object)
            with tempfile.NamedTemporaryFile(
                suffix=f".{audio_format}",
                delete=False
            ) as tmp:
                tmp.write(audio_data)
                tmp_path = tmp.name
            
            with open(tmp_path, "rb") as audio_file:
                response = self._client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                    response_format="verbose_json",
                )
            
            # Clean up temp file
            os.unlink(tmp_path)
            
            return response.text, response.language
            
        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")
            raise
    
    async def translate_audio_to_english(
        self,
        audio_data: bytes,
        audio_format: str = "webm",
    ) -> str:
        """
        Transcribe and translate audio to English using Whisper.
        Useful for translating foreign tourists' speech to English.
        """
        if not self.is_available():
            raise RuntimeError("Whisper service not configured")
        
        try:
            with tempfile.NamedTemporaryFile(
                suffix=f".{audio_format}",
                delete=False
            ) as tmp:
                tmp.write(audio_data)
                tmp_path = tmp.name
            
            with open(tmp_path, "rb") as audio_file:
                response = self._client.audio.translations.create(
                    model="whisper-1",
                    file=audio_file,
                )
            
            os.unlink(tmp_path)
            return response.text
            
        except Exception as e:
            logger.error(f"Whisper translation failed: {e}")
            raise
    
    async def transcribe_and_translate(
        self,
        audio_data: bytes,
        audio_format: str = "webm",
        target_language: str = "es",
    ) -> dict:
        """
        Full pipeline: transcribe audio, detect language, translate if needed.
        
        Returns:
            {
                "original_text": str,
                "source_language": str,
                "translated_text": str,
                "target_language": str
            }
        """
        if not self.is_available():
            raise RuntimeError("Whisper service not configured")
        
        try:
            # Step 1: Transcribe to get original text and language
            original_text, source_language = await self.transcribe_audio(
                audio_data, audio_format
            )
            
            # Step 2: If source and target are same, no translation needed
            if source_language and source_language.lower() == target_language.lower():
                return {
                    "original_text": original_text,
                    "source_language": source_language,
                    "translated_text": original_text,
                    "target_language": target_language,
                }
            
            # Step 3: Use GPT for translation (Whisper only translates to English)
            if target_language.lower() == "en":
                translated_text = await self.translate_audio_to_english(
                    audio_data, audio_format
                )
            else:
                # Use GPT-4 for other language translations
                translated_text = await self._translate_with_gpt(
                    original_text, source_language, target_language
                )
            
            return {
                "original_text": original_text,
                "source_language": source_language,
                "translated_text": translated_text,
                "target_language": target_language,
            }
            
        except Exception as e:
            logger.error(f"Transcribe and translate failed: {e}")
            raise
    
    async def _translate_with_gpt(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
    ) -> str:
        """Use GPT-4 for text-to-text translation"""
        try:
            response = self._client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a translator. Translate the following text from {source_lang} to {target_lang}. Only respond with the translation, nothing else."
                    },
                    {
                        "role": "user",
                        "content": text
                    }
                ],
                temperature=0.3,
                max_tokens=500,
            )
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"GPT translation failed: {e}")
            return text  # Return original on failure


# Singleton
whisper_service = WhisperService()
