import os
import httpx
from typing import Dict, Any, Optional
from loguru import logger
from fastapi import HTTPException

# Core configuration for Ghoscloud
GHOSCLOUD_API_URL = os.getenv("GHOSCLOUD_API_URL", "https://api.ghoscloud.org/v1")
GHOSCLOUD_TOKEN_DNI = os.getenv("GHOSCLOUD_TOKEN_DNI", "")
GHOSCLOUD_TOKEN_PHONE = os.getenv("GHOSCLOUD_TOKEN_PHONE", "")
GHOSCLOUD_TOKEN_BACKGROUND = os.getenv("GHOSCLOUD_TOKEN_BACKGROUND", "")

class GhoscloudService:
    """
    Integration service to securely communicate with the Ghoscloud REST API
    for Identity and Background verifications, abstracting away the private tokens.
    """

    @staticmethod
    async def _make_request(endpoint: str, token: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generic method to make a GET request to Ghoscloud API."""
        if not token:
            logger.error(f"Ghoscloud API Token missing for endpoint {endpoint}")
            raise HTTPException(status_code=500, detail="Ghoscloud API not configured properly")

        url = f"{GHOSCLOUD_API_URL}{endpoint}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, params=params, timeout=15.0)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Ghoscloud HTTP error for {url}: {e.response.text}")
                # We do not forward the direct error to the frontend to avoid leaking token info
                raise HTTPException(status_code=e.response.status_code, detail="Error communicating with verification provider")
            except httpx.RequestError as e:
                logger.error(f"Ghoscloud Request error for {url}: {str(e)}")
                raise HTTPException(status_code=503, detail="Verification provider is temporarily unavailable")
            except Exception as e:
                logger.error(f"Unexpected error in Ghoscloud integration: {str(e)}")
                raise HTTPException(status_code=500, detail="Internal server error verifying identity")

    async def get_dni_info(self, dni_number: str) -> Dict[str, Any]:
        """
        Fetch basic information from a physical DNI (dnivir) mapping.
        Assumes Ghoscloud has an endpoint like /dni/{dni_number} or similar.
        Note: Exact endpoint depends on Ghoscloud documentation.
        For illustration, using /reniec/dni endpoint.
        """
        logger.info(f"Requesting DNI info for: {dni_number}")
        # Need to adjust endpoint to exact Ghoscloud specification
        return await self._make_request(
            endpoint="/reniec/dni",
            token=GHOSCLOUD_TOKEN_DNI,
            params={"documento": dni_number}
        )

    async def get_background_checks(self, document_number: str, document_type: str = "DNI") -> Dict[str, Any]:
        """
        Fetch Judicial, Penal, and Police records.
        """
        logger.info(f"Requesting Background checks for: {document_number}")
        # Example endpoint assuming a unified background check or specific params
        return await self._make_request(
            endpoint="/antecedentes",
            token=GHOSCLOUD_TOKEN_BACKGROUND,
            params={
                "documento": document_number,
                "tipo_documento": document_type
            }
        )
        
    async def verify_phone_number(self, phone: str) -> Dict[str, Any]:
        """
        Fetch phone titular information.
        """
        logger.info(f"Requesting Phone titular info for: {phone}")
        return await self._make_request(
            endpoint="/telefonia",
            token=GHOSCLOUD_TOKEN_PHONE,
            params={"numero": phone}
        )

# Singleton instance
ghoscloud_service = GhoscloudService()
