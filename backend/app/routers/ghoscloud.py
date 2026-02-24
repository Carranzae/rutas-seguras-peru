from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.dependencies import get_current_admin
from app.integrations.ghoscloud_service import ghoscloud_service
from app.models.user import User

router = APIRouter(prefix="/ghoscloud", tags=["Ghoscloud Verification"])

@router.get("/dni/{document_number}", summary="Verify DNI via Ghoscloud")
async def verify_dni(
    document_number: str,
    admin: User = Depends(get_current_admin)
):
    """
    Fetch DNI titular information from Ghoscloud.
    Restricted to Super Admin users only to prevent abuse of API quota.
    """
    try:
        data = await ghoscloud_service.get_dni_info(document_number)
        return {"status": "success", "data": data}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/background/{document_number}", summary="Fetch Judicial/Penal/Police records via Ghoscloud")
async def verify_background(
    document_number: str,
    document_type: str = Query("DNI", description="Type of document (e.g. DNI, CE)"),
    admin: User = Depends(get_current_admin)
):
    """
    Fetch detailed background checks from Ghoscloud.
    Restricted to Super Admin users only.
    """
    try:
        data = await ghoscloud_service.get_background_checks(document_number, document_type)
        return {"status": "success", "data": data}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/phone/{phone_number}", summary="Fetch Phone titular info via Ghoscloud")
async def verify_phone(
    phone_number: str,
    admin: User = Depends(get_current_admin)
):
    """
    Verify who owns a particular phone number in Peru via Ghoscloud.
    Restricted to Super Admin users only.
    """
    try:
        # Strip '+' if present, as local APIs usually expect 9 digits
        clean_phone = phone_number.replace("+51", "").replace("+", "").strip()
        data = await ghoscloud_service.verify_phone_number(clean_phone)
        return {"status": "success", "data": data}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
