"""
Ruta Segura Perú - Ghoscloud Integration Service
Handles external API calls for DNI, Phone, and Background checks.
"""
import httpx
import os
from loguru import logger
from typing import Dict, Any, Optional

class GhoscloudService:
    def __init__(self):
        self.base_url = os.getenv("GHOSCLOUD_API_URL", "https://api.ghoscloud.org/v1")
        self.token_dni = os.getenv("GHOSCLOUD_TOKEN_DNI")
        self.token_phone = os.getenv("GHOSCLOUD_TOKEN_PHONE")
        self.token_background = os.getenv("GHOSCLOUD_TOKEN_BACKGROUND")

    async def _request(self, endpoint: str, token: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generic request helper."""
        if not token:
            logger.error(f"Missing token for endpoint {endpoint}")
            raise ValueError(f"Configuration error: Missing token for {endpoint}")

        headers = {"Authorization": f"Bearer {token}"}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}/{endpoint}", headers=headers, params=params, timeout=10.0)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Ghoscloud API error: {e.response.text}")
                # Some APIs return 404 for not found, which is valid DNI not found etc.
                if e.response.status_code == 404:
                    return {"error": "Not found", "details": "No records found"}
                raise ValueError(f"API Error: {e.response.status_code}")
            except Exception as e:
                logger.error(f"Ghoscloud connection error: {str(e)}")
                raise ValueError("External service unavailable")

    async def check_dni_physical(self, dni: str) -> Dict[str, Any]:
        """Get physical DNI information (dnivir)."""
        raw = await self._request("dnivir", self.token_dni, {"documento": dni})
        return self._clean_person_data(raw)

    async def check_dni_virtual(self, dni: str) -> Dict[str, Any]:
        """Get virtual DNI information (dnive)."""
        raw = await self._request("dnive", self.token_dni, {"documento": dni})
        return self._clean_person_data(raw)

    async def check_by_name(self, names: str) -> Dict[str, Any]:
        """Search by name (nm). Returns list of matches."""
        # Note: 'nm' might expect 'nombres' or similar, assuming 'documento' for consistency based on user prompt, 
        # but usually name search requires name param. 
        # However, user said "curl ... https://api.ghoscloud.org/v1/nm?documento=XXXX". 
        # If XXXX is DNI, it's redundant. If it's name, param might be 'nombres'.
        # I will assume 'documento' is used as a generic search term based on user input example.
        return await self._request("nm", self.token_dni, {"documento": names})
        
    async def check_phone(self, query: str) -> Dict[str, Any]:
        """Check phone number or DNI to find phones (tel)."""
        raw = await self._request("tel", self.token_phone, {"documento": query})
        return self._clean_phone_data(raw)

    async def check_background_all(self, dni: str) -> Dict[str, Any]:
        """
        Perform a comprehensive background check.
        Returns a consolidated, clean report.
        """
        # Parallel execution could be better but sequential is safer for rate limits if any
        police = await self._safe_request("antpdf", self.token_background, {"documento": dni})
        penal = await self._safe_request("antpenal", self.token_background, {"documento": dni})
        judicial = await self._safe_request("antjud", self.token_background, {"documento": dni})

        return {
            "summary": {
                "has_police_records": self._has_records(police),
                "has_penal_records": self._has_records(penal),
                "has_judicial_records": self._has_records(judicial),
                "risk_level": self._calculate_risk(police, penal, judicial)
            },
            "details": {
                "police": self._clean_background_data(police, "Policial"),
                "penal": self._clean_background_data(penal, "Penal"),
                "judicial": self._clean_background_data(judicial, "Judicial"),
            }
        }

    def _clean_person_data(self, data: Dict) -> Dict:
        """Standardize person data structure."""
        if "error" in data: 
            return data
        
        # Adapt based on actual API response structure (assuming standard fields)
        return {
            "dni": data.get("dni", "") or data.get("numero", ""),
            "name": data.get("nombres", "") + " " + data.get("apellido_paterno", "") + " " + data.get("apellido_materno", ""),
            "full_name": data.get("nombre_completo", ""),
            "verification_code": data.get("cod_verifica", ""),
            "birth_date": data.get("fecha_nacimiento", ""),
            "address": data.get("direccion", ""),
            "raw": data # Keep raw just in case, but frontend should prefer above
        }

    def _clean_phone_data(self, data: Dict) -> Dict:
        """Clean phone search results."""
        if "error" in data: return data
        # Implement specific cleaning logic if structure is known
        return {
            "owner": data.get("titular", ""),
            "phones": data.get("telefonos", []) or [data.get("telefono", "")],
            "operator": data.get("operadora", "")
        }

    def _clean_background_data(self, data: Any, source: str) -> Dict:
        """Summarize background checks."""
        if not data or "error" in data:
            return {"status": "Clean", "records": [], "source": source}
            
        # Heuristic to detect records in unstructured JSON
        # This depends heavily on the actual API response format
        has_records = self._has_records(data)
        
        return {
            "status": "ALERT" if has_records else "Clean",
            "records": data.get("antecedentes", []) if isinstance(data, dict) else [],
            "raw_summary": str(data)[:200] + "..." if has_records else "No se encontraron registros."
        }

    def _has_records(self, data: Any) -> bool:
        """Check if API response indicates existence of records."""
        if not data: return False
        if isinstance(data, dict):
            if data.get("error"): return False
            # Common positive indicators
            if data.get("tiene_antecedentes") is True: return True
            if len(data.get("antecedentes", [])) > 0: return True
            if "no registra" in str(data).lower(): return False
        return False

    def _calculate_risk(self, police, penal, judicial) -> str:
        if self._has_records(penal) or self._has_records(judicial): return "HIGH"
        if self._has_records(police): return "MEDIUM"
        return "LOW"

    async def _safe_request(self, endpoint: str, token: str, params: Dict[str, Any]) -> Any:
        """Safe request that swallows errors and returns None/Error dict instead of raising."""
        try:
            return await self._request(endpoint, token, params)
        except Exception as e:
            return {"error": "Check failed", "message": str(e)}

ghoscloud_service = GhoscloudService()
