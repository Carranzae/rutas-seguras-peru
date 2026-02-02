"""
Ruta Segura Perú - File Upload Router
Handle file uploads for tours, documents, and user media
"""
import os
import uuid
import shutil
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/uploads", tags=["Uploads"])

# Configure upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed file types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
ALLOWED_DOCUMENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}

# Max file sizes (in bytes)
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
MAX_DOCUMENT_SIZE = 5 * 1024 * 1024  # 5MB


def validate_file(file: UploadFile, allowed_types: set, max_size: int):
    """Validate file type and size."""
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(allowed_types)}"
        )
    
    # Check file size by reading content
    file.file.seek(0, 2)  # Seek to end
    size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {max_size / 1024 / 1024}MB"
        )


def save_file(file: UploadFile, subdir: str) -> str:
    """Save file to disk and return URL path."""
    # Create subdirectory
    upload_path = os.path.join(UPLOAD_DIR, subdir)
    os.makedirs(upload_path, exist_ok=True)
    
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_path, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return URL path (relative to static serving)
    return f"/uploads/{subdir}/{filename}"


@router.post("/image", summary="Upload image")
async def upload_image(
    file: UploadFile = File(...),
    category: str = Form("general"),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a single image file.
    
    Categories: tour_cover, tour_gallery, profile, document, general
    """
    validate_file(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)
    
    # Determine subdirectory based on category
    subdir = f"images/{category}/{datetime.now().strftime('%Y/%m')}"
    url = save_file(file, subdir)
    
    return {
        "url": url,
        "filename": file.filename,
        "content_type": file.content_type,
        "category": category,
        "uploaded_by": str(current_user.id),
    }


@router.post("/images", summary="Upload multiple images")
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    category: str = Form("general"),
    current_user: User = Depends(get_current_user),
):
    """Upload multiple images at once."""
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 images per upload"
        )
    
    urls = []
    for file in files:
        validate_file(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)
        subdir = f"images/{category}/{datetime.now().strftime('%Y/%m')}"
        url = save_file(file, subdir)
        urls.append({
            "url": url,
            "filename": file.filename,
        })
    
    return {
        "urls": urls,
        "count": len(urls),
        "category": category,
    }


@router.post("/video", summary="Upload video")
async def upload_video(
    file: UploadFile = File(...),
    category: str = Form("tour"),
    current_user: User = Depends(get_current_user),
):
    """Upload a video file."""
    validate_file(file, ALLOWED_VIDEO_TYPES, MAX_VIDEO_SIZE)
    
    subdir = f"videos/{category}/{datetime.now().strftime('%Y/%m')}"
    url = save_file(file, subdir)
    
    return {
        "url": url,
        "filename": file.filename,
        "content_type": file.content_type,
        "category": category,
    }


@router.post("/document", summary="Upload document")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form("dni"),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a document (DNI, certificate, etc.)
    
    Types: dni, certificate, license, other
    """
    validate_file(file, ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE)
    
    subdir = f"documents/{document_type}/{datetime.now().strftime('%Y/%m')}"
    url = save_file(file, subdir)
    
    return {
        "url": url,
        "filename": file.filename,
        "content_type": file.content_type,
        "document_type": document_type,
        "uploaded_by": str(current_user.id),
    }


# Tour-specific media endpoints
@router.post(
    "/tour/{tour_id}/cover",
    summary="Upload tour cover image",
    dependencies=[Depends(require_roles(UserRole.AGENCY_ADMIN, UserRole.SUPER_ADMIN))],
)
async def upload_tour_cover(
    tour_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload and set tour cover image."""
    from app.models.tour import Tour
    from sqlalchemy import select
    
    validate_file(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)
    
    # Get tour
    result = await db.execute(select(Tour).where(Tour.id == tour_id))
    tour = result.scalar_one_or_none()
    
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    # Save file
    subdir = f"tours/{tour_id}/cover"
    url = save_file(file, subdir)
    
    # Update tour
    tour.cover_image_url = url
    await db.commit()
    
    return {
        "url": url,
        "tour_id": str(tour_id),
        "message": "Cover image updated successfully",
    }


@router.post(
    "/tour/{tour_id}/gallery",
    summary="Add images to tour gallery",
    dependencies=[Depends(require_roles(UserRole.AGENCY_ADMIN, UserRole.SUPER_ADMIN))],
)
async def upload_tour_gallery(
    tour_id: uuid.UUID,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add images to tour gallery."""
    from app.models.tour import Tour
    from sqlalchemy import select
    
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 images per upload"
        )
    
    # Get tour
    result = await db.execute(select(Tour).where(Tour.id == tour_id))
    tour = result.scalar_one_or_none()
    
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    # Save files
    urls = []
    for file in files:
        validate_file(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)
        subdir = f"tours/{tour_id}/gallery"
        url = save_file(file, subdir)
        urls.append(url)
    
    # Update tour gallery
    current_gallery = tour.gallery_urls or []
    tour.gallery_urls = current_gallery + urls
    await db.commit()
    
    return {
        "urls": urls,
        "total_gallery_images": len(tour.gallery_urls),
        "tour_id": str(tour_id),
    }


@router.delete(
    "/tour/{tour_id}/gallery",
    summary="Remove image from tour gallery",
    dependencies=[Depends(require_roles(UserRole.AGENCY_ADMIN, UserRole.SUPER_ADMIN))],
)
async def remove_from_tour_gallery(
    tour_id: uuid.UUID,
    image_url: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove an image from tour gallery."""
    from app.models.tour import Tour
    from sqlalchemy import select
    
    # Get tour
    result = await db.execute(select(Tour).where(Tour.id == tour_id))
    tour = result.scalar_one_or_none()
    
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    # Remove from gallery
    if tour.gallery_urls and image_url in tour.gallery_urls:
        tour.gallery_urls = [url for url in tour.gallery_urls if url != image_url]
        await db.commit()
        
        # Optionally delete file from disk
        # file_path = os.path.join(UPLOAD_DIR, image_url.replace("/uploads/", ""))
        # if os.path.exists(file_path):
        #     os.remove(file_path)
    
    return {
        "message": "Image removed from gallery",
        "remaining_images": len(tour.gallery_urls or []),
    }
