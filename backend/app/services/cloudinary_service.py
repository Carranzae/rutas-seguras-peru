"""
Ruta Segura Perú - Cloudinary Media Service
Handles 360 photos, videos, and optimized mobile assets
"""
import os
import cloudinary
import cloudinary.uploader
import cloudinary.api
from typing import Optional, Dict, Any, List, BinaryIO
from fastapi import UploadFile, HTTPException
from loguru import logger
from pydantic import BaseModel


class MediaUploadResult(BaseModel):
    """Result from media upload operation"""
    public_id: str
    secure_url: str
    resource_type: str
    format: str
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None  # For videos
    bytes: int
    thumbnail_url: Optional[str] = None


class CloudinaryService:
    """
    Cloudinary service for media uploads and optimization.
    Handles tour photos (including 360), videos, and profile images.
    """
    
    def __init__(self):
        self._configured = False
        self._configure()
    
    def _configure(self):
        """Configure Cloudinary from environment variables"""
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
        api_key = os.getenv("CLOUDINARY_API_KEY")
        api_secret = os.getenv("CLOUDINARY_API_SECRET")
        
        if all([cloud_name, api_key, api_secret]):
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret,
                secure=True
            )
            self._configured = True
            logger.info(f"Cloudinary configured for cloud: {cloud_name}")
        else:
            logger.warning("Cloudinary not configured - missing environment variables")
    
    def is_configured(self) -> bool:
        return self._configured
    
    async def upload_tour_image(
        self,
        file: UploadFile,
        tour_id: str,
        is_360: bool = False,
        is_cover: bool = False,
    ) -> MediaUploadResult:
        """
        Upload a tour image with automatic optimization for mobile.
        
        Args:
            file: The uploaded file
            tour_id: Tour ID for organization
            is_360: If True, preserve full resolution for 360 viewer
            is_cover: If True, optimize for cover display
        """
        if not self._configured:
            raise HTTPException(status_code=503, detail="Media service not configured")
        
        try:
            contents = await file.read()
            
            # Build transformation options
            transformation = []
            
            if is_cover:
                # Optimized cover image: 1200px wide, auto quality, WebP
                transformation = [
                    {"width": 1200, "crop": "limit"},
                    {"quality": "auto:good"},
                    {"fetch_format": "auto"}
                ]
            elif is_360:
                # 360 photos: preserve resolution, slight compression
                transformation = [
                    {"quality": "auto:best"},
                    {"fetch_format": "auto"}
                ]
            else:
                # Gallery images: 800px, auto quality
                transformation = [
                    {"width": 800, "crop": "limit"},
                    {"quality": "auto:good"},
                    {"fetch_format": "auto"}
                ]
            
            # Determine folder structure
            folder = f"ruta-segura/tours/{tour_id}"
            if is_360:
                folder += "/360"
            elif is_cover:
                folder += "/cover"
            else:
                folder += "/gallery"
            
            result = cloudinary.uploader.upload(
                contents,
                folder=folder,
                resource_type="image",
                transformation=transformation,
                eager=[
                    # Generate thumbnail
                    {"width": 300, "height": 200, "crop": "fill", "quality": "auto:low"}
                ],
                eager_async=True
            )
            
            return MediaUploadResult(
                public_id=result["public_id"],
                secure_url=result["secure_url"],
                resource_type=result["resource_type"],
                format=result["format"],
                width=result.get("width"),
                height=result.get("height"),
                bytes=result["bytes"],
                thumbnail_url=result.get("eager", [{}])[0].get("secure_url")
            )
            
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {e}")
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
    async def upload_tour_video(
        self,
        file: UploadFile,
        tour_id: str,
    ) -> MediaUploadResult:
        """
        Upload a tour video with mobile optimization.
        Auto-generates thumbnail and compressed versions.
        """
        if not self._configured:
            raise HTTPException(status_code=503, detail="Media service not configured")
        
        try:
            contents = await file.read()
            
            folder = f"ruta-segura/tours/{tour_id}/videos"
            
            result = cloudinary.uploader.upload(
                contents,
                folder=folder,
                resource_type="video",
                eager=[
                    # Mobile optimized version (720p, VP9)
                    {"width": 1280, "height": 720, "crop": "limit", "quality": "auto", "format": "mp4"},
                    # Low quality preview
                    {"width": 480, "height": 270, "crop": "limit", "quality": 50, "format": "mp4"},
                ],
                eager_async=True
            )
            
            # Get video thumbnail
            thumbnail_url = cloudinary.utils.cloudinary_url(
                result["public_id"],
                resource_type="video",
                format="jpg",
                transformation=[
                    {"width": 400, "height": 225, "crop": "fill"},
                    {"start_offset": "auto"}
                ]
            )[0]
            
            return MediaUploadResult(
                public_id=result["public_id"],
                secure_url=result["secure_url"],
                resource_type=result["resource_type"],
                format=result["format"],
                width=result.get("width"),
                height=result.get("height"),
                duration=result.get("duration"),
                bytes=result["bytes"],
                thumbnail_url=thumbnail_url
            )
            
        except Exception as e:
            logger.error(f"Video upload failed: {e}")
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
    async def upload_profile_image(
        self,
        file: UploadFile,
        user_id: str,
    ) -> MediaUploadResult:
        """Upload user profile image with face-centered cropping"""
        if not self._configured:
            raise HTTPException(status_code=503, detail="Media service not configured")
        
        try:
            contents = await file.read()
            
            result = cloudinary.uploader.upload(
                contents,
                folder=f"ruta-segura/users/{user_id}",
                resource_type="image",
                transformation=[
                    {"width": 400, "height": 400, "gravity": "face", "crop": "fill"},
                    {"quality": "auto:good"},
                    {"fetch_format": "auto"}
                ]
            )
            
            return MediaUploadResult(
                public_id=result["public_id"],
                secure_url=result["secure_url"],
                resource_type=result["resource_type"],
                format=result["format"],
                width=result.get("width"),
                height=result.get("height"),
                bytes=result["bytes"]
            )
            
        except Exception as e:
            logger.error(f"Profile upload failed: {e}")
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
    async def delete_media(self, public_id: str, resource_type: str = "image") -> bool:
        """Delete media from Cloudinary"""
        if not self._configured:
            return False
        
        try:
            result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
            return result.get("result") == "ok"
        except Exception as e:
            logger.error(f"Delete failed: {e}")
            return False
    
    def get_optimized_url(
        self,
        public_id: str,
        width: int = 800,
        quality: str = "auto"
    ) -> str:
        """Generate optimized URL for existing media"""
        url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            transformation=[
                {"width": width, "crop": "limit"},
                {"quality": quality},
                {"fetch_format": "auto"}
            ]
        )
        return url


# Singleton instance
cloudinary_service = CloudinaryService()
