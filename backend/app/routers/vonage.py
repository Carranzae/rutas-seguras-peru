"""
Ruta Segura Perú - Vonage Router
Endpoints for Vonage webhooks and status updates
"""
from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse
from loguru import logger

from app.integrations.vonage_service import vonage_service

router = APIRouter(prefix="/vonage", tags=["Vonage Webhooks"])


@router.get(
    "/ncco",
    summary="Get NCCO for voice calls",
    description="Returns NCCO JSON for Vonage Voice API.",
)
async def get_ncco(
    message: str = Query(
        default="Alerta de emergencia de Ruta Segura Perú.",
        description="Message to speak via TTS"
    ),
):
    """
    Generate NCCO (Nexmo Call Control Object) for voice call TTS.
    
    This endpoint is called by Vonage when a call is answered.
    Returns NCCO that tells Vonage what to say.
    """
    ncco = vonage_service.generate_ncco(message)
    return JSONResponse(content=ncco)


@router.post(
    "/voice/event",
    summary="Voice event webhook",
    description="Webhook called by Vonage when call status changes.",
)
async def voice_event_webhook(request: Request):
    """
    Handle voice call events from Vonage.
    
    Vonage calls this endpoint when:
    - Call is initiated (started)
    - Call is ringing
    - Call is answered
    - Call is completed
    - Call fails
    """
    try:
        data = await request.json()
        
        logger.info(
            f"Vonage voice event | UUID: {data.get('uuid')} | "
            f"Status: {data.get('status')} | Direction: {data.get('direction')}"
        )
        
        # TODO: Update emergency record with call status
        
        return {"status": "received"}
    except Exception as e:
        logger.error(f"Voice event error: {e}")
        return {"status": "error", "message": str(e)}


@router.post(
    "/voice/answer",
    summary="Voice answer webhook",
    description="Called when call is answered, returns NCCO.",
)
async def voice_answer_webhook(request: Request):
    """
    Handle incoming call answers.
    Returns NCCO with TTS message.
    """
    # Default emergency message
    ncco = vonage_service.generate_ncco(
        "Alerta de emergencia de Ruta Segura Perú. "
        "Un turista ha activado el botón de pánico. "
        "Por favor verifique el sistema inmediatamente."
    )
    return JSONResponse(content=ncco)


@router.post(
    "/sms/status",
    summary="SMS status webhook",
    description="Webhook called by Vonage when SMS status changes.",
)
async def sms_status_webhook(request: Request):
    """
    Handle SMS status updates from Vonage.
    
    Vonage calls this endpoint when:
    - Message is submitted
    - Message is delivered
    - Message fails
    """
    try:
        data = await request.json()
        
        logger.info(
            f"Vonage SMS status | ID: {data.get('message-id')} | "
            f"Status: {data.get('status')} | To: {data.get('to')}"
        )
        
        # TODO: Update emergency record with SMS status
        
        return {"status": "received"}
    except Exception as e:
        logger.error(f"SMS status error: {e}")
        return {"status": "error", "message": str(e)}


@router.post(
    "/message/status",
    summary="Messages API status webhook",
    description="Webhook for WhatsApp/Messages API status.",
)
async def message_status_webhook(request: Request):
    """
    Handle WhatsApp/Viber message status updates.
    """
    try:
        data = await request.json()
        
        logger.info(
            f"Vonage message status | UUID: {data.get('message_uuid')} | "
            f"Status: {data.get('status')} | Channel: {data.get('channel')}"
        )
        
        return {"status": "received"}
    except Exception as e:
        logger.error(f"Message status error: {e}")
        return {"status": "error", "message": str(e)}


@router.post(
    "/message/inbound",
    summary="Inbound message webhook",
    description="Webhook for incoming WhatsApp messages.",
)
async def inbound_message_webhook(request: Request):
    """
    Handle incoming WhatsApp messages.
    Could be used for two-way communication in emergencies.
    """
    try:
        data = await request.json()
        
        logger.info(
            f"Vonage inbound message | From: {data.get('from')} | "
            f"Channel: {data.get('channel')} | Text: {data.get('text', '')[:50]}"
        )
        
        # TODO: Process incoming messages (e.g., "OK" confirmations)
        
        return {"status": "received"}
    except Exception as e:
        logger.error(f"Inbound message error: {e}")
        return {"status": "error", "message": str(e)}
