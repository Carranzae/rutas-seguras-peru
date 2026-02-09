"""
Ruta Segura Perú - Media Upload Router
Endpoints for tour images, videos, and profile photos
"""
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from loguru import logger

from app.services.cloudinary_service import cloudinary_service, MediaUploadResult
from app.core.dependencies import CurrentUser

router = APIRouter(prefix="/media", tags=["Media Upload"])


@router.post(
    "/tour/{tour_id}/image",
    response_model=MediaUploadResult,
    summary="Upload tour image",
    description="Upload an image for a tour. Supports regular, cover, and 360 images.",
)
async def upload_tour_image(
    tour_id: str,
    file: UploadFile = File(...),
    is_360: bool = Form(False),
    is_cover: bool = Form(False),
    current_user: CurrentUser = None,  # Make optional for simpler testing
):
    """Upload a tour image with automatic mobile optimization"""
    if not cloudinary_service.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Servicio de medios no configurado. Configure CLOUDINARY_* variables."
        )
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes")
    
    # Max 10MB
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Imagen muy grande (máx 10MB)")
    
    await file.seek(0)
    
    result = await cloudinary_service.upload_tour_image(
        file=file,
        tour_id=tour_id,
        is_360=is_360,
        is_cover=is_cover,
    )
    
    logger.info(f"Tour image uploaded | Tour: {tour_id} | 360: {is_360} | Cover: {is_cover}")
    return result


@router.post(
    "/tour/{tour_id}/video",
    response_model=MediaUploadResult,
    summary="Upload tour video",
)
async def upload_tour_video(
    tour_id: str,
    file: UploadFile = File(...),
):
    """Upload a tour video with automatic compression and thumbnail"""
    if not cloudinary_service.is_configured():
        raise HTTPException(status_code=503, detail="Servicio de medios no configurado")
    
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Solo se permiten videos")
    
    # Max 100MB for videos
    contents = await file.read()
    if len(contents) > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Video muy grande (máx 100MB)")
    
    await file.seek(0)
    
    result = await cloudinary_service.upload_tour_video(file=file, tour_id=tour_id)
    logger.info(f"Tour video uploaded | Tour: {tour_id} | Duration: {result.duration}s")
    return result


@router.post(
    "/profile",
    response_model=MediaUploadResult,
    summary="Upload profile image",
)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: CurrentUser = None,
):
    """Upload user profile image with face-centered cropping"""
    if not cloudinary_service.is_configured():
        raise HTTPException(status_code=503, detail="Servicio de medios no configurado")
    
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes")
    
    user_id = str(current_user.id) if current_user else "anonymous"
    result = await cloudinary_service.upload_profile_image(file=file, user_id=user_id)
    
    logger.info(f"Profile image uploaded | User: {user_id}")
    return result


@router.delete(
    "/{public_id:path}",
    summary="Delete media",
)
async def delete_media(
    public_id: str,
    resource_type: str = "image",
):
    """Delete media from Cloudinary"""
    success = await cloudinary_service.delete_media(public_id, resource_type)
    if not success:
        raise HTTPException(status_code=404, detail="No se pudo eliminar el archivo")
    return {"deleted": True, "public_id": public_id}
